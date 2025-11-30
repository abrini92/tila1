import { Router } from 'express';
import { FeedService } from '@tilawa/domain-feed';
import { validate } from '../../middleware/validation';
import { feedQuerySchema } from './validation';
import { CacheService } from '../../services/CacheService';

export const createFeedRoutes = (feedService: FeedService, cacheService: CacheService) => {
  const router = Router();

  // Get feed (public) with Redis cache
  router.get('/', validate(feedQuerySchema), async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

      // Générer la clé de cache
      const cacheKey = `feed:page:${page}:size:${pageSize}`;

      // Tenter de récupérer depuis le cache
      const cachedFeed = await cacheService.get(cacheKey);
      if (cachedFeed) {
        return res.json({
          success: true,
          data: cachedFeed,
          cached: true, // Indicateur pour debug
        });
      }

      // Si pas en cache, requête DB
      const feed = await feedService.getFeed({ page, pageSize });

      // Stocker en cache (TTL: 5 minutes)
      await cacheService.set(cacheKey, feed, 300);

      res.json({
        success: true,
        data: feed,
        cached: false,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
