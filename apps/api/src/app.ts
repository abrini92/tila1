import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler';
import { env } from '@tilawa/config';
import { Dependencies } from './dependencies';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createRecitationRoutes } from './modules/recitation/recitation.routes';

export const createApp = (deps: Dependencies) => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

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
  app.use('/api/v1/auth', createAuthRoutes(deps.authService));
  app.use('/api/v1/recitations', createRecitationRoutes(deps.recitationService, deps.authService));

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
