import { IEngagementRepository } from '../ports';
import { EngagementStats } from '../models';
import { ConflictError, NotFoundError } from '@tilawa/utils';

export class EngagementService {
  constructor(private engagementRepository: IEngagementRepository) {}

  async likeRecitation(userId: string, recitationId: string): Promise<void> {
    // Check if already liked
    const existingLike = await this.engagementRepository.findLike(userId, recitationId);
    
    if (existingLike) {
      throw new ConflictError('You have already liked this recitation');
    }

    await this.engagementRepository.createLike(userId, recitationId);
  }

  async unlikeRecitation(userId: string, recitationId: string): Promise<void> {
    // Check if like exists
    const existingLike = await this.engagementRepository.findLike(userId, recitationId);
    
    if (!existingLike) {
      throw new NotFoundError('Like not found');
    }

    await this.engagementRepository.deleteLike(userId, recitationId);
  }

  async getLikesCount(recitationId: string): Promise<number> {
    return this.engagementRepository.countLikes(recitationId);
  }

  async getEngagementStats(recitationId: string): Promise<EngagementStats> {
    const likesCount = await this.engagementRepository.countLikes(recitationId);
    
    return {
      likesCount,
    };
  }

  async hasUserLiked(userId: string, recitationId: string): Promise<boolean> {
    return this.engagementRepository.hasUserLiked(userId, recitationId);
  }
}
