import { Router } from 'express';
import { AuthService } from '@tilawa/domain-user';
import { authMiddleware } from '../../middleware/auth';

export const createAuthRoutes = (authService: AuthService) => {
  const router = Router();

  // Register
  router.post('/register', async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get current user
  router.get('/me', authMiddleware(authService), async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
