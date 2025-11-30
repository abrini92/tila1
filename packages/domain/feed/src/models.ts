export interface FeedItem {
  id: string;
  title: string;
  description?: string;
  surah: string;
  verses: string;
  language: string;
  audioUrl?: string;
  duration?: number;
  status: string;
  createdAt: Date;
  reciter: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };
  engagement: {
    likesCount: number;
  };
}

export interface FeedParams {
  page?: number;
  pageSize?: number;
}

export interface FeedResponse {
  items: FeedItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
