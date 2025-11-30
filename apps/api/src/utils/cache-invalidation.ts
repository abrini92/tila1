import { CacheService } from '../services/CacheService';
import { Logger } from '@tilawa/utils';

const logger = new Logger('CacheInvalidation');

/**
 * Invalider le cache du feed quand une récitation change de statut vers APPROVED
 * ou quand une récitation APPROVED est modifiée/supprimée
 * 
 * À appeler depuis:
 * - Les workers (audio-worker, moderation-worker) quand ils approuvent une récitation
 * - Les routes admin si elles modifient le statut d'une récitation
 * - Les routes de suppression de récitation
 */
export async function invalidateFeedOnRecitationChange(
  cacheService: CacheService,
  oldStatus?: string,
  newStatus?: string
): Promise<void> {
  // Invalider le cache si:
  // 1. Une récitation passe à APPROVED
  // 2. Une récitation APPROVED est modifiée
  const shouldInvalidate = 
    newStatus === 'APPROVED' || 
    oldStatus === 'APPROVED';

  if (shouldInvalidate) {
    await cacheService.invalidateFeedCache();
    logger.info('Feed cache invalidated due to recitation status change', {
      oldStatus,
      newStatus,
    });
  }
}

/**
 * Hook à intégrer dans RecitationService ou dans les workers
 * pour invalider automatiquement le cache
 */
export function createCacheInvalidationHook(cacheService: CacheService) {
  return async (recitationId: string, oldStatus?: string, newStatus?: string) => {
    await invalidateFeedOnRecitationChange(cacheService, oldStatus, newStatus);
  };
}
