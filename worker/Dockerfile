# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a prefix
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: Production ───────────────────────────────────────────────────
FROM python:3.12-slim AS production

WORKDIR /app

# Security: non-root user
RUN groupadd -r worker && useradd -r -g worker workeruser

# Copy dependencies from builder
COPY --from=builder /root/.local /home/workeruser/.local

# Copy application code
COPY --chown=workeruser:worker . .

# Set PATH for user-installed packages
ENV PATH=/home/workeruser/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

USER workeruser

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import redis; r = redis.from_url('${REDIS_URL:-redis://localhost:6379}'); r.ping()" || exit 1

CMD ["python", "main.py"]
