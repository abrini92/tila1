import { createApp } from './app';
import { env } from '@tilawa/config';
import { initializeDependencies } from './dependencies';

const startServer = async () => {
  try {
    console.log('🔄 Initializing dependencies...');
    const deps = await initializeDependencies();
    console.log('✅ Dependencies initialized');

    const app = createApp(deps);

    const server = app.listen(env.api.port, () => {
      console.log('🚀 Tilawa API Server started');
      console.log(`📍 Environment: ${env.nodeEnv}`);
      console.log(`🌐 Listening on port: ${env.api.port}`);
      console.log(`🏥 Health check: http://localhost:${env.api.port}/health`);
      console.log(`📚 API v1: http://localhost:${env.api.port}/api/v1`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      
      // Close queue connections
      await deps.queueService.close();
      
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
