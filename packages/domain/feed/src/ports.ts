import { FeedItem } from './models';

export interface IFeedRepository {
  findApprovedRecitations(params: {
    page: number;
    pageSize: number;
  }): Promise<{ items: FeedItem[]; total: number }>;
}
