import { type ChatContextContent } from '@lobechat/types';
import { Tag, Tooltip } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { TextIcon } from 'lucide-react';
import { memo, useMemo } from 'react';

import FileIcon from '@/components/FileIcon';
import { LARK_BASE_URL } from '@/const/url';
import { useChatStore } from '@/store/chat';
import { useFileStore } from '@/store/file';

const styles = createStaticStyles(({ css }) => ({
  name: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;

    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

const MAX_PREVIEW_LENGTH = 8;

const getPreviewText = (content?: string, fallback?: string) => {
  const source = content || fallback || '';
  if (!source) return 'Text selection';

  const plain = source
    .replaceAll(/<[^>]*>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
  if (!plain) return 'Text selection';

  return plain.length > MAX_PREVIEW_LENGTH ? `${plain.slice(0, MAX_PREVIEW_LENGTH)}...` : plain;
};

const SelectionItem = memo<ChatContextContent & { fileType?: string }>(
  ({ preview, id, fileType, url }) => {
    const [removeSelection] = useFileStore((s) => [s.removeChatContextSelection]);
    const [openLarkPreview] = useChatStore((s) => [s.openLarkPreview]);

    const displayText = useMemo(() => getPreviewText(preview), [preview]);

    const icon = useMemo(() => {
      if (id.startsWith('lark-')) {
        const ext =
          fileType === 'sheet'
            ? 'xlsx'
            : fileType === 'slide'
              ? 'pptx'
              : fileType === 'bitable'
                ? 'table'
                : fileType === 'mindnote'
                  ? 'mindmap'
                  : fileType === 'folder'
                    ? 'folder'
                    : 'doc';
        return <FileIcon fileName={`file.${ext}`} size={16} />;
      }
      return <TextIcon size={16} />;
    }, [id, fileType]);

    return (
      <Tag
        closable
        icon={icon}
        size={'large'}
        onClose={() => removeSelection(id)}
        onClick={() => {
          if (id.startsWith('lark-')) {
            const token = id.replace('lark-', '');
            const larkUrl = url || `${LARK_BASE_URL}/wiki/${token}`;
            openLarkPreview(larkUrl, preview || '');
          }
        }}
      >
        <Tooltip title={preview}>
          <span className={styles.name}>{displayText}</span>
        </Tooltip>
      </Tag>
    );
  },
);

SelectionItem.displayName = 'SelectionItem';

export default SelectionItem;
