import { LarkDocIdentifier } from '@lobechat/builtin-tool-lark-doc';
import { useDebounce } from 'ahooks';
import type { MenuProps } from 'antd';
import {
  Dropdown,
  Flex,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LARK_BASE_URL } from '@/const/url';
import { larkDocService } from '@/services/larkDoc';
import { agentSelectors } from '@/store/agent/selectors';
import { useAgentStore } from '@/store/agent/store';
import { useFileStore } from '@/store/file';
import { useServerConfigStore } from '@/store/serverConfig';
import { featureFlagsSelectors } from '@/store/serverConfig/selectors';

interface SearchDocsModalProps {
  onClose?: () => void;
  open?: boolean;
}

interface FormattedDoc {
  description: string;
  extra?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  key: string;
  title: string;
  url: string;
}

const PAGE_SIZE = 15;

const SearchDocsModal = memo<SearchDocsModalProps>(({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const { showLarkSearchFilterWiki } = useServerConfigStore(featureFlagsSelectors);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, { wait: 500 });

  const [spaceId, setSpaceId] = useState<string>('all');
  const [activeSpaceLabel, setActiveSpaceLabel] = useState<string>(() => t('lark.filter.allSpaces'));

  const [isAttaching, setIsAttaching] = useState(false);


  const [allItems, setAllItems] = useState<any[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const addChatContextSelection = useFileStore((s) => s.addChatContextSelection);
  const toggleAgentPlugin = useAgentStore((s) => s.toggleAgentPlugin);

  const [spacesRes, setSpacesRes] = useState<any[]>([]);
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = (await larkDocService.listWikiSpaces()) as any;
        if (!res?.success) return;
        setSpacesRes(JSON.parse(res.content));
      } catch (e) {
        console.error('Failed to list Wiki Spaces:', e);
      }
    })();
  }, [open]);

  const spaceItems: MenuProps['items'] = useMemo(() => {
    const spaces = spacesRes || [];
    const items = spaces.map((s: any) => ({
      key: s.space_id,
      label: s.name,
    }));
    return [{ key: 'all', label: t('lark.filter.allSpaces') }, ...items];
  }, [spacesRes, t]);

  const fetchItems = useCallback(
    async (token?: string) => {
      const queryStr = String(debouncedQuery || '').trim();

      if (!queryStr) {
        const spaceKey = spaceId;
        if (spaceKey && spaceKey !== 'all') {
          const res = (await larkDocService.listWikiNodes({ spaceId: spaceKey })) as any;
          if (!res?.success) return { items: [], has_more: false };
          try {
            return JSON.parse(res.content);
          } catch {
            return { items: [], has_more: false };
          }
        }
        const res = (await larkDocService.listDocs({})) as any;
        if (!res?.success) return { items: [], has_more: false };
        try {
          const items = JSON.parse(res.content);
          return { items, has_more: false };
        } catch {
          return { items: [], has_more: false };
        }
      }

      const res = (await larkDocService.searchWiki({
        pageSize: PAGE_SIZE,
        pageToken: token,
        query: queryStr,
        spaceId: spaceId === 'all' ? undefined : spaceId,
      })) as any;
      if (!res?.success) return { items: [], has_more: false };
      try {
        return JSON.parse(res.content);
      } catch {
        return { items: [], has_more: false };
      }
    },
    [debouncedQuery, spaceId],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoadingInitial(true);
    setAllItems([]);
    setPageToken(undefined);
    setHasMore(false);

    (async () => {
      const result = await fetchItems();
      if (cancelled) return;
      setAllItems(result.items || []);
      setPageToken(result.page_token);
      setHasMore(result.has_more || false);
      setIsLoadingInitial(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fetchItems]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !pageToken) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchItems(pageToken);
      setAllItems((prev) => [...prev, ...(result.items || [])]);
      setPageToken(result.page_token);
      setHasMore(result.has_more || false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, pageToken, fetchItems]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const formattedData: FormattedDoc[] = useMemo(() => {
    if (!Array.isArray(allItems)) return [];

    return allItems.map((doc: any) => {
      const rawType = doc.obj_type || doc.type || 'doc';
      const token = doc.obj_token || doc.docs_token || doc.node_token || doc.token || '';
      const url = doc.url || doc.link || `${LARK_BASE_URL}/${rawType}/${token}`;

      let icon = 'description';
      let iconColor = '#1e293b';
      let iconBg = '#f1f5f9';

      switch (rawType) {
        case 'sheet': {
          icon = 'grid_on';
          iconColor = '#16a34a';
          iconBg = '#f0fdf4';
          break;
        }
        case 'bitable': {
          icon = 'view_list';
          iconColor = '#a855f7';
          iconBg = '#f3e8ff';
          break;
        }
        case 'slide': {
          icon = 'present_to_all';
          iconColor = '#ea580c';
          iconBg = '#fff7ed';
          break;
        }
        case 'mindnote': {
          icon = 'schema';
          iconColor = '#2563eb';
          iconBg = '#eff6ff';
          break;
        }
        case 'folder': {
          icon = 'folder';
          iconColor = '#ca8a04';
          iconBg = '#fefce8';
          break;
        }
      }

      return {
        description: doc.description || '',
        extra: JSON.stringify({
          obj_token: token,
          obj_type: rawType,
        }),
        icon,
        iconBg,
        iconColor,
        key: token || Math.random().toString(),
        title: (doc.title || doc.name || '').replaceAll(/<[^>]*>?/g, '') || t('lark.untitledDoc'),
        url,
      };
    });
  }, [allItems, t]);

  const handleSelect = async (item: FormattedDoc) => {
    setIsAttaching(true);
    try {
      const res = (await larkDocService.getDocContent({ documentId: item.key })) as any;

      if (res?.success) {
        const { obj_type } = JSON.parse(item.extra || '{}');
        addChatContextSelection({
          content: res.content || '',
          fileType: obj_type || 'doc',
          format: 'text',
          id: `lark-${item.key}`,
          preview: item.title,
          title: item.title,
          type: 'text',
          url: item.url,
        });
      }

      const agentStore = useAgentStore.getState();
      const currentPlugins = agentSelectors.currentAgentPlugins(agentStore);
      if (!currentPlugins.includes(LarkDocIdentifier)) {
        await toggleAgentPlugin(LarkDocIdentifier, true);
      }

      onClose?.();
    } catch (error) {
      console.error('Failed to attach Lark document content:', error);
      onClose?.();
    } finally {
      setIsAttaching(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleSpaceChange: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    setSpaceId(key);
    const item = spaceItems.find((i) => i?.key === key) as any;
    if (item) setActiveSpaceLabel(item.label);
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
              style={{ paddingLeft: 12, paddingRight: 40 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
          {showLarkSearchFilterWiki && (
            <Space
              size={8}
              style={{
                overflowX: 'auto',
                paddingBottom: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <Dropdown
                menu={{ items: spaceItems, onClick: handleSpaceChange }}
                trigger={['click']}
              >
                <Tag
                  color={spaceId !== 'all' ? '#dbeafe' : undefined}
                  style={{
                    alignItems: 'center',
                    borderRadius: 8,
                    color: spaceId !== 'all' ? '#171717' : undefined,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontSize: 12,
                    gap: 4,
                    padding: '4px 12px',
                  }}
                >
                  {activeSpaceLabel}
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    expand_more
                  </span>
                </Tag>
              </Dropdown>
            </Space>
          )}
        </Flex>
      </div>
      <div
        ref={scrollRef}
        style={{
          background: 'rgba(248,250,252,0.8)',
          flex: 1,
          overflowY: 'auto',
          padding: '8px 24px 16px',
        }}
      >
        <Spin spinning={isLoadingInitial || isAttaching} tip={isAttaching ? t('lark.attaching', { ns: 'chat' }) : undefined}>
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

          <div ref={sentinelRef} style={{ height: 1 }} />

          {isLoadingMore && (
            <Flex justify="center" style={{ padding: '12px 0' }}>
              <Spin size="small" />
            </Flex>
          )}
        </Spin>
      </div>
    </Modal>
  );
});

export default SearchDocsModal;
