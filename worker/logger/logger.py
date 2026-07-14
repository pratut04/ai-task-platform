"""
Structured logging configuration for the worker service.
Uses JSON-formatted logs with rotation for production reliability.
"""

import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any

import os
from dotenv import load_dotenv

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


class JsonFormatter(logging.Formatter):
    """Format log records as JSON for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "ai-task-worker",
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "task_id"):
            log_record["task_id"] = record.task_id

        if hasattr(record, "operation"):
            log_record["operation"] = record.operation

        return json.dumps(log_record)


def setup_logger(name: str) -> logging.Logger:
    """Create and configure a structured logger."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler with JSON format
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JsonFormatter())
    logger.addHandler(console_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


# Worker-level logger
logger = setup_logger("worker")
