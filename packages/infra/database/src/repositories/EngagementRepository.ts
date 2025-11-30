import { IEngagementRepository, Like } from '@tilawa/domain-engagement';
import { prisma } from '../client';

export class EngagementRepository implements IEngagementRepository {
  async createLike(userId: string, recitationId: string): Promise<Like> {
    const like = await prisma.like.create({
      data: {
        userId,
        recitationId,
      },
    });
    return like as Like;
  }

  async deleteLike(userId: string, recitationId: string): Promise<void> {
    await prisma.like.deleteMany({
      where: {
        userId,
        recitationId,
      },
    });
  }

  async findLike(userId: string, recitationId: string): Promise<Like | null> {
    const like = await prisma.like.findFirst({
      where: {
        userId,
        recitationId,
      },
    });
    return like as Like | null;
  }

  async countLikes(recitationId: string): Promise<number> {
    return prisma.like.count({
      where: {
        recitationId,
      },
    });
  }

  async hasUserLiked(userId: string, recitationId: string): Promise<boolean> {
    const count = await prisma.like.count({
      where: {
        userId,
        recitationId,
      },
    });
    return count > 0;
  }
}
