import type { ISlashMenuOption } from '@lobehub/editor';
import { memo } from 'react';

import MenuItem from './MenuItem';
import { styles } from './style';
import type { MentionCategory } from './types';

interface SearchViewProps {
  activeKey: string | null;
  categories: MentionCategory[];
  onSelectItem: (item: ISlashMenuOption) => void;
  options: ISlashMenuOption[];
}

const SearchView = memo<SearchViewProps>(({ options, activeKey, onSelectItem, categories }) => {
  if (options.length === 0) {
    return <div className={styles.empty}>No results</div>;
  }

  return (
    <div className={styles.scrollArea}>
      {options.map((item, index) => {
        const prevItem = options[index - 1];
        const currentCategoryId = (item.metadata as any)?.type;
        const prevCategoryId = (prevItem?.metadata as any)?.type;

        const showHeader = currentCategoryId !== prevCategoryId;
        const category = categories.find((c) => c.id === currentCategoryId);

        return (
          <div key={item.key}>
            {showHeader && category && <div className={styles.categoryTitle}>{category.label}</div>}
            <MenuItem active={String(item.key) === activeKey} item={item} onClick={onSelectItem} />
          </div>
        );
      })}
    </div>
  );
});

SearchView.displayName = 'SearchView';

export default SearchView;
