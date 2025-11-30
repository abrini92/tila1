import { Reciter, CreateReciterData, UpdateReciterData } from './models';

export interface IReciterRepository {
  create(data: CreateReciterData): Promise<Reciter>;
  findById(id: string): Promise<Reciter | null>;
  findByUserId(userId: string): Promise<Reciter | null>;
  update(id: string, data: UpdateReciterData): Promise<Reciter>;
  incrementStats(id: string, field: 'totalRecitations' | 'totalLikes' | 'totalFollowers'): Promise<void>;
}
