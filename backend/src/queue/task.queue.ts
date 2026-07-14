/**
 * task.queue.ts
 *
 * Lightweight Redis queue using ioredis LPUSH / BRPOP.
 * This approach is transparent and works directly with the Python worker
 * without any Bull-internal key-format complexity.
 *
 * Key: "task-processing:jobs"  (plain Redis list)
 *   - Backend pushes:  LPUSH task-processing:jobs <JSON>
 *   - Worker consumes: BRPOP task-processing:jobs
 */

import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';
import { TaskJobData } from '../types';

const QUEUE_KEY = 'task-processing:jobs';

class TaskQueueService {
  private client: Redis;
  private _connected = false;

  constructor() {
    this.client = new Redis(config.redisUrl, {
      // Retry strategy: attempt reconnect with exponential back-off (max 30s)
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 500, 30_000);
        return delay;
      },
      // Do not crash the process on connection failure
      enableOfflineQueue: true,
      lazyConnect: false,
      maxRetriesPerRequest: null,
    });

    this._setupEvents();
  }

  private _setupEvents(): void {
    this.client.on('connect', () => {
      this._connected = true;
      logger.info('✅ Redis connected — task queue is active.');
    });

    this.client.on('ready', () => {
      this._connected = true;
    });

    this.client.on('error', (err: NodeJS.ErrnoException) => {
      if (this._connected || err.code !== 'ECONNREFUSED') {
        logger.error('Redis error:', { message: err.message, code: err.code });
      } else {
        // First-time connection failure — log once, not repeatedly
        logger.warn(
          `⚠️  Redis not reachable at ${config.redisUrl}. ` +
          'Queue features disabled until Redis is available. ' +
          'Start Redis with: docker run -d -p 6379:6379 redis:alpine'
        );
      }
      this._connected = false;
    });

    this.client.on('close', () => {
      this._connected = false;
    });

    this.client.on('reconnecting', () => {
      logger.debug('Redis reconnecting...');
    });
  }

  /**
   * Push a job onto the queue (LPUSH).
   * Returns true if enqueued successfully, false if Redis is unavailable.
   */
  async enqueue(data: TaskJobData): Promise<boolean> {
    if (!this._connected) {
      logger.warn(`Redis unavailable — cannot enqueue task: ${data.taskId}. Start Redis to enable background jobs.`);
      return false;
    }

    try {
      const payload = JSON.stringify(data);
      await this.client.lpush(QUEUE_KEY, payload);
      logger.info(`Task enqueued: ${data.taskId} (operation: ${data.operation})`);
      return true;
    } catch (err) {
      logger.error(`Failed to enqueue task ${data.taskId}:`, err);
      return false;
    }
  }

  /**
   * Get the current queue length.
   */
  async getQueueLength(): Promise<number> {
    if (!this._connected) return 0;
    return this.client.llen(QUEUE_KEY);
  }

  /**
   * Close the Redis connection (used during graceful shutdown).
   */
  async close(): Promise<void> {
    await this.client.quit();
    logger.info('Redis connection closed.');
  }

  get isConnected(): boolean {
    return this._connected;
  }

  /** Expose raw client for advanced use-cases */
  getClient(): Redis {
    return this.client;
  }
}

export default new TaskQueueService();
