import { Router } from 'express';
import { RecitationService } from '@tilawa/domain-recitation';
import { AuthService } from '@tilawa/domain-user';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createRecitationSchema, uploadAudioSchema, getRecitationSchema } from './validation';

export const createRecitationRoutes = (
  recitationService: RecitationService,
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

  // Upload audio
  router.post('/:id/upload', validate(uploadAudioSchema), async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { audioData } = req.body;

      // In a real app, this would be multipart/form-data
      // For now, we simulate with a buffer
      const audioBuffer = Buffer.from(audioData || 'mock-audio-data');

      const recitation = await recitationService.uploadAudio(id, userId, audioBuffer);

      res.json({
        success: true,
        data: recitation,
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

  return router;
};
