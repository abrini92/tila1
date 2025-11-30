import { Like } from './models';

export interface IEngagementRepository {
  createLike(userId: string, recitationId: string): Promise<Like>;
  deleteLike(userId: string, recitationId: string): Promise<void>;
  findLike(userId: string, recitationId: string): Promise<Like | null>;
  countLikes(recitationId: string): Promise<number>;
  hasUserLiked(userId: string, recitationId: string): Promise<boolean>;
}
