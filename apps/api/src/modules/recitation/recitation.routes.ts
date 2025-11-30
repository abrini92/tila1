import { Router, Request, Response, NextFunction } from 'express';
import { RecitationService } from '@tilawa/domain-recitation';
import { EngagementService } from '@tilawa/domain-engagement';
import { AuthService } from '@tilawa/domain-user';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { uploadAudio, handleUploadErrors } from '../../middleware/upload';
import { uploadRateLimit, likeRateLimit } from '../../middleware/rate-limit';
import { createRecitationSchema, uploadAudioSchema, getRecitationSchema } from './validation';

export const createRecitationRoutes = (
  recitationService: RecitationService,
  engagementService: EngagementService,
  authService: AuthService
) => {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware(authService));

  // Create draft recitation
  router.post('/', validate(createRecitationSchema), async (req, res, next) => {
    try {
      const { title, description, surah, verses, language } = req.body;
      const userId = req.user!.id;

      const recitation = await recitationService.createDraft({
        userId,
        title,
        description,
        surah,
        verses,
        language,
      });

      res.json({
        success: true,
        data: recitation,
      });
    } catch (error) {
      next(error);
    }
  });

  // Upload audio with strict validation and rate limiting
  router.post('/:id/upload', uploadRateLimit, uploadAudio, handleUploadErrors, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Vérifier qu'un fichier a été uploadé
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No audio file provided',
          },
        });
      }

      // Utiliser le buffer du fichier uploadé
      const audioBuffer = req.file.buffer;

      const recitation = await recitationService.uploadAudio(id, userId, audioBuffer);

      res.json({
        success: true,
        data: recitation,
        message: `Audio file uploaded successfully (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get recitation by ID
  router.get('/:id', validate(getRecitationSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const recitation = await recitationService.getRecitationById(id);

      res.json({
        success: true,
        data: recitation,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get user's recitations
  router.get('/', async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const recitations = await recitationService.getUserRecitations(userId);

      res.json({
        success: true,
        data: recitations,
      });
    } catch (error) {
      next(error);
    }
  });

  // Like a recitation with rate limiting
  router.post('/:id/like', likeRateLimit, authMiddleware(authService), validate(getRecitationSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await engagementService.likeRecitation(userId, id);

      res.json({
        success: true,
        message: 'Recitation liked successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  // Unlike a recitation with rate limiting
  router.delete('/:id/like', likeRateLimit, authMiddleware(authService), validate(getRecitationSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await engagementService.unlikeRecitation(userId, id);

      res.json({
        success: true,
        message: 'Recitation unliked successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  // Get engagement stats (public)
  router.get('/:id/engagement', validate(getRecitationSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const stats = await engagementService.getEngagementStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
