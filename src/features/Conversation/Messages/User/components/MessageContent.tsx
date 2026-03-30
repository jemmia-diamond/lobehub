import { Flexbox } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import MarkdownMessage from '@/features/Conversation/Markdown';
import { cleanSpeakerTag } from '@/store/chat/utils/cleanSpeakerTag';
import { type UIChatMessage } from '@/types/index';

import { useMarkdown } from '../useMarkdown';
import FileListViewer from './FileListViewer';
import ImageFileListViewer from './ImageFileListViewer';
import PageSelections from './PageSelections';
import RichTextMessage from './RichTextMessage';
import VideoFileListViewer from './VideoFileListViewer';

const UserMessageContent = memo<UIChatMessage>(
  ({ id, content, editorData, imageList, videoList, fileList, metadata }) => {
    const markdownProps = useMarkdown(id);
    const pageSelections = metadata?.pageSelections;
    const displayContent = useMemo(() => (content ? cleanSpeakerTag(content) : content), [content]);

    const combinedFileList = useMemo(() => {
      const larkDocs = metadata?.larkDocs || [];
      const larkItems = larkDocs.map((doc) => {
        const ext =
          doc.fileType === 'sheet'
            ? 'xlsx'
            : doc.fileType === 'slide'
              ? 'pptx'
              : doc.fileType === 'bitable'
                ? 'table'
                : doc.fileType === 'mindnote'
                  ? 'mindmap'
                  : doc.fileType === 'folder'
                    ? 'folder'
                    : 'docx';

        return {
          fileType: ext,
          id: doc.id,
          name: doc.title,
          size: 0,
          url: doc.url || '',
        };
      });
      return [...(fileList || []), ...larkItems];
    }, [fileList, metadata?.larkDocs]);

    const hasEditorData =
      editorData && typeof editorData === 'object' && Object.keys(editorData).length > 0;

    return (
      <Flexbox gap={8} id={id}>
        {pageSelections && pageSelections.length > 0 && (
          <PageSelections selections={pageSelections} />
        )}
        {hasEditorData ? (
          <RichTextMessage editorState={editorData} />
        ) : (
          displayContent && <MarkdownMessage {...markdownProps}>{displayContent}</MarkdownMessage>
        )}
        {imageList && imageList?.length > 0 && <ImageFileListViewer items={imageList} />}
        {videoList && videoList?.length > 0 && <VideoFileListViewer items={videoList} />}
        {combinedFileList.length > 0 && <FileListViewer items={combinedFileList} />}
      </Flexbox>
    );
  },
);

export default UserMessageContent;
