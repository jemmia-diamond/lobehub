import { useCallback } from 'react';

import { useDragUploadContext } from './DragUploadProvider';

/**
 * Process a FileSystemEntry recursively to extract all files
 */
const processEntry = async (entry: FileSystemEntry): Promise<File[]> => {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file((file) => {
        resolve([file]);
      });
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      dirReader.readEntries(async (entries) => {
        const filesPromises = entries.map((element) => processEntry(element));
        const fileArrays = await Promise.all(filesPromises);
        resolve(fileArrays.flat());
      });
    } else {
      resolve([]);
    }
  });
};

/**
 * Extract files from DataTransferItems, supporting both files and directories
 */
export const getFileListFromDataTransferItems = async (
  items: DataTransferItem[],
): Promise<File[]> => {
  const filePromises: Promise<File[]>[] = [];

  for (const item of items) {
    if (item.kind === 'file') {
      // Safari browser may throw error when using FileSystemFileEntry.file()
      // So we prioritize using getAsFile() method first for better browser compatibility
      const file = item.getAsFile();

      if (file) {
        filePromises.push(Promise.resolve([file]));
      } else {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          filePromises.push(processEntry(entry));
        }
      }
    }
  }

  const fileArrays = await Promise.all(filePromises);
  return fileArrays.flat();
};

export interface UseLocalDragUploadOptions {
  /**
   * Whether the drag upload is disabled
   */
  disabled?: boolean;
  id: string;
  /**
   * Callback when files are dropped
   */
  onUploadFiles: (files: File[]) => void | Promise<void>;
}

export interface UseLocalDragUploadResult {
  /**
   * Props to spread on the container element
   */
  getContainerProps: () => {
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Hook for handling local (container-scoped) drag and drop file uploads.
 *
 * This hook only handles dragOver (to allow drop) and drop events.
 * The global drag state is managed by DragUploadProvider.
 */
export const useLocalDragUpload = (
  options: UseLocalDragUploadOptions,
): UseLocalDragUploadResult => {
  const { onUploadFiles, disabled = false, id } = options;
  const { clearDraggingState, setActiveDropZoneId } = useDragUploadContext();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      if (!e.dataTransfer?.types.includes('Files')) return;

      e.preventDefault();
      e.stopPropagation();
      setActiveDropZoneId(id);
    },
    [disabled, id, setActiveDropZoneId],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (disabled) return;
      if (!e.dataTransfer?.items || e.dataTransfer.items.length === 0) return;

      const isFile = e.dataTransfer.types.includes('Files');
      if (!isFile) return;

      e.preventDefault();
      e.stopPropagation();
      clearDraggingState();

      const items = Array.from(e.dataTransfer.items);
      const files = await getFileListFromDataTransferItems(items);

      if (files.length === 0) return;

      onUploadFiles(files);
    },
    [clearDraggingState, disabled, onUploadFiles],
  );

  const getContainerProps = useCallback(
    () => ({
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragOver, handleDrop],
  );

  return {
    getContainerProps,
  };
};
