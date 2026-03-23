import { useDebounce } from 'ahooks';
import { Flex, Input, List, Modal, Space, Spin, Tag, Typography } from 'antd';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { larkDocService } from '@/services/larkDoc';

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
  trailingIcon?: string;
}

const SearchDocsModal = memo<SearchDocsModalProps>(({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, { wait: 350 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const { data, isLoading } = useSWR(
    open ? ['lark-search', debouncedQuery, page] : null,
    async ([, q, p]) => {
      return larkDocService.searchDocs({ query: q as string, page: p as number });
    },
  );

  const formattedData: FormattedDoc[] = useMemo(() => {
    const items = (data as any)?.items || [];
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

      return {
        description: t('lark.docDetail', {
          owner: doc.owner_id || doc.owner || t('lark.docType.unknown'),
          type,
        }),
        icon,
        iconBg,
        iconColor,
        key: doc.token || doc.docs_token || doc.file_token || Math.random().toString(),
        title: (doc.title || doc.name)?.replaceAll(/<[^>]*>?/g, '') || t('lark.untitledDoc'), // Remove any tags like <em> inside title
        trailingIcon: 'link',
      };
    });
  }, [data, t]);

  const handleClose = () => {
    onClose?.();
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
              style={{ paddingLeft: 112, paddingRight: 40 }}
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
                  color: '#1D4ED8',
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
            {[
              t('lark.filter.sort'),
              t('lark.filter.from'),
              t('lark.filter.sharedIn'),
              t('lark.filter.inFolder'),
              t('lark.filter.inWiki'),
              t('lark.filter.source'),
              t('lark.filter.format'),
              t('lark.filter.dateViewed'),
            ].map((label) => (
              <Tag
                key={label}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '4px 12px',
                }}
              >
                {label}
              </Tag>
            ))}
            <Tag
              color="#dbeafe"
              style={{
                alignItems: 'center',
                borderRadius: 8,
                color: '#1D4ED8',
                display: 'inline-flex',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>
                tune
              </span>
              {t('lark.filter.title')}
            </Tag>
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
          <List
            dataSource={formattedData}
            locale={{ emptyText: query ? t('lark.noDocsFound') : t('lark.typeToSearch') }}
            rowKey="key"
            pagination={{
              current: page,
              onChange: (p) => setPage(p),
              pageSize: 15,
              showSizeChanger: false,
              total: (data as any)?.total || ((data as any)?.has_more ? page * 15 + 1 : page * 15),
            }}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderRadius: 12,
                  cursor: 'pointer',
                  padding: 12,
                }}
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
                  {item.trailingIcon && (
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#9ca3af', fontSize: 18 }}
                    >
                      {item.trailingIcon}
                    </span>
                  )}
                </Flex>
              </List.Item>
            )}
          />
        </Spin>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(148,163,184,0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 24px',
        }}
      >
        <Flex align="center" gap={4}>
          <Typography.Text
            style={{ cursor: 'pointer', fontSize: 11, color: '#6b7280' }}
            onClick={handleClose}
          >
            {t('lark.helpAndFeedback')}
          </Typography.Text>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9ca3af' }}>
            expand_more
          </span>
        </Flex>
        <Flex align="center" gap={24}>
          <Flex align="center" gap={8}>
            <span
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                fontSize: 10,
                padding: '2px 6px',
              }}
            >
              ↑↓
            </span>
            <Typography.Text style={{ fontSize: 11, color: '#6b7280' }}>
              {t('lark.toNavigate')}
            </Typography.Text>
          </Flex>
          <Flex align="center" gap={8}>
            <span
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                fontSize: 10,
                padding: '2px 6px',
              }}
            >
              ↵
            </span>
            <Typography.Text style={{ fontSize: 11, color: '#6b7280' }}>
              {t('lark.toSelect')}
            </Typography.Text>
          </Flex>
          <Flex align="center" gap={8}>
            <span
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                fontSize: 10,
                padding: '2px 6px',
              }}
            >
              esc
            </span>
            <Typography.Text style={{ fontSize: 11, color: '#6b7280' }}>
              {t('lark.toQuit')}
            </Typography.Text>
          </Flex>
        </Flex>
      </div>
    </Modal>
  );
});

export default SearchDocsModal;
