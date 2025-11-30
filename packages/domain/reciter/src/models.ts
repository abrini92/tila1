import { Entity } from '@tilawa/types';

export interface Reciter extends Entity {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  country?: string;
  verified: boolean;
  totalRecitations: number;
  totalLikes: number;
  totalFollowers: number;
}

export interface ReciterProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  country?: string;
  verified: boolean;
  stats: {
    totalRecitations: number;
    totalLikes: number;
    totalFollowers: number;
  };
  createdAt: Date;
}

export interface CreateReciterData {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  country?: string;
}

export interface UpdateReciterData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  country?: string;
}
