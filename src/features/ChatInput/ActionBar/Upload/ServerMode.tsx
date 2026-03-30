import { validateVideoFileSize } from '@lobechat/utils/client';
import { Icon, type ItemType } from '@lobehub/ui';
import { Upload } from 'antd';
import { css, cx } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { ArrowRight, LibraryBig, Paperclip } from 'lucide-react';
import { memo, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import FileIcon from '@/components/FileIcon';
import RepoIcon from '@/components/LibIcon';
import TipGuide from '@/components/TipGuide';
import { AttachKnowledgeModal } from '@/features/LibraryModal';
import SearchDocsModal from '@/features/ResourceManager/components/SearchDocsModal';
import { useModelSupportVision } from '@/hooks/useModelSupportVision';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useFileStore } from '@/store/file';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { preferenceSelectors } from '@/store/user/selectors';

import { useAgentId } from '../../hooks/useAgentId';
import Action from '../components/Action';
import { type ActionDropdownMenuItems } from '../components/ActionDropdown';
import CheckboxItem from '../components/CheckboxWithLoading';

const hotArea = css`
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
  }
`;

const FileUpload = memo(() => {
  const { t } = useTranslation('chat');
  const upload = useFileStore((s) => s.uploadChatFiles);
  const {
    enableFileUpload,
    enableLarkTools,
    showUploadFile,
    showUploadLark,
    showUploadImage,
    showUploadFolder,
    enableViewMoreUploadFile,
    showRelatedFileInSelectionModal,
  } = useServerConfigStore(featureFlagsSelectors);

  const agentId = useAgentId();
  const model = useAgentStore((s) => agentByIdSelectors.getAgentModelById(agentId)(s));
  const provider = useAgentStore((s) => agentByIdSelectors.getAgentModelProviderById(agentId)(s));

  const canUploadImage = useModelSupportVision(model, provider);

  const [showTip, updateGuideState] = useUserStore((s) => [
    preferenceSelectors.showUploadFileInKnowledgeBaseTip(s),
    s.updateGuideState,
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchDocsModalOpen, setSearchDocsModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const files = useAgentStore((s) => agentByIdSelectors.getAgentFilesById(agentId)(s), isEqual);
  const knowledgeBases = useAgentStore(
    (s) => agentByIdSelectors.getAgentKnowledgeBasesById(agentId)(s),
    isEqual,
  );

  const [toggleFile, toggleKnowledgeBase] = useAgentStore((s) => [
    s.toggleFile,
    s.toggleKnowledgeBase,
  ]);

  const uploadItems: ActionDropdownMenuItems = [
    ...(enableFileUpload && showUploadFile
      ? [
          {
            closeOnClick: false,
            key: 'upload-file',
            icon: (
              <span
                className="material-symbols-outlined"
                style={{ color: '#3b82f6', fontSize: 18 }}
              >
                upload_file
              </span>
            ),
            label: (
              <Upload
                multiple
                showUploadList={false}
                beforeUpload={async (file) => {
                  if (
                    !canUploadImage &&
                    (file.type.startsWith('image') || file.type.startsWith('video'))
                  ) {
                    message.error(t('upload.action.imageDisabled'));
                    return false;
                  }

                  const validation = validateVideoFileSize(file);
                  if (!validation.isValid) {
                    message.error(
                      t('upload.validation.videoSizeExceeded', {
                        actualSize: validation.actualSize,
                      }),
                    );
                    return false;
                  }

                  setDropdownOpen(false);
                  await upload([file]);

                  return false;
                }}
              >
                <div className={cx(hotArea)}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {t('upload.action.fileUpload')}
                  </span>
                </div>
              </Upload>
            ),
          },
        ]
      : []),
    ...(enableLarkTools && showUploadLark
      ? [
          {
            closeOnClick: true,
            key: 'upload-lark',
            icon: (
              <span
                className="material-symbols-outlined"
                style={{ color: '#22c55e', fontSize: 18 }}
              >
                description
              </span>
            ),
            label: (
              <div
                className={cx(hotArea)}
                onClick={() => {
                  setDropdownOpen(false);
                  setSearchDocsModalOpen(true);
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{t('larkSelectAction')}</span>
              </div>
            ),
          },
        ]
      : []),
    ...(canUploadImage && showUploadImage
      ? [
          {
            closeOnClick: false,
            key: 'upload-image',
            icon: (
              <span
                className="material-symbols-outlined"
                style={{ color: '#a855f7', fontSize: 18 }}
              >
                image
              </span>
            ),
            label: (
              <Upload
                multiple
                accept={'image/*'}
                showUploadList={false}
                beforeUpload={async (file) => {
                  setDropdownOpen(false);
                  await upload([file]);

                  return false;
                }}
              >
                <div className={cx(hotArea)}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {t('upload.action.imageUpload')}
                  </span>
                </div>
              </Upload>
            ),
          },
        ]
      : []),
    ...(enableFileUpload && showUploadFolder
      ? [
          {
            closeOnClick: false,
            key: 'upload-folder',
            icon: (
              <span
                className="material-symbols-outlined"
                style={{ color: '#f59e0b', fontSize: 18 }}
              >
                create_new_folder
              </span>
            ),
            label: (
              <Upload
                directory
                multiple={true}
                showUploadList={false}
                beforeUpload={async (file) => {
                  if (
                    !canUploadImage &&
                    (file.type.startsWith('image') || file.type.startsWith('video'))
                  ) {
                    message.error(t('upload.action.imageDisabled'));
                    return false;
                  }

                  const validation = validateVideoFileSize(file);
                  if (!validation.isValid) {
                    message.error(
                      t('upload.validation.videoSizeExceeded', {
                        actualSize: validation.actualSize,
                      }),
                    );
                    return false;
                  }

                  setDropdownOpen(false);
                  await upload([file]);

                  return false;
                }}
              >
                <div className={cx(hotArea)}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {t('upload.action.folderUpload')}
                  </span>
                </div>
              </Upload>
            ),
          },
        ]
      : []),
  ];

  const knowledgeItems: ItemType[] = [];

  // Only add knowledge base items if there are files or knowledge bases
  if (showRelatedFileInSelectionModal && (files.length > 0 || knowledgeBases.length > 0)) {
    knowledgeItems.push({
      children: [
        // first the files
        ...files.map((item) => ({
          icon: <FileIcon fileName={item.name} fileType={item.type} size={20} />,
          key: item.id,
          label: (
            <CheckboxItem
              checked={item.enabled}
              id={item.id}
              label={item.name}
              onUpdate={async (id, enabled) => {
                setUpdating(true);
                await toggleFile(id, enabled);
                setUpdating(false);
              }}
            />
          ),
        })),

        // then the knowledge bases
        ...knowledgeBases.map((item) => ({
          icon: <RepoIcon />,
          key: item.id,
          label: (
            <CheckboxItem
              checked={item.enabled}
              id={item.id}
              label={item.name}
              onUpdate={async (id, enabled) => {
                setUpdating(true);
                await toggleKnowledgeBase(id, enabled);
                setUpdating(false);
              }}
            />
          ),
        })),
      ],
      key: 'relativeFilesOrLibraries',
      label: t('knowledgeBase.relativeFilesOrLibraries'),
      type: 'group',
    });
  }

  // Always add the "View More" option if enabled
  if (enableViewMoreUploadFile) {
    knowledgeItems.push(
      {
        type: 'divider',
      },
      {
        extra: <Icon icon={ArrowRight} />,
        icon: LibraryBig,
        key: 'knowledge-base-store',
        label: t('knowledgeBase.viewMore'),
        onClick: () => {
          setModalOpen(true);
        },
      },
    );
  }

  const items: ActionDropdownMenuItems = [
    ...uploadItems,
    ...(knowledgeItems.length > 0 ? knowledgeItems : []),
  ];

  const content = (
    <Action
      icon={Paperclip}
      loading={updating}
      open={dropdownOpen}
      showTooltip={false}
      title={t('upload.action.tooltip')}
      trigger={'both'}
      dropdown={{
        maxHeight: 500,
        maxWidth: 480,
        menu: { items },
        minWidth: 240,
      }}
      onOpenChange={setDropdownOpen}
    />
  );

  return (
    <Suspense fallback={<Action disabled icon={Paperclip} title={t('upload.action.tooltip')} />}>
      {showTip ? (
        <TipGuide
          open={showTip}
          placement={'top'}
          title={t('knowledgeBase.uploadGuide')}
          onOpenChange={() => {
            updateGuideState({ uploadFileInKnowledgeBase: false });
          }}
        >
          {content}
        </TipGuide>
      ) : (
        content
      )}
      <AttachKnowledgeModal open={modalOpen} setOpen={setModalOpen} />
      <SearchDocsModal open={searchDocsModalOpen} onClose={() => setSearchDocsModalOpen(false)} />
    </Suspense>
  );
});

export default FileUpload;
