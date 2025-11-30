import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';
import { processAudioAnalysis, AudioAnalysisJobData } from './jobs/audio-analysis.job';
import { RecitationRepository, AudioAnalysisRepository, connectDatabase } from '@tilawa/database';

export class AudioWorker {
  private worker: Worker;
  private moderationQueue: Queue;
  private connection: Redis;
  private recitationRepository: RecitationRepository;
  private audioAnalysisRepository: AudioAnalysisRepository;

  constructor() {
    // Create Redis connection
    this.connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
    });

    // Initialize repositories
    this.recitationRepository = new RecitationRepository();
    this.audioAnalysisRepository = new AudioAnalysisRepository();

    // Create moderation queue for sending jobs
    this.moderationQueue = new Queue(config.queues.moderation, {
      connection: this.connection,
    });

    // Create worker for audio processing
    this.worker = new Worker(
      config.queues.audioProcessing,
      async (job) => {
        try {
          const result = await processAudioAnalysis(job);

          // Update recitation status to PENDING_MODERATION
          await this.recitationRepository.update(result.recitationId, {
            status: 'PENDING_MODERATION',
            duration: result.duration,
          });

          // Create audio analysis record
          await this.audioAnalysisRepository.create({
            recitationId: result.recitationId,
            duration: result.duration,
            quality: result.quality,
            deepfakeScore: result.deepfakeScore,
          });

          console.log(`[Audio Worker] ✅ Updated DB for recitation: ${result.recitationId}`);

          // Send to moderation queue
          await this.moderationQueue.add('moderate-recitation', {
            recitationId: result.recitationId,
            audioAnalysis: result,
          });

          console.log(`[Audio Worker] Sent to moderation queue: ${result.recitationId}`);

          return result;
        } catch (error) {
          console.error(`[Audio Worker] Error processing job:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`[Audio Worker] ✅ Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Audio Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error(`[Audio Worker] Worker error:`, err);
    });
  }

  async start() {
    // Connect to database
    await connectDatabase();
    
    console.log('🎵 Audio Worker started');
    console.log(`📡 Listening to queue: ${config.queues.audioProcessing}`);
    console.log(`🔗 Redis: ${config.redis.url}`);
  }

  async stop() {
    console.log('🛑 Stopping Audio Worker...');
    await this.worker.close();
    await this.moderationQueue.close();
    await this.connection.quit();
    console.log('✅ Audio Worker stopped');
  }
}
