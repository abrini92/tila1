import { Recitation, CreateRecitationData, UpdateRecitationData } from './models';

export interface IRecitationRepository {
  create(data: CreateRecitationData): Promise<Recitation>;
  findById(id: string): Promise<Recitation | null>;
  findByUserId(userId: string): Promise<Recitation[]>;
  update(id: string, data: UpdateRecitationData): Promise<Recitation>;
  delete(id: string): Promise<void>;
}

export interface IStorageService {
  uploadAudio(file: Buffer, filename: string): Promise<string>;
  deleteAudio(url: string): Promise<void>;
}

export interface IQueueService {
  addJob(queueName: string, jobName: string, data: unknown): Promise<void>;
}
