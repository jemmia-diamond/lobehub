import { lambdaClient } from '@/libs/trpc/client';
import { type RecentItem } from '@/server/routers/lambda/recent';

class RecentService {
  getAll = (limit?: number, offset?: number): Promise<RecentItem[]> => {
    return lambdaClient.recent.getAll.query({ limit, offset });
  };
}

export const recentService = new RecentService();
