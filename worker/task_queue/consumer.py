"""
Queue consumer -- connects to Redis and processes tasks.

Protocol:
  - Backend pushes:  LPUSH task-processing:jobs <JSON>
  - Worker consumes: BRPOP task-processing:jobs  (blocking, 5s timeout)

Job payload JSON schema:
  {
    "taskId":    "<MongoDB ObjectId string>",
    "operation": "uppercase" | "lowercase" | "reverse" | "word_count",
    "inputText": "<string>"
  }
"""

from __future__ import annotations

import datetime
import json
import os
import signal
import time

import redis
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

load_dotenv()

from logger.logger import setup_logger  # noqa: E402
from processor.task_processor import processor  # noqa: E402

log = setup_logger("task_queue.consumer")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MONGO_URI = os.getenv("MONGO_URI", "")
QUEUE_KEY = "task-processing:jobs"  # Must match backend LPUSH key exactly
BRPOP_TIMEOUT = 5  # seconds; 0 = block forever

# -- Status constants ---------------------------------------------------------
STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_SUCCESS = "success"
STATUS_FAILED = "failed"


class WorkerConsumer:
    """
    Polls a Redis list with BRPOP and processes tasks, updating MongoDB after each job.
    Reconnects to Redis automatically on connection loss.
    """

    def __init__(self) -> None:
        self._running = True
        self.redis_client: redis.Redis | None = None
        self.mongo_collection: Collection | None = None
        log.info("Worker consumer initialised", extra={"redis": REDIS_URL, "queue": QUEUE_KEY})

    # -- Signal handling ------------------------------------------------------
    def _setup_signals(self) -> None:
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

    def _handle_signal(self, signum, frame) -> None:
        log.info(f"Received signal {signum}. Shutting down gracefully...")
        self._running = False

    # -- Redis connection ------------------------------------------------------
    def _connect_redis(self) -> bool:
        """Attempt to connect to Redis. Returns True on success."""
        try:
            client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=10,
                retry_on_timeout=True,
            )
            client.ping()
            self.redis_client = client
            log.info("Connected to Redis", extra={"url": REDIS_URL})
            return True
        except redis.exceptions.ConnectionError as e:
            log.warning(f"Redis not available: {e}. Will retry...")
            return False
        except Exception as e:
            log.error(f"Unexpected Redis error: {e}", exc_info=True)
            return False

    def _ensure_redis(self) -> bool:
        """Return True if Redis is connected (reconnecting if needed)."""
        if self.redis_client is not None:
            try:
                self.redis_client.ping()
                return True
            except Exception:
                log.warning("Redis connection lost. Reconnecting...")
                self.redis_client = None
        return self._connect_redis()

    # -- MongoDB connection ----------------------------------------------------
    def _connect_mongo(self) -> bool:
        """Connect to MongoDB. Returns True on success."""
        if not MONGO_URI:
            log.error("MONGO_URI is not set. Cannot connect to MongoDB.")
            return False
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # get_database() extracts the DB name from the URI path component
            db = client.get_database()
            self.mongo_collection = db["tasks"]
            client.admin.command("ping")
            log.info("Connected to MongoDB")
            return True
        except Exception as e:
            log.error(f"MongoDB connection error: {e}", exc_info=True)
            return False

    # -- Task processing -------------------------------------------------------
    def _update_task(self, task_id: ObjectId, update: dict) -> None:
        """Update a task document in MongoDB, swallowing errors."""
        if self.mongo_collection is None:
            log.warning("MongoDB not connected — skipping task update.")
            return
        try:
            update.setdefault("updatedAt", datetime.datetime.utcnow())
            self.mongo_collection.update_one({"_id": task_id}, {"$set": update})
        except Exception as e:
            log.error(f"MongoDB update failed for task {task_id}: {e}", exc_info=True)

    def _process_job(self, payload: dict) -> None:
        """Process a single job from the queue."""
        task_id_str = payload.get("taskId")
        operation = payload.get("operation")
        input_text = payload.get("inputText", "")

        if not task_id_str or not operation:
            log.error("Invalid job payload (missing taskId or operation)", extra={"payload": payload})
            return

        try:
            task_id = ObjectId(task_id_str)
        except Exception:
            log.error(f"Invalid taskId format: {task_id_str}")
            return

        log.info(f"Processing task {task_id_str} -- operation: {operation}")

        try:
            result, execution_time_us, logs = processor.process(operation, input_text)
            self._update_task(
                task_id,
                {
                    "status": STATUS_SUCCESS,
                    "result": result,
                    "logs": logs,
                    "executionTime": execution_time_us,
                },
            )
            log.info(f"Task {task_id_str} completed ({execution_time_us:.1f} us)")

        except ValueError as e:
            log.error(f"Task {task_id_str} failed (unsupported operation): {e}")
            self._update_task(task_id, {"status": STATUS_FAILED, "logs": [f"[ERROR] {e}"]})

        except Exception as e:
            log.error(f"Task {task_id_str} failed: {e}", exc_info=True)
            self._update_task(
                task_id,
                {"status": STATUS_FAILED, "logs": [f"[ERROR] Processing failed: {e}"]},
            )

    # -- Main loop ------------------------------------------------------------
    def run(self) -> None:
        """Blocking consumer loop with Redis reconnect."""
        self._setup_signals()
        self._connect_mongo()
        log.info(f"Worker started. Listening on Redis list: {QUEUE_KEY!r}")

        while self._running:
            if not self._ensure_redis():
                time.sleep(5)
                continue

            try:
                result = self.redis_client.brpop([QUEUE_KEY], timeout=BRPOP_TIMEOUT)
                if result is None:
                    continue  # timeout -- loop and check self._running
                _, raw_payload = result
                payload = json.loads(raw_payload)
                self._process_job(payload)

            except redis.exceptions.ConnectionError as e:
                log.warning(f"Redis connection error during BRPOP: {e}. Will reconnect...")
                self.redis_client = None
            except json.JSONDecodeError as e:
                log.error(f"Failed to parse job payload: {e}")
            except Exception as e:
                log.error(f"Unexpected error in consumer loop: {e}", exc_info=True)

        if self.redis_client:
            self.redis_client.close()
        log.info("Worker consumer shut down.")


def main() -> None:
    consumer = WorkerConsumer()
    consumer.run()
