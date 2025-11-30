import { ModerationWorker } from './worker';

const startWorker = async () => {
  const worker = new ModerationWorker();

  try {
    await worker.start();

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start moderation worker:', error);
    process.exit(1);
  }
};

startWorker();
