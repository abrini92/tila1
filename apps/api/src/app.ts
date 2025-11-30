import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler';
import { env } from '@tilawa/config';
import { Dependencies } from './dependencies';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createRecitationRoutes } from './modules/recitation/recitation.routes';
import { createReciterRoutes } from './modules/reciter/reciter.routes';
import { createFeedRoutes } from './modules/feed/feed.routes';
import { globalRateLimit, authRateLimit } from './middleware/rate-limit';
import { metricsMiddleware, register } from './middleware/metrics';

export const createApp = (deps: Dependencies) => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Rate limiting
  app.use('/api', globalRateLimit);

  // Metrics
  app.use(metricsMiddleware);

  // Logging
  if (env.isDevelopment) {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'tilawa-api',
      version: '1.0.0',
    });
  });

  // Metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // API routes
  app.get('/api/v1', (req: Request, res: Response) => {
    res.json({
      message: 'Tilawa API v1',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        recitations: '/api/v1/recitations',
      },
    });
  });

  // Mount routes
  app.use('/api/v1/auth', authRateLimit, createAuthRoutes(deps.authService));
  app.use('/api/v1/recitations', createRecitationRoutes(deps.recitationService, deps.engagementService, deps.authService));
  app.use('/api/v1/reciters', createReciterRoutes(deps.reciterService, deps.authService));
  app.use('/api/v1/feed', createFeedRoutes(deps.feedService));

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
