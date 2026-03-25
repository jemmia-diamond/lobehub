import type { ISlashMenuOption } from '@lobehub/editor';
import { ChevronRight } from 'lucide-react';
import { memo } from 'react';

import MenuItem from './MenuItem';
import { useStyles } from './style';
import { isCategoryEntry, type MentionCategory } from './types';

interface HomeViewProps {
  activeKey: string | null;
  categories: MentionCategory[];
  dividerIndex: number;
  onSelectItem: (item: ISlashMenuOption) => void;
  visibleItems: ISlashMenuOption[];
}

const HomeView = memo<HomeViewProps>(
  ({ visibleItems, activeKey, onSelectItem, dividerIndex, categories }) => {
    const { styles } = useStyles();

    return (
      <div className={styles.scrollArea}>
        {visibleItems.map((item, idx) => {
          const isCategory = isCategoryEntry(String(item.key));
          const showDivider = idx === dividerIndex && dividerIndex > 0;

          return (
            <div key={item.key}>
              {showDivider && <div className={styles.divider} />}
              {!isCategory && (
                <>
                  {(() => {
                    const prevItem = visibleItems[idx - 1];
                    const currentCategoryId = (item.metadata as any)?.type;
                    const prevCategoryId = (prevItem?.metadata as any)?.type;

                    const showHeader = currentCategoryId !== prevCategoryId;
                    const category = categories.find((c) => c.id === currentCategoryId);

                    if (showHeader && category) {
                      return <div className={styles.categoryTitle}>{category.label}</div>;
                    }
                    return null;
                  })()}
                </>
              )}
              <MenuItem
                active={String(item.key) === activeKey}
                item={item}
                extra={
                  isCategory ? (
                    <span className={styles.categoryExtra}>
                      {(item as any).metadata?.count}
                      <ChevronRight size={14} />
                    </span>
                  ) : undefined
                }
                onClick={onSelectItem}
              />
            </div>
          );
        })}
      </div>
    );
  },
);

HomeView.displayName = 'HomeView';

export default HomeView;
