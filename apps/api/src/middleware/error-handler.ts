import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '@tilawa/utils';
import { Logger } from '@tilawa/utils';

const logger = new Logger('ErrorHandler');

// Error code mapping
const ERROR_CODES: Record<string, string> = {
  ValidationError: 'VALIDATION_ERROR',
  UnauthorizedError: 'UNAUTHORIZED',
  ForbiddenError: 'FORBIDDEN',
  NotFoundError: 'NOT_FOUND',
  ConflictError: 'CONFLICT',
  InternalServerError: 'INTERNAL_SERVER_ERROR',
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Handle known application errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.ValidationError,
        message: err.message,
      },
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UnauthorizedError,
        message: err.message,
      },
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: {
        code: ERROR_CODES.ForbiddenError,
        message: err.message,
      },
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: ERROR_CODES.NotFoundError,
        message: err.message,
      },
    });
  }

  if (err instanceof ConflictError) {
    return res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.ConflictError,
        message: err.message,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: 'APP_ERROR',
        message: err.message,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
      },
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', { error: err });
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
    },
  });
};
