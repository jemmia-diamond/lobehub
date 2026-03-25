import type { ISlashMenuOption, ISlashOption } from '@lobehub/editor';
import { LOBE_THEME_APP_ID } from '@lobehub/ui';
import type { FC, RefObject } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import CategoryView from './CategoryView';
import HomeView from './HomeView';
import SearchView from './SearchView';
import { useStyles } from './style';
import type { MentionCategory, MentionCategoryId, MentionMenuState } from './types';
import { CATEGORY_KEY_PREFIX, getCategoryIdFromKey, isCategoryEntry } from './types';
import { useKeyboardNav } from './useKeyboardNav';
import { useMenuPosition } from './useMenuPosition';

interface MenuRenderProps {
  activeKey: string | null;
  loading?: boolean;
  onSelect?: (option: ISlashMenuOption) => void;
  open?: boolean;
  options: Array<ISlashOption>;
  setActiveKey: (key: string | null) => void;
}

const getMostRecentItems = (options: ISlashMenuOption[], count: number): ISlashMenuOption[] => {
  return [...options]
    .sort((a, b) => {
      const ta = (a as any).metadata?.timestamp || 0;
      const tb = (b as any).metadata?.timestamp || 0;
      return tb - ta;
    })
    .slice(0, count);
};

const buildCategoryEntries = (categories: MentionCategory[]): ISlashMenuOption[] =>
  categories
    .filter((c) => c.items.length > 0)
    .map((cat) => ({
      icon: cat.icon,
      key: `${CATEGORY_KEY_PREFIX}${cat.id}`,
      label: cat.label,
      metadata: { categoryId: cat.id, count: cat.items.length, type: '__category__' },
    }));

const SORT_PRIORITY: Record<string, number> = {
  'agent': 0,
  'lark-doc': 1,
  'lark-user': 2,
  'topic': 3,
};

const sortItems = (items: ISlashMenuOption[]): ISlashMenuOption[] => {
  return [...items].sort((a, b) => {
    const typeA = (a.metadata as any)?.type || '';
    const typeB = (b.metadata as any)?.type || '';
    return (SORT_PRIORITY[typeA] ?? 99) - (SORT_PRIORITY[typeB] ?? 99);
  });
};

const limitItemsPerCategory = (items: ISlashMenuOption[], limit: number): ISlashMenuOption[] => {
  const groups: Record<string, ISlashMenuOption[]> = {};
  for (const item of items) {
    const type = (item.metadata as any)?.type || 'unknown';
    if (!groups[type]) groups[type] = [];
    if (groups[type].length < limit) {
      groups[type].push(item);
    }
  }
  return Object.values(groups).flat();
};

export const createMentionMenu = (
  stateRef: RefObject<MentionMenuState>,
  categoriesRef: RefObject<MentionCategory[]>,
): FC<MenuRenderProps> => {
  const MentionMenu: FC<MenuRenderProps> = memo(
    ({ activeKey, onSelect, open, options, setActiveKey }) => {
      const { styles } = useStyles();
      const menuRef = useRef<HTMLDivElement>(null);
      const [viewMode, setViewMode] = useState<'home' | 'category'>('home');
      const [selectedCategoryId, setSelectedCategoryId] = useState<MentionCategoryId | null>(null);

      const isSearch = stateRef.current.isSearch;
      const categories = categoriesRef.current;

      const position = useMenuPosition(menuRef, !!open);

      // Reset on open
      useEffect(() => {
        if (open) {
          setViewMode('home');
          setSelectedCategoryId(null);
        }
      }, [open]);

      // Filter options to only ISlashMenuOption (exclude dividers)
      const menuOptions = useMemo(
        () => options.filter((o): o is ISlashMenuOption => 'key' in o && !!o.key),
        [options],
      );

      // Category entries as pseudo-items for keyboard navigation
      const categoryEntries = useMemo(() => buildCategoryEntries(categories), [categories]);

      // Derive visible items for current view
      const visibleItems = useMemo((): ISlashMenuOption[] => {
        if (isSearch) return sortItems(limitItemsPerCategory(menuOptions, 4));

        if (viewMode === 'category' && selectedCategoryId) {
          const cat = categories.find((c) => c.id === selectedCategoryId);
          return cat?.items || [];
        }

        // Home: 4 docs + 4 users (most recent) + category entries
        const docs = getMostRecentItems(
          menuOptions.filter((o) => o.metadata?.type === 'lark-doc'),
          4,
        );
        const users = getMostRecentItems(
          menuOptions.filter((o) => o.metadata?.type === 'lark-user'),
          4,
        );

        const recent = sortItems([...docs, ...users]);
        return [...recent, ...categoryEntries];
      }, [menuOptions, isSearch, viewMode, selectedCategoryId, categories, categoryEntries]);

      // Sync activeKey on view/options change
      useEffect(() => {
        if (open && visibleItems.length > 0) {
          setActiveKey(String(visibleItems[0].key));
        }
      }, [open, viewMode, selectedCategoryId, isSearch, visibleItems, setActiveKey]);

      const handleSelectCategory = useCallback((id: MentionCategoryId) => {
        setViewMode('category');
        setSelectedCategoryId(id);
      }, []);

      const handleBack = useCallback(() => {
        setViewMode('home');
        setSelectedCategoryId(null);
      }, []);

      // Item selection — intercept category entries
      const handleSelectItem = useCallback(
        (item: ISlashMenuOption) => {
          const key = String(item.key);
          if (isCategoryEntry(key)) {
            handleSelectCategory(getCategoryIdFromKey(key));
            return;
          }
          onSelect?.(item);
        },
        [onSelect, handleSelectCategory],
      );

      const effectiveMode = isSearch ? 'search' : viewMode;

      useKeyboardNav({
        activeKey,
        mode: effectiveMode === 'search' ? 'search' : viewMode,
        onBack: handleBack,
        onSelect: handleSelectItem,
        open: !!open,
        setActiveKey,
        visibleItems,
      });

      const lobeApp = useMemo(
        () => document.getElementById(LOBE_THEME_APP_ID) ?? document.body,
        [],
      );
      if (!open) return null;

      const selectedCategory = selectedCategoryId
        ? categories.find((c) => c.id === selectedCategoryId)
        : null;

      // Index where category entries start (for divider placement in HomeView)
      const recentCount =
        effectiveMode === 'home' ? visibleItems.length - categoryEntries.length : 0;

      const menu = (
        <div
          aria-activedescendant={activeKey ? `mention-item-${activeKey}` : undefined}
          className={styles.container}
          ref={menuRef}
          role="listbox"
          style={{
            left: position.x,
            opacity: position.visible ? 1 : 0,
            pointerEvents: position.visible ? 'auto' : 'none',
            top: position.y,
            visibility: position.visible ? 'visible' : 'hidden',
          }}
        >
          {effectiveMode === 'home' && (
            <HomeView
              activeKey={activeKey}
              categories={categories}
              dividerIndex={recentCount}
              visibleItems={visibleItems}
              onSelectItem={handleSelectItem}
            />
          )}
          {effectiveMode === 'category' && selectedCategory && (
            <CategoryView
              activeKey={activeKey}
              category={selectedCategory}
              onBack={handleBack}
              onSelectItem={handleSelectItem}
            />
          )}
          {effectiveMode === 'search' && (
            <SearchView
              activeKey={activeKey}
              categories={categories}
              options={visibleItems}
              onSelectItem={handleSelectItem}
            />
          )}
        </div>
      );

      return createPortal(menu, lobeApp);
    },
  );

  MentionMenu.displayName = 'MentionMenu';
  return MentionMenu;
};
