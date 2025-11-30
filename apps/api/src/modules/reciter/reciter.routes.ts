import { Router } from 'express';
import { ReciterService } from '@tilawa/domain-reciter';
import { AuthService } from '@tilawa/domain-user';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { getReciterSchema } from './validation';

export const createReciterRoutes = (
  reciterService: ReciterService,
  authService: AuthService
) => {
  const router = Router();

  // Get reciter by ID (public)
  router.get('/:id', validate(getReciterSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const reciter = await reciterService.getReciterById(id);

      res.json({
        success: true,
        data: reciter,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get my reciter profile (authenticated)
  router.get('/me', authMiddleware(authService), async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const reciter = await reciterService.getReciterByUserId(userId);

      res.json({
        success: true,
        data: reciter,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
