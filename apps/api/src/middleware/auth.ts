import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@tilawa/domain-user';
import { UnauthorizedError } from '@tilawa/utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);
      const decoded = await authService.verifyToken(token);

      req.user = {
        id: decoded.userId,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
