export interface Like {
  id: string;
  userId: string;
  recitationId: string;
  createdAt: Date;
}

export interface EngagementStats {
  likesCount: number;
  commentsCount?: number;
}
