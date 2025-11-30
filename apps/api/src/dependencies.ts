// Dependency injection container
import { env } from '@tilawa/config';
import { UserRepository, RecitationRepository, connectDatabase } from '@tilawa/database';
import { PasswordService, TokenService } from '@tilawa/auth';
import { StorageService } from '@tilawa/storage';
import { QueueService } from '@tilawa/queue';
import { AuthService, UserService } from '@tilawa/domain-user';
import { RecitationService } from '@tilawa/domain-recitation';

export const initializeDependencies = async () => {
  // Connect to database
  await connectDatabase();

  // Repositories
  const userRepository = new UserRepository();
  const recitationRepository = new RecitationRepository();

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

  return {
    authService,
    userService,
    recitationService,
    queueService,
  };
};

export type Dependencies = Awaited<ReturnType<typeof initializeDependencies>>;
