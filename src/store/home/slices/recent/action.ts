import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { useClientDataSWRWithSync } from '@/libs/swr';
import { type RecentItem } from '@/server/routers/lambda/recent';
import { recentService } from '@/services/recent';
import { type HomeStore } from '@/store/home/store';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('recent');

export const FETCH_RECENTS_KEY = 'fetchRecents';
export const ALL_RECENTS_DRAWER_SWR_PREFIX = 'allRecentsDrawer';

type Setter = StoreSetter<HomeStore>;
export const createRecentSlice = (set: Setter, get: () => HomeStore, _api?: unknown) =>
  new RecentActionImpl(set, get, _api);

export class RecentActionImpl {
  readonly #get: () => HomeStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => HomeStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  useFetchRecents = (isLogin: boolean | undefined, limit: number = 20): SWRResponse<RecentItem[]> => {
    return useClientDataSWRWithSync<RecentItem[]>(
      // Only fetch when login status is explicitly true (not null/undefined)
      isLogin === true ? [FETCH_RECENTS_KEY, isLogin, limit] : null,
      async () => {
        const currentLength = this.#get().recents?.length || 0;
        const targetLimit = Math.max(limit, currentLength);
        return recentService.getAll(targetLimit);
      },
      {
        onData: (data) => {
          if (this.#get().isRecentsInit && isEqual(this.#get().recents, data)) return;

          const currentLength = this.#get().recents?.length || 0;
          const targetLimit = Math.max(limit, currentLength);

          this.#set(
            { hasMore: data.length >= targetLimit, isRecentsInit: true, recents: data },
            false,
            n('useFetchRecents/onData'),
          );
        },
      },
    );
  };

  openAllRecentsDrawer = () => {
    this.#set({ allRecentsDrawerOpen: true }, false, n('openAllRecentsDrawer'));
  };

  closeAllRecentsDrawer = () => {
    this.#set({ allRecentsDrawerOpen: false }, false, n('closeAllRecentsDrawer'));
  };

  updateRecentTitle = async (id: string, title: string) => {
    const { recents } = this.#get();
    const newRecents = recents.map(item => item.id === id ? { ...item, title } : item);
    this.#set({ recents: newRecents }, false, n('updateRecentTitle'));
  };

  refreshRecents = async () => {
    const currentLength = this.#get().recents?.length || 0;
    const limit = Math.max(20, currentLength);
    const data = await recentService.getAll(limit);
    this.#set({ hasMore: data.length >= limit, recents: data }, false, n('refreshRecents'));
  };

  loadMoreRecents = async (limit: number = 20) => {
    const { recents, isLoadingMore, hasMore } = this.#get();
    if (isLoadingMore || !hasMore) return;

    this.#set({ isLoadingMore: true }, false, n('loadMoreRecents/start'));

    try {
      const offset = recents.length;
      const data = await recentService.getAll(limit, offset);

      this.#set(
        {
          hasMore: data.length >= limit,
          isLoadingMore: false,
          recents: [...recents, ...data],
        },
        false,
        n('loadMoreRecents/success'),
      );
    } catch {
      this.#set({ isLoadingMore: false }, false, n('loadMoreRecents/error'));
    }
  };
}

export type RecentAction = Pick<RecentActionImpl, keyof RecentActionImpl>;