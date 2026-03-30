import { Block, Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';

import FileIcon from '@/components/FileIcon';
import { LARK_BASE_URL } from '@/const/url';
import { useChatStore } from '@/store/chat';
import { type ChatFileItem } from '@/types/index';
import { formatSize } from '@/utils/format';

const FileItem = memo<ChatFileItem>(({ id, fileType, size, name, url }) => {
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
          openFilePreview({ fileId: id });
        }
      }}
    >
      <FileIcon fileName={name} fileType={fileType} size={32} />
      <Flexbox style={{ overflow: 'hidden' }}>
        <Text ellipsis>{name}</Text>
        {size > 0 && (
          <Text fontSize={12} type={'secondary'}>
            {formatSize(size)}
          </Text>
        )}
      </Flexbox>
    </Block>
  );
});
export default FileItem;
