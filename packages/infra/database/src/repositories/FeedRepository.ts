import { IFeedRepository, FeedItem } from '@tilawa/domain-feed';
import { prisma } from '../client';

export class FeedRepository implements IFeedRepository {
  async findApprovedRecitations(params: {
    page: number;
    pageSize: number;
  }): Promise<{ items: FeedItem[]; total: number }> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    // Get approved recitations with reciter and likes count
    const [recitations, total] = await Promise.all([
      prisma.recitation.findMany({
        where: {
          status: 'APPROVED',
        },
        include: {
          user: {
            include: {
              reciter: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.recitation.count({
        where: {
          status: 'APPROVED',
        },
      }),
    ]);

    // Transform to FeedItem
    const items: FeedItem[] = recitations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      description: rec.description || undefined,
      surah: rec.surah,
      verses: rec.verses,
      language: rec.language,
      audioUrl: rec.audioUrl || undefined,
      duration: rec.duration || undefined,
      status: rec.status,
      createdAt: rec.createdAt,
      reciter: {
        id: rec.user.reciter?.id || '',
        displayName: rec.user.reciter?.displayName || rec.user.name || 'Anonymous',
        avatarUrl: rec.user.reciter?.avatarUrl || undefined,
        verified: rec.user.reciter?.verified || false,
      },
      engagement: {
        likesCount: rec._count.likes,
      },
    }));

    return { items, total };
  }
}
