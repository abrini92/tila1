import { prisma } from '../client';

export interface CreateModerationLogData {
  recitationId: string;
  decision: 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'PENDING';
  reason?: string;
  kidsSafe: boolean;
}

export class ModerationLogRepository {
  async create(data: CreateModerationLogData) {
    return prisma.moderationLog.create({
      data,
    });
  }

  async findByRecitationId(recitationId: string) {
    return prisma.moderationLog.findUnique({
      where: { recitationId },
    });
  }

  async findAll() {
    return prisma.moderationLog.findMany({
      orderBy: { moderatedAt: 'desc' },
    });
  }
}
