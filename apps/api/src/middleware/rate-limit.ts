import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Global API rate limit
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for audio uploads (per user, not IP)
// 5 uploads per hour per authenticated user
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req: Request) => {
    // Utiliser l'ID utilisateur si authentifié, sinon l'IP
    return req.user?.id || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload attempts. Maximum 5 uploads per hour allowed',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Compter même les uploads réussis
});

// Rate limit for likes (per user)
// 50 likes per hour per authenticated user
export const likeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  keyGenerator: (req: Request) => {
    // Utiliser l'ID utilisateur si authentifié, sinon l'IP
    return req.user?.id || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      code: 'LIKE_RATE_LIMIT_EXCEEDED',
      message: 'Too many like attempts. Maximum 50 likes per hour allowed',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
