import { IFeedRepository } from '../ports';
import { FeedParams, FeedResponse } from '../models';

export class FeedService {
  constructor(private feedRepository: IFeedRepository) {}

  async getFeed(params: FeedParams = {}): Promise<FeedResponse> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100); // Max 100 items

    const { items, total } = await this.feedRepository.findApprovedRecitations({
      page,
      pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
