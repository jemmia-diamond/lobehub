'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { Text } from '@lobehub/ui';
import { cssVar, cx } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { SearchKnowledgeBaseArgs, SearchKnowledgeBaseState } from '../../..';

export const SearchKnowledgeBaseInspector = memo<
  BuiltinInspectorProps<SearchKnowledgeBaseArgs, SearchKnowledgeBaseState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const { t } = useTranslation('plugin');

  const query = args?.query || partialArgs?.query || '';
  // Use fileResults length for display (aggregated by file)
  const resultCount = pluginState?.fileResults?.length ?? 0;
  const hasResults = resultCount > 0;

  const searchLabel = t('builtins.lobe-knowledge-base.apiName.searchKnowledgeBase', {
    defaultValue: 'Tìm kiếm Thư viện',
  });
  const noResultsLabel = t('builtins.lobe-knowledge-base.inspector.noResults', {
    defaultValue: 'Không có kết quả',
  });

  if (isArgumentsStreaming) {
    if (!query)
      return (
        <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
          <span>{searchLabel}</span>
        </div>
      );

    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>{searchLabel}: </span>
        <span className={highlightTextStyles.gold}>{query}</span>
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span style={{ marginInlineStart: 2 }}>
        <span>{searchLabel}: </span>
        {query && <span className={highlightTextStyles.gold}>{query}</span>}
        {!isLoading &&
          pluginState?.fileResults &&
          (hasResults ? (
            <span style={{ marginInlineStart: 4 }}>({resultCount})</span>
          ) : (
            <Text
              as={'span'}
              color={cssVar.colorTextDescription}
              fontSize={12}
              style={{ marginInlineStart: 4 }}
            >
              ({noResultsLabel})
            </Text>
          ))}
      </span>
    </div>
  );
});

SearchKnowledgeBaseInspector.displayName = 'SearchKnowledgeBaseInspector';
