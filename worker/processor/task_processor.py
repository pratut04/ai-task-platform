"""
Task processor — pure business logic for each supported operation.
All operations are side-effect free; they receive text and return a result string.
"""

import time


class TaskProcessor:
    """
    Implements all supported text processing operations.
    Each operation is a pure function: str -> str.
    """

    OPERATIONS = {"uppercase", "lowercase", "reverse", "word_count"}

    def process(self, operation: str, input_text: str):
        """
        Process a task with the given operation.

        Returns:
            tuple: (result, execution_time_us, logs)
                   execution_time_us is elapsed time in MICROSECONDS (us),
                   e.g. 45.3 means 45.3 us = 0.0453 ms.
                   Stored in MongoDB as the `executionTime` field.

        Raises:
            ValueError: If the operation is not supported.
        """
        if operation not in self.OPERATIONS:
            raise ValueError(f"Unsupported operation: {operation}")

        logs = []
        logs.append(f"[START] Processing operation: {operation}")
        logs.append(f"[INFO] Input length: {len(input_text)} characters")

        start = time.perf_counter()

        if operation == "uppercase":
            result = input_text.upper()
        elif operation == "lowercase":
            result = input_text.lower()
        elif operation == "reverse":
            result = input_text[::-1]
        elif operation == "word_count":
            words = input_text.split()
            word_count = len(words)
            unique_words = len(set(w.lower() for w in words))
            chars_no_spaces = len(input_text.replace(" ", ""))
            lines = len(input_text.splitlines()) or 1
            result = (
                f"Word Count: {word_count} | "
                f"Unique Words: {unique_words} | "
                f"Characters (no spaces): {chars_no_spaces} | "
                f"Lines: {lines}"
            )
        else:
            raise ValueError(f"Unsupported operation: {operation}")

        elapsed = time.perf_counter() - start
        execution_time_us = elapsed * 1_000_000

        logs.append(f"[INFO] Operation completed in {elapsed * 1000:.3f} ms ({execution_time_us:.3f} us)")
        logs.append(f"[INFO] Result length: {len(result)} characters")
        logs.append("[SUCCESS] Task processed successfully")

        return result, execution_time_us, logs


processor = TaskProcessor()
