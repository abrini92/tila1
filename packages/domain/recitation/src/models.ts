import { Entity, RecitationStatus } from '@tilawa/types';

export interface Recitation extends Entity {
  userId: string;
  title: string;
  description?: string;
  surah: string;
  verses: string;
  language: string;
  audioUrl?: string;
  duration?: number;
  status: RecitationStatus;
  publishedAt?: Date;
}

export interface CreateRecitationData {
  userId: string;
  title: string;
  description?: string;
  surah: string;
  verses: string;
  language?: string;
}

export interface UpdateRecitationData {
  title?: string;
  description?: string;
  audioUrl?: string;
  duration?: number;
  status?: RecitationStatus;
  publishedAt?: Date;
}
