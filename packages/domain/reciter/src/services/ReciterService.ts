import { IReciterRepository } from '../ports';
import { ReciterProfile } from '../models';
import { NotFoundError } from '@tilawa/utils';

export class ReciterService {
  constructor(private reciterRepository: IReciterRepository) {}

  async getReciterById(reciterId: string): Promise<ReciterProfile> {
    const reciter = await this.reciterRepository.findById(reciterId);
    
    if (!reciter) {
      throw new NotFoundError('Reciter not found');
    }

    return this.toProfile(reciter);
  }

  async getReciterByUserId(userId: string): Promise<ReciterProfile> {
    const reciter = await this.reciterRepository.findByUserId(userId);
    
    if (!reciter) {
      throw new NotFoundError('Reciter profile not found for this user');
    }

    return this.toProfile(reciter);
  }

  private toProfile(reciter: any): ReciterProfile {
    return {
      id: reciter.id,
      displayName: reciter.displayName,
      bio: reciter.bio,
      avatarUrl: reciter.avatarUrl,
      country: reciter.country,
      verified: reciter.verified,
      stats: {
        totalRecitations: reciter.totalRecitations,
        totalLikes: reciter.totalLikes,
        totalFollowers: reciter.totalFollowers,
      },
      createdAt: reciter.createdAt,
    };
  }
}
