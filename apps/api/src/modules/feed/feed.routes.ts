import { Router } from 'express';
import { FeedService } from '@tilawa/domain-feed';
import { validate } from '../../middleware/validation';
import { feedQuerySchema } from './validation';

export const createFeedRoutes = (feedService: FeedService) => {
  const router = Router();

  // Get feed (public)
  router.get('/', validate(feedQuerySchema), async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

      const feed = await feedService.getFeed({ page, pageSize });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
