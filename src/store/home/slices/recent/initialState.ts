import { type RecentItem } from '@/server/routers/lambda/recent';

export interface RecentState {
  allRecentsDrawerOpen: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  isRecentsInit: boolean;
  recents: RecentItem[];
}

export const initialRecentState: RecentState = {
  allRecentsDrawerOpen: false,
  hasMore: true,
  isLoadingMore: false,
  isRecentsInit: false,
  recents: [],
};
