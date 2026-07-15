"""
Queue consumer — connects to Redis and processes tasks.

Protocol:
  - Backend pushes:  LPUSH task-processing:jobs <JSON>
  - Worker consumes: BRPOP task-processing:jobs  (blocking, timeout 5s)

Job payload JSON schema:
  {
    "taskId":    "<MongoDB ObjectId string>",
    "operation": "uppercase" | "lowercase" | "reverse" | "word_count",
    "inputText": "<string>"
  }
"""

from __future__ import annotations

import json
import os
import signal
import sys
import time

import redis
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# Local imports — PYTHONPATH=/app must be set (see Dockerfile / main.py)
from logger.logger import setup_logger
from processor.task_processor import processor

log = setup_logger("queue.consumer")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MONGO_URI = os.getenv("MONGO_URI", "")
QUEUE_KEY = "task-processing:jobs"  # Must match backend LPUSH key
BRPOP_TIMEOUT = 5  # seconds; 0 = block forever

# ── Status constants ─────────────────────────────────────────────────────────
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
        self.mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10_000)
        db_name = MONGO_URI.split("/")[-1].split("?")[0]
        self.tasks_col: Collection = self.mongo_client[db_name]["tasks"]

        # Graceful shutdown
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

        log.info("Worker consumer initialised", extra={"redis": REDIS_URL, "queue": QUEUE_KEY})

    # ── Signal handling ───────────────────────────────────────────────────────

    def _handle_signal(self, signum: int, frame) -> None:
        log.info(f"Received signal {signum}. Shutting down gracefully…")
        self._running = False

    # ── Redis connection ──────────────────────────────────────────────────────

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
            log.info("✅ Connected to Redis", extra={"url": REDIS_URL})
            return True
        except redis.exceptions.ConnectionError as e:
            log.warning(f"Redis not available: {e}. Will retry…")
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
                log.warning("Redis connection lost. Reconnecting…")
                self.redis_client = None

        return self._connect_redis()

    # ── MongoDB helpers ───────────────────────────────────────────────────────

    def _update_task_status(self, task_id: str, status: str) -> None:
        self.tasks_col.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": status, "updatedAt": __import__("datetime").datetime.utcnow()}},
        )

    def _save_result(
        self,
        task_id: str,
        result: str,
        logs: list[str],
        execution_time: int,
        status: str,
    ) -> None:
        import datetime

        self.tasks_col.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "result": result,
                    "logs": logs,
                    "executionTime": execution_time,
                    "status": status,
                    "updatedAt": datetime.datetime.utcnow(),
                }
            },
        )

    # ── Job processing ────────────────────────────────────────────────────────

    def _process_job(self, raw_payload: str) -> None:
        """Parse and execute a single job."""
        try:
            job_data = json.loads(raw_payload)
        except json.JSONDecodeError as e:
            log.error(f"Invalid JSON payload — skipping: {e}  raw={raw_payload!r}")
            return

        task_id = job_data.get("taskId", "unknown")
        operation = job_data.get("operation", "")
        input_text = job_data.get("inputText", "")

        extra = {"task_id": task_id, "operation": operation}
        log.info(f"Processing task: {task_id}", extra=extra)

        try:
            # Pending → Running
            self._update_task_status(task_id, STATUS_RUNNING)
            log.info(f"Task {task_id}: status → running", extra=extra)

            result, execution_time, logs = processor.process(operation, input_text)

            # Running → Success
            self._save_result(task_id, result, logs, execution_time, STATUS_SUCCESS)
            log.info(
                f"Task {task_id}: completed in {execution_time}ms → success",
                extra={**extra, "execution_time": execution_time},
            )

        except ValueError as e:
            error_logs = [f"[ERROR] Invalid operation: {e}"]
            self._save_result(task_id, "", error_logs, 0, STATUS_FAILED)
            log.error(f"Task {task_id}: failed (invalid operation): {e}", extra=extra)

        except Exception as e:
            error_logs = [f"[ERROR] Unexpected error: {e}"]
            self._save_result(task_id, "", error_logs, 0, STATUS_FAILED)
            log.error(f"Task {task_id}: failed: {e}", exc_info=True, extra=extra)

    # ── Main consumer loop ────────────────────────────────────────────────────

    def run(self) -> None:
        """Blocking consumer loop with Redis reconnect."""
        log.info(f"Worker started. Listening on Redis list: {QUEUE_KEY!r}")

        retry_delay = 2  # seconds between Redis reconnect attempts

        while self._running:
            # Ensure we have a live Redis connection
            if not self._ensure_redis():
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 30)  # exponential back-off, cap 30s
                continue

            retry_delay = 2  # reset on successful connection

            try:
                # BRPOP blocks for BRPOP_TIMEOUT seconds then returns None
                result = self.redis_client.brpop([QUEUE_KEY], timeout=BRPOP_TIMEOUT)  # type: ignore[union-attr]
                if result is None:
                    continue  # timeout — loop again

                _key, raw_payload = result
                self._process_job(raw_payload)

            except redis.exceptions.ConnectionError as e:
                log.warning(f"Redis connection error during BRPOP: {e}. Will reconnect…")
                self.redis_client = None
                time.sleep(1)

            except Exception as e:
                log.error(f"Unexpected error in worker loop: {e}", exc_info=True)
                time.sleep(1)

        log.info("Worker stopped.")
        if self.redis_client:
            self.redis_client.close()
        self.mongo_client.close()


def main() -> None:
    """Entry point for the worker process."""
    if not MONGO_URI:
        log.error("MONGO_URI environment variable is not set. Exiting.")
        sys.exit(1)

    worker = WorkerConsumer()
    worker.run()


if __name__ == "__main__":
    main()
