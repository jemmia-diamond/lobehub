import { Block, Flexbox, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import FileIcon from '@/components/FileIcon';
import { LARK_BASE_URL } from '@/const/url';
import { useChatStore } from '@/store/chat';
import { type ChatFileItem } from '@/types/index';
import { formatSize } from '@/utils/format';

const useStyles = createStyles(({ css, token }) => ({
  detailButton: css`
    cursor: pointer;

    padding-block: 4px;
    padding-inline: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;

    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextSecondary};

    background: #fff;

    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorBorder};
      color: ${token.colorText};
      background: ${token.colorFillTertiary};
    }
  `,
}));

const FileItem = memo<ChatFileItem>(({ id, fileType, size, name, url }) => {
  const { t } = useTranslation('common');
  const { styles } = useStyles();
  const [openFilePreview, openLarkPreview] = useChatStore((s) => [
    s.openFilePreview,
    s.openLarkPreview,
  ]);
  return (
    <Block
      clickable
      horizontal
      align={'center'}
      gap={12}
      key={id}
      paddingBlock={8}
      paddingInline={'12px 16px'}
      variant={'outlined'}
      onClick={() => {
        if (id.startsWith('lark-')) {
          const token = id.replace('lark-', '');
          const larkUrl = url || `${LARK_BASE_URL}/wiki/${token}`;
          openLarkPreview(larkUrl, name);
        } else {
          openFilePreview({ fileId: id, fileType, name, url });
        }
      }}
    >
      <Flexbox horizontal align={'center'} gap={12} style={{ flex: 1, overflow: 'hidden' }}>
        <FileIcon fileName={name} fileType={fileType} size={32} />
        <Flexbox style={{ overflow: 'hidden' }}>
          <Text ellipsis>{name}</Text>
          {size > 0 && (
            <Text fontSize={12} type={'secondary'}>
              {formatSize(size)}
            </Text>
          )}
        </Flexbox>
      </Flexbox>
      <div className={styles.detailButton}>{t('appLoading.showDetail')}</div>
    </Block>
  );
});
export default FileItem;
