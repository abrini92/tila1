import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ValidationError } from '@tilawa/utils';

// Configuration des limites d'upload
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
];

// Configuration multer pour upload en mémoire
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validation du MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ValidationError(
        `Invalid audio format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }
  cb(null, true);
};

// Middleware multer configuré
export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
}).single('audio');

// Wrapper pour gérer les erreurs multer proprement
export const handleUploadErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
  }
  next(err);
};

// TODO: Intégrer ClamAV pour scan antivirus
// Hook prévu pour scan antivirus avant traitement
// export const scanAudioFile = async (buffer: Buffer): Promise<boolean> => {
//   // Implémenter l'intégration ClamAV ici
//   // const clamav = require('clamscan');
//   // const scanner = await new clamav().init();
//   // const { isInfected } = await scanner.scanBuffer(buffer);
//   // return !isInfected;
// };
