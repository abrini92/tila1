import Redis from 'ioredis';
import { Logger } from '@tilawa/utils';

const logger = new Logger('CacheService');

export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes par défaut

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    
    this.redis.on('connect', () => {
      logger.info('Redis cache connected');
    });

    this.redis.on('error', (err) => {
      logger.error('Redis cache error', err);
    });
  }

  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Stocker une valeur dans le cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  }

  /**
   * Supprimer une clé du cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  /**
   * Supprimer toutes les clés correspondant à un pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}`, error);
    }
  }

  /**
   * Invalider tout le cache du feed
   * À appeler quand une récitation APPROVED est créée/modifiée
   */
  async invalidateFeedCache(): Promise<void> {
    await this.deletePattern('feed:*');
    logger.info('Feed cache invalidated');
  }

  /**
   * Fermer la connexion Redis
   */
  async close(): Promise<void> {
    await this.redis.quit();
    logger.info('Redis cache connection closed');
  }
}
