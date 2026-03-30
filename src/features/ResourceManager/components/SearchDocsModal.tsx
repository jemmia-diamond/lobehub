import { LarkDocIdentifier } from '@lobechat/builtin-tool-lark-doc';
import { useDebounce } from 'ahooks';
import {
  Avatar,
  Dropdown,
  Flex,
  Input,
  type MenuProps,
  Modal,
  Pagination,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { LARK_BASE_URL } from '@/const/url';
import { larkDocService } from '@/services/larkDoc';
import { larkMessageService } from '@/services/larkMessage';
import { agentSelectors } from '@/store/agent/selectors';
import { useAgentStore } from '@/store/agent/store';
import { useFileStore } from '@/store/file';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

interface SearchDocsModalProps {
  onClose?: () => void;
  open: boolean;
}

interface FormattedDoc {
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  key: string;
  title: string;
  url: string;
}

const SearchDocsModal = memo<SearchDocsModalProps>(({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, { wait: 350 });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<number | undefined>(1);
  const [activeSortLabel, setActiveSortLabel] = useState<string>(() => t('lark.filter.sort'));

  const {
    showLarkSearchFilterSort,
    showLarkSearchFilterOwner,
    showLarkSearchFilterChat,
    showLarkSearchFilterWiki,
    showLarkSearchFilterFormat,
  } = useServerConfigStore(featureFlagsSelectors);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const debouncedOwnerQuery = useDebounce(ownerSearchQuery, { wait: 350 });
  const [activeOwnerLabel, setActiveOwnerLabel] = useState<string>(() => t('lark.filter.from'));

  const [chatIds, setChatIds] = useState<string[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const debouncedChatQuery = useDebounce(chatSearchQuery, { wait: 350 });
  const [activeChatLabel, setActiveChatLabel] = useState<string>(() => t('lark.filter.sharedIn'));

  const addChatContextSelection = useFileStore((s) => s.addChatContextSelection);
  const toggleAgentPlugin = useAgentStore((s) => s.toggleAgentPlugin);

  const { data: groupsData, isLoading: isGroupsLoading } = useSWR(
    open ? ['lark-groups-search', debouncedChatQuery] : null,
    async ([, q]) => {
      const res = (await larkMessageService.getChats({
        pageSize: 4,
        sortType: 'ByActiveTimeDesc',
        userIdType: 'open_id',
      })) as any;
      if (!res?.success) return [];
      try {
        const data = JSON.parse(res.content);
        const allGroups = data.items || [];
        if (!q) return allGroups.slice(0, 4);
        return allGroups.filter((g: any) =>
          g.name?.toLowerCase().includes((q as string).toLowerCase()),
        );
      } catch {
        return [];
      }
    },
  );

  const { data: employeesData, isLoading: isEmployeesLoading } = useSWR(
    open ? ['lark-employees-search', debouncedOwnerQuery] : null,
    async ([, q]) => {
      let queryToUse = q as string;
      if (!queryToUse) {
        const VIETNAMESE_INITIALS = [
          'a',
          'b',
          'c',
          'd',
          'đ',
          'h',
          'l',
          'm',
          'n',
          'p',
          's',
          't',
          'v',
        ];
        queryToUse = VIETNAMESE_INITIALS[Math.floor(Math.random() * VIETNAMESE_INITIALS.length)];
      }

      const res = (await larkMessageService.searchEmployees({
        pageSize: 4,
        query: queryToUse,
      })) as any;
      if (!res?.success) return [];
      try {
        const data = JSON.parse(res.content);
        return data.items || [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, ownerIds, chatIds]);

  const { data: dataObj, isLoading } = useSWR(
    open ? ['lark-search', debouncedQuery, page, sortBy, ownerIds, chatIds] : null,
    async ([, q, p, s, o, c]) => {
      const res = (await larkDocService.searchDocs({
        chatIds: c as string[],
        ownerIds: o as string[],
        page: p as number,
        pageSize: 15,
        query: q as string,
        sortBy: s as number,
      })) as any;
      if (!res?.success) return { items: [] };
      try {
        return JSON.parse(res.content);
      } catch {
        return { items: [] };
      }
    },
    {
      dedupingInterval: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: true,
    },
  );

  const getLarkName = (name: any): string => {
    if (!name) return '';
    if (typeof name === 'string') return name;
    return name.default_value || name.i18n_value || '';
  };

  const formattedData: FormattedDoc[] = useMemo(() => {
    const items = dataObj?.items || [];
    if (!Array.isArray(items)) return [];
    return items.map((doc: any) => {
      const rawType = doc.docs_type || doc.type || 'doc';
      const type = t(`lark.docType.${rawType}` as any);
      let icon = 'description';
      let iconColor = '#3b82f6';
      let iconBg = '#eff6ff';

      if (rawType === 'sheet') {
        icon = 'table_chart';
        iconColor = '#22c55e';
        iconBg = '#dcfce7';
      } else if (rawType === 'slide') {
        icon = 'slideshow';
        iconColor = '#f59e0b';
        iconBg = '#fef3c7';
      } else if (rawType === 'bitable') {
        icon = 'view_list';
        iconColor = '#a855f7';
        iconBg = '#f3e8ff';
      } else if (rawType === 'mindnote') {
        icon = 'account_tree';
        iconColor = '#ec4899';
        iconBg = '#fce7f3';
      } else if (rawType === 'file') {
        icon = 'draft';
        iconColor = '#64748b';
        iconBg = '#f1f5f9';
      } else if (rawType === 'folder') {
        icon = 'folder';
        iconColor = '#eab308';
        iconBg = '#fefce8';
      }

      const token = doc.token || doc.docs_token || doc.file_token || '';
      let url = doc.url || doc.link || doc.external_url || '';

      const rawTitle = getLarkName(doc.title || doc.name);
      const owner = getLarkName(doc.owner_id || doc.owner || doc.owner_name);

      if (!url && token) {
        const path =
          rawType === 'docx'
            ? 'docx'
            : rawType === 'sheet'
              ? 'sheets'
              : rawType === 'bitable'
                ? 'base'
                : rawType === 'mindnote'
                  ? 'mindnotes'
                  : rawType === 'wiki'
                    ? 'wiki'
                    : 'docs';
        url = `${LARK_BASE_URL}/${path}/${token}`;
      }

      return {
        description: t('lark.docDetail', {
          owner: owner || t('lark.docType.unknown'),
          type,
        }),
        icon,
        iconBg,
        iconColor,
        key: token || Math.random().toString(),
        title: rawTitle?.replaceAll(/<[^>]*>?/g, '') || t('lark.untitledDoc'), // Remove any tags like <em> inside title
        url,
      };
    });
  }, [dataObj, t]);

  const handleSelect = async (item: FormattedDoc) => {
    // 1. Add to chat context
    addChatContextSelection({
      content: `Lark Document ID: ${item.key}`,
      fileType:
        item.icon === 'table_chart'
          ? 'sheet'
          : item.icon === 'slideshow'
            ? 'slide'
            : item.icon === 'view_list'
              ? 'bitable'
              : item.icon === 'account_tree'
                ? 'mindnote'
                : item.icon === 'folder'
                  ? 'folder'
                  : 'doc',
      format: 'text',
      id: `lark-${item.key}`,
      preview: item.title,
      title: item.title,
      type: 'text',
      url: item.url,
    });

    // 2. Enable Lark Doc tool if not enabled
    const agentStore = useAgentStore.getState();
    const currentPlugins = agentSelectors.currentAgentPlugins(agentStore);
    if (!currentPlugins.includes(LarkDocIdentifier)) {
      await toggleAgentPlugin(LarkDocIdentifier, true);
    }

    // 3. Close modal
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  const sortItems: MenuProps['items'] = [
    { key: '3', label: t('lark.filter.viewed') },
    { key: '2', label: t('lark.filter.updated') },
    { key: '1', label: t('lark.filter.created') },
  ];

  const handleSortChange: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    const numericKey = Number(key);
    setSortBy(numericKey);
    const item = sortItems.find((i) => i?.key === key) as any;
    if (item) setActiveSortLabel(item.label);
  };

  const handleOwnerSelect = (employee: any) => {
    const id = employee.employee_id || employee.id;
    const name = getLarkName(employee.name);
    setOwnerIds([id]);
    setActiveOwnerLabel(name);
  };

  const handleClearOwner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOwnerIds([]);
    setActiveOwnerLabel(t('lark.filter.from'));
  };

  const handleChatSelect = (group: any) => {
    setChatIds([group.chat_id]);
    setActiveChatLabel(group.name);
  };

  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatIds([]);
    setActiveChatLabel(t('lark.filter.sharedIn'));
  };

  return (
    <Modal
      centered
      footer={null}
      mask={{ closable: true }}
      open={open}
      title={null}
      width={960}
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
          padding: 0,
        },
      }}
      onCancel={handleClose}
    >
      <div
        style={{
          borderBottom: '1px solid rgba(148,163,184,0.4)',
          padding: 24,
        }}
      >
        <Flex vertical gap={16}>
          <div style={{ position: 'relative' }}>
            <Input
              placeholder={t('lark.searchDocs')}
              size="large"
              style={{ paddingLeft: 150, paddingRight: 40 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span
              className="material-symbols-outlined"
              style={{
                color: '#9ca3af',
                fontSize: 20,
                left: 16,
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              search
            </span>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                left: 40,
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <Tag
                color="#dbeafe"
                style={{
                  alignItems: 'center',
                  color: '#171717',
                  display: 'inline-flex',
                  fontSize: 12,
                  fontWeight: 700,
                  gap: 4,
                  marginRight: 8,
                  padding: '2px 8px',
                }}
              >
                {t('lark.docs')}
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  close
                </span>
              </Tag>
            </div>
            {query && (
              <button
                className="material-symbols-outlined"
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 20,
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                onClick={() => setQuery('')}
              >
                close
              </button>
            )}
          </div>
          <Space
            size={8}
            style={{
              overflowX: 'auto',
              paddingBottom: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {showLarkSearchFilterSort && (
              <Dropdown menu={{ items: sortItems, onClick: handleSortChange }} trigger={['click']}>
                <Tag
                  color={sortBy !== 1 ? '#dbeafe' : undefined}
                  style={{
                    alignItems: 'center',
                    borderRadius: 8,
                    color: sortBy !== 1 ? '#171717' : undefined,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 12,
                    gap: 4,
                    padding: '4px 12px',
                  }}
                >
                  {activeSortLabel}
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    expand_more
                  </span>
                </Tag>
              </Dropdown>
            )}
            {showLarkSearchFilterOwner && (
              <Dropdown
                trigger={['click']}
                dropdownRender={() => (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      width: 280,
                    }}
                  >
                    <div style={{ padding: 12 }}>
                      <Input
                        placeholder={t('lark.searchDocsByOwner')}
                        size="small"
                        style={{ borderRadius: 8 }}
                        value={ownerSearchQuery}
                        variant="filled"
                        onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      />
                    </div>
                    <Spin spinning={isEmployeesLoading}>
                      <div style={{ maxHeight: 300, overflowY: 'auto', paddingBottom: 8 }}>
                        {(employeesData || []).map((emp: any) => (
                          <div
                            className="owner-item"
                            key={emp.employee_id || emp.id}
                            style={{
                              alignItems: 'center',
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              gap: 12,
                              padding: '8px 16px',
                              transition: 'background 0.2s',
                            }}
                            onClick={() => handleOwnerSelect(emp)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Avatar size={32} src={emp.avatar} />
                            <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>
                              {getLarkName(emp.name)}
                            </Typography.Text>
                          </div>
                        ))}
                      </div>
                    </Spin>
                  </div>
                )}
              >
                <Tag
                  color={ownerIds.length > 0 ? '#dbeafe' : undefined}
                  style={{
                    alignItems: 'center',
                    borderRadius: 8,
                    color: ownerIds.length > 0 ? '#171717' : undefined,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 12,
                    gap: 4,
                    padding: '4px 12px',
                  }}
                >
                  {activeOwnerLabel}
                  {ownerIds.length > 0 ? (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14 }}
                      onClick={handleClearOwner}
                    >
                      close
                    </span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      expand_more
                    </span>
                  )}
                </Tag>
              </Dropdown>
            )}
            {showLarkSearchFilterChat && (
              <Dropdown
                trigger={['click']}
                dropdownRender={() => (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      width: 280,
                    }}
                  >
                    <div style={{ padding: 12 }}>
                      <Input
                        placeholder={t('lark.searchGroups')}
                        size="small"
                        style={{ borderRadius: 8 }}
                        value={chatSearchQuery}
                        variant="filled"
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                      />
                    </div>
                    <Spin spinning={isGroupsLoading}>
                      <div style={{ maxHeight: 300, overflowY: 'auto', paddingBottom: 8 }}>
                        {(groupsData || []).map((group: any) => (
                          <div
                            className="owner-item"
                            key={group.chat_id}
                            style={{
                              alignItems: 'center',
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              gap: 12,
                              padding: '8px 16px',
                              transition: 'background 0.2s',
                            }}
                            onClick={() => handleChatSelect(group)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Avatar size={32} src={group.avatar}>
                              {!group.avatar && (
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 18 }}
                                >
                                  groups
                                </span>
                              )}
                            </Avatar>
                            <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>
                              {group.name}
                            </Typography.Text>
                          </div>
                        ))}
                      </div>
                    </Spin>
                  </div>
                )}
              >
                <Tag
                  color={chatIds.length > 0 ? '#dbeafe' : undefined}
                  style={{
                    alignItems: 'center',
                    borderRadius: 8,
                    color: chatIds.length > 0 ? '#171717' : undefined,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 12,
                    gap: 4,
                    padding: '4px 12px',
                  }}
                >
                  {activeChatLabel}
                  {chatIds.length > 0 ? (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14 }}
                      onClick={handleClearChat}
                    >
                      close
                    </span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      expand_more
                    </span>
                  )}
                </Tag>
              </Dropdown>
            )}
            {showLarkSearchFilterWiki && (
              <Tag
                style={{
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '4px 12px',
                }}
              >
                {t('lark.filter.inWiki')}
              </Tag>
            )}
            {showLarkSearchFilterFormat && (
              <Tag
                style={{
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '4px 12px',
                }}
              >
                {t('lark.filter.format')}
              </Tag>
            )}
          </Space>
        </Flex>
      </div>
      <div
        style={{
          background: 'rgba(248,250,252,0.8)',
          flex: 1,
          overflowY: 'auto',
          padding: '8px 24px 16px',
        }}
      >
        <Spin spinning={isLoading}>
          <Flex vertical gap={4} style={{ marginBottom: 16 }}>
            {formattedData.length > 0 ? (
              formattedData.map((item) => (
                <div
                  key={item.key}
                  style={{
                    borderRadius: 12,
                    cursor: 'pointer',
                    padding: 12,
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Flex align="center" gap={16} style={{ width: '100%' }}>
                    <div
                      style={{
                        alignItems: 'center',
                        background: item.iconBg,
                        borderRadius: 10,
                        display: 'flex',
                        height: 40,
                        justifyContent: 'center',
                        width: 40,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: item.iconColor, fontSize: 20 }}
                      >
                        {item.icon}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text
                        ellipsis={{ tooltip: item.title }}
                        style={{ fontSize: 14, fontWeight: 600 }}
                      >
                        {item.title}
                      </Typography.Text>
                      <Typography.Paragraph
                        ellipsis={{ tooltip: item.description }}
                        style={{ fontSize: 11, marginBottom: 0, marginTop: 4, color: '#6b7280' }}
                      >
                        {item.description}
                      </Typography.Paragraph>
                    </div>
                  </Flex>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  padding: '40px 0',
                  textAlign: 'center',
                }}
              >
                {query ? t('lark.noDocsFound') : t('lark.typeToSearch')}
              </div>
            )}
          </Flex>
          {formattedData.length > 0 && (
            <Flex justify="flex-end" style={{ padding: '8px 0' }}>
              <Pagination
                simple
                current={page}
                pageSize={15}
                showSizeChanger={false}
                total={dataObj?.total || (dataObj?.has_more ? (page + 1) * 15 : page * 15)}
                onChange={(p) => setPage(p)}
              />
            </Flex>
          )}
        </Spin>
      </div>
    </Modal>
  );
});

export default SearchDocsModal;
