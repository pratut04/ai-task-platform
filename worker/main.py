"""
Worker entry point — starts the Redis queue consumer.
"""

import os
import sys

# fmt: off
# ── sys.path fix ──────────────────────────────────────────────────────────────
# The worker/ directory contains a 'queue/' subdirectory that shadows Python's
# stdlib 'queue' module. We fix this by inserting the stdlib directory at the
# FRONT of sys.path so it always takes precedence over local directories.
#
# This must happen before ANY third-party import (redis, pymongo, etc.)
# because those libraries use 'from queue import Empty, LifoQueue, ...'
_worker_root = os.path.dirname(os.path.abspath(__file__))
_stdlib_dir = os.path.dirname(os.__file__)  # e.g. /usr/lib/python3.12

# Rebuild sys.path: stdlib first, then everything else
_other_paths = [p for p in sys.path if p != _stdlib_dir]
sys.path[:] = [_stdlib_dir] + _other_paths
# fmt: on
# ─────────────────────────────────────────────────────────────────────────────

from task_queue.consumer import main  # noqa: E402

if __name__ == "__main__":
    main()
