import 'dotenv/config';
import dns from 'dns';
import createApp from './app';
import connectDB from './config/database';
import config from './config';
import logger from './utils/logger';
import taskQueueService from './queue/task.queue';

// ── DNS Override ──────────────────────────────────────────────────────────────
// Node.js uses c-ares for DNS which can fail with ECONNREFUSED on TCP SRV
// queries when Windows' link-local IPv6 DNS (fe80::...) doesn't support TCP.
// Explicitly setting public DNS servers fixes mongodb+srv:// resolution.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`📋 Health check: http://localhost:${config.port}/health`);
  });

  // ── Graceful Shutdown ───────────────────────────────────────────────────
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async (err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }

      // Close Redis connection
      await taskQueueService.close();

      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
};

startServer();
