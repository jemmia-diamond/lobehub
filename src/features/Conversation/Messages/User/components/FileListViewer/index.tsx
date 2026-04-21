import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { type ChatFileItem } from '@/types/index';

import FileItem from './Item';

interface FileListViewerProps {
  items: ChatFileItem[];
}

const FileListViewer = memo<FileListViewerProps>(({ items }) => {
  return (
    <Flexbox gap={8}>
      {items.map((item) => (
        <FileItem
          fileType={item.fileType}
          id={item.id}
          key={item.id}
          name={item.name}
          size={item.size}
          url={item.url}
        />
      ))}
    </Flexbox>
  );
});
export default FileListViewer;
