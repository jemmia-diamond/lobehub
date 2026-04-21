'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

interface CrawlSinglePageParams {
  url: string;
}

export const CrawlSinglePageInspector = memo<BuiltinInspectorProps<CrawlSinglePageParams>>(
  ({ args, partialArgs, isArgumentsStreaming }) => {
    const { t } = useTranslation('plugin');

    const url = args?.url || partialArgs?.url;

    const label = t('builtins.lobe-web-browsing.apiName.crawlSinglePage', {
      defaultValue: 'Đọc nội dung trang',
    });

    if (isArgumentsStreaming && !url) {
      return (
        <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
          <span>{label}</span>
        </div>
      );
    }

    return (
      <div
        className={cx(inspectorTextStyles.root, isArgumentsStreaming && shinyTextStyles.shinyText)}
      >
        <span>
          {label}:{'\u00A0'}
        </span>
        {url && <span className={highlightTextStyles.gold}>{url}</span>}
      </div>
    );
  },
);

CrawlSinglePageInspector.displayName = 'CrawlSinglePageInspector';

export default CrawlSinglePageInspector;
