"""
Task processor — pure business logic for each supported operation.
All operations are side-effect free; they receive text and return a result string.
"""

import time
from typing import Callable


class TaskProcessor:
    """
    Implements all supported text processing operations.
    Each operation is a pure function: str -> str.
    """

    OPERATIONS: dict[str, Callable[[str], str]] = {}

    def __init__(self) -> None:
        # Register operations
        self.OPERATIONS = {
            "uppercase": self._uppercase,
            "lowercase": self._lowercase,
            "reverse": self._reverse,
            "word_count": self._word_count,
        }

    def process(self, operation: str, input_text: str) -> tuple[str, float, list[str]]:
        """
        Process a task with the given operation.

        Returns:
            tuple: (result, execution_time_us, logs)
                   execution_time_us is elapsed time in MICROSECONDS (µs),
                   e.g. 45.3 means 45.3 µs = 0.0453 ms.
                   Stored in MongoDB as the `executionTime` field.

        Raises:
            ValueError: If the operation is not supported.
        """
        logs: list[str] = []

        if operation not in self.OPERATIONS:
            raise ValueError(f"Unsupported operation: {operation}")

        logs.append(f"[START] Processing operation: {operation}")
        logs.append(f"[INFO] Input length: {len(input_text)} characters")

        start_ns = time.perf_counter_ns()

        try:
            fn = self.OPERATIONS[operation]
            result = fn(input_text)
            elapsed_ns = time.perf_counter_ns() - start_ns
            elapsed_us = round(elapsed_ns / 1_000, 3)  # microseconds, 3 dp

            if elapsed_us >= 1_000:
                display = f"{elapsed_us / 1_000:.3f} ms"
            else:
                display = f"{elapsed_us:.3f} µs"

            logs.append(f"[INFO] Operation completed in {display}")
            logs.append(f"[INFO] Result length: {len(str(result))} characters")
            logs.append("[SUCCESS] Task processed successfully")

            return result, elapsed_us, logs

        except Exception as e:
            logs.append(f"[ERROR] Processing failed: {str(e)}")
            raise

    # ── Operations ─────────────────────────────────────────────────────────

    @staticmethod
    def _uppercase(text: str) -> str:
        return text.upper()

    @staticmethod
    def _lowercase(text: str) -> str:
        return text.lower()

    @staticmethod
    def _reverse(text: str) -> str:
        return text[::-1]

    @staticmethod
    def _word_count(text: str) -> str:
        words = text.split()
        unique_words = len(set(word.lower() for word in words))
        chars_no_spaces = len(text.replace(" ", ""))
        return (
            f"Word Count: {len(words)} | "
            f"Unique Words: {unique_words} | "
            f"Characters (no spaces): {chars_no_spaces} | "
            f"Lines: {len(text.splitlines())}"
        )


# Singleton instance
processor = TaskProcessor()
