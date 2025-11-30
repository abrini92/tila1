// Common types used across the application

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface Entity extends Timestamps {
  id: ID;
}

// Recitation Status
export enum RecitationStatus {
  DRAFT = 'DRAFT',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PENDING_MODERATION = 'PENDING_MODERATION',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

// Moderation Decision
export enum ModerationDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  PENDING = 'PENDING',
}

// User Role
export enum UserRole {
  USER = 'USER',
  RECITER = 'RECITER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

// Badge Type
export enum BadgeType {
  VERIFIED = 'VERIFIED',
  POPULAR = 'POPULAR',
  RISING_STAR = 'RISING_STAR',
  MASTER_RECITER = 'MASTER_RECITER',
  KIDS_FRIENDLY = 'KIDS_FRIENDLY',
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
