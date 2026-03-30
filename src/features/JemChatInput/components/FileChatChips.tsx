'use client';

import { ActionIcon, Flexbox } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { FileText, Image as ImageIcon, X } from 'lucide-react';
import { memo } from 'react';

import { LARK_BASE_URL } from '@/const/url';
import { useChatStore } from '@/store/chat';
import { useFileStore } from '@/store/file';
import { fileChatSelectors } from '@/store/file/slices/chat/selectors';

const useStyles = createStyles(({ css, token }) => ({
  chip: css`
    cursor: pointer;
    user-select: none;

    padding-block: 6px;
    padding-inline: 10px;
    border: 1px solid rgb(169 180 185 / 15%);
    border-radius: 8px;

    background: #fff;
    box-shadow: 0 2px 4px rgb(0 0 0 / 2%);

    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: rgb(169 180 185 / 30%);
      box-shadow: 0 4px 8px rgb(0 0 0 / 4%);
    }
  `,
  container: css`
    scrollbar-width: none;

    overflow-x: auto;
    display: flex;
    gap: 8px;

    padding-block: 8px;
    padding-inline: 4px;

    /* Hide scrollbar */
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorPrimary};
  `,
  text: css`
    overflow: hidden;

    max-width: 120px;

    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

interface FileChatChipsProps {
  onAdd?: () => void;
}

const FileChatChips = memo<FileChatChipsProps>(({ onAdd }) => {
  const { styles } = useStyles();
  const fileList = useFileStore(fileChatSelectors.chatUploadFileList);
  const contextSelections = useFileStore(fileChatSelectors.chatContextSelections);
  const [removeFile, removeChatContextSelection] = useFileStore((s) => [
    s.removeChatUploadFile,
    s.removeChatContextSelection,
  ]);
  const [openFilePreview, openLarkPreview] = useChatStore((s) => [
    s.openFilePreview,
    s.openLarkPreview,
  ]);

  if (fileList.length === 0 && contextSelections.length === 0) return null;

  const renderIcon = (type: string, name: string) => {
    if (
      type.startsWith('image/') ||
      name.toLowerCase().endsWith('.png') ||
      name.toLowerCase().endsWith('.jpg') ||
      name.toLowerCase().endsWith('.jpeg')
    ) {
      return <ImageIcon size={14} style={{ color: '#3b82f6' }} />;
    }
    if (name.toLowerCase().endsWith('.pdf')) {
      return <FileText size={14} style={{ color: '#ef4444' }} />;
    }
    // Default or Doc
    return <FileText size={14} style={{ color: '#22c55e' }} />;
  };

  return (
    <div className={styles.container}>
      {/* Uploaded Files */}
      {fileList.map((item) => (
        <Flexbox
          horizontal
          align="center"
          className={styles.chip}
          gap={8}
          key={item.id}
          onClick={() => openFilePreview({ fileId: item.id })}
        >
          <div className={styles.iconWrapper}>{renderIcon(item.file.type, item.file.name)}</div>
          <span className={styles.text}>{item.file.name}</span>
          <ActionIcon
            icon={X}
            size={{ blockSize: 16, borderRadius: 4 }}
            title="Remove"
            onClick={() => removeFile(item.id)}
          />
        </Flexbox>
      ))}

      {/* Selected Knowledge Base / Lark Docs */}
      {contextSelections.map((item) => (
        <Flexbox
          horizontal
          align="center"
          className={styles.chip}
          gap={8}
          key={item.id}
          onClick={() => {
            const token = item.id.replace('lark-', '');
            openLarkPreview(`${LARK_BASE_URL}/wiki/${token}`, item.preview || '');
          }}
        >
          <div className={styles.iconWrapper}>
            <FileText size={14} style={{ color: '#22c55e' }} />
          </div>
          <span className={styles.text}>{item.preview}</span>
          <ActionIcon
            icon={X}
            size={{ blockSize: 16, borderRadius: 4 }}
            title="Remove"
            onClick={() => removeChatContextSelection(item.id)}
          />
        </Flexbox>
      ))}

      {/* Add Button */}
      {onAdd && (
        <Flexbox
          horizontal
          align="center"
          className={styles.chip}
          justify="center"
          style={{
            background: 'transparent',
            border: '1.5px dashed rgb(169 180 185 / 30%)',
            boxShadow: 'none',
            cursor: 'pointer',
            paddingInline: 8,
          }}
          onClick={onAdd}
        >
          <span style={{ color: 'rgb(169 180 185 / 60%)', fontSize: 18, fontWeight: 300 }}>+</span>
        </Flexbox>
      )}
    </div>
  );
});

export default FileChatChips;
