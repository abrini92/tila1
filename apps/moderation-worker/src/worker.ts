import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';
import { processModeration } from './jobs/content-moderation.job';
import { RecitationRepository, ModerationLogRepository, connectDatabase } from '@tilawa/database';

export class ModerationWorker {
  private worker: Worker;
  private connection: Redis;
  private recitationRepository: RecitationRepository;
  private moderationLogRepository: ModerationLogRepository;

  constructor() {
    // Create Redis connection
    this.connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
    });

    // Initialize repositories
    this.recitationRepository = new RecitationRepository();
    this.moderationLogRepository = new ModerationLogRepository();

    // Create worker for moderation
    this.worker = new Worker(
      config.queues.moderation,
      async (job) => {
        try {
          const result = await processModeration(job);

          // Update recitation status based on decision
          await this.recitationRepository.update(result.recitationId, {
            status: result.decision as any, // APPROVED or REJECTED
          });

          // Create moderation log
          await this.moderationLogRepository.create({
            recitationId: result.recitationId,
            decision: result.decision as any,
            reason: result.reason,
            kidsSafe: result.kidsSafe,
          });

          console.log(`[Moderation Worker] ✅ Updated DB for recitation: ${result.recitationId}`);
          console.log(`[Moderation Worker] Decision: ${result.decision}, Kids-safe: ${result.kidsSafe}`);

          return result;
        } catch (error) {
          console.error(`[Moderation Worker] Error processing job:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: 10, // Process up to 10 jobs concurrently
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`[Moderation Worker] ✅ Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Moderation Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error(`[Moderation Worker] Worker error:`, err);
    });
  }

  async start() {
    // Connect to database
    await connectDatabase();
    
    console.log('🛡️  Moderation Worker started');
    console.log(`📡 Listening to queue: ${config.queues.moderation}`);
    console.log(`🔗 Redis: ${config.redis.url}`);
  }

  async stop() {
    console.log('🛑 Stopping Moderation Worker...');
    await this.worker.close();
    await this.connection.quit();
    console.log('✅ Moderation Worker stopped');
  }
}
