import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { IQueueService } from '@tilawa/domain-recitation';

export class QueueService implements IQueueService {
  private queues: Map<string, Queue> = new Map();
  private connection: Redis;

  constructor(redisUrl: string) {
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  async addJob(queueName: string, jobName: string, data: unknown): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data);
    console.log(`[Queue] Added job "${jobName}" to queue "${queueName}"`);
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connection.quit();
  }
}
