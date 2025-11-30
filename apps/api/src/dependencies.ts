// Dependency injection container
import { env } from '@tilawa/config';
import { UserRepository, RecitationRepository, ReciterRepository, EngagementRepository, FeedRepository, connectDatabase } from '@tilawa/database';
import { PasswordService, TokenService } from '@tilawa/auth';
import { StorageService } from '@tilawa/storage';
import { QueueService } from '@tilawa/queue';
import { AuthService, UserService } from '@tilawa/domain-user';
import { RecitationService } from '@tilawa/domain-recitation';
import { ReciterService } from '@tilawa/domain-reciter';
import { EngagementService } from '@tilawa/domain-engagement';
import { FeedService } from '@tilawa/domain-feed';

export const initializeDependencies = async () => {
  // Connect to database
  await connectDatabase();

  // Repositories
  const userRepository = new UserRepository();
  const recitationRepository = new RecitationRepository();
  const reciterRepository = new ReciterRepository();
  const engagementRepository = new EngagementRepository();
  const feedRepository = new FeedRepository();

  // Infrastructure services
  const passwordService = new PasswordService();
  const tokenService = new TokenService(env.jwt.secret, env.jwt.expiresIn);
  const storageService = new StorageService();
  const queueService = new QueueService(env.redis.url);

  // Domain services
  const authService = new AuthService(userRepository, passwordService, tokenService);
  const userService = new UserService(userRepository);
  const recitationService = new RecitationService(
    recitationRepository,
    storageService,
    queueService
  );
  const reciterService = new ReciterService(reciterRepository);
  const engagementService = new EngagementService(engagementRepository);
  const feedService = new FeedService(feedRepository);

  return {
    authService,
    userService,
    recitationService,
    reciterService,
    engagementService,
    feedService,
    queueService,
  };
};

export type Dependencies = Awaited<ReturnType<typeof initializeDependencies>>;
