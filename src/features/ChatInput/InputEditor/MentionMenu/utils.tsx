import { Avatar, Icon } from '@lobehub/ui';
import {
  FileSpreadsheet,
  FileText,
  Layout,
  MessageSquare,
  Presentation,
  Share2,
} from 'lucide-react';

const getLarkName = (name: any): string => {
  if (!name) return '';
  if (typeof name === 'string') return name;
  return name.default_value || name.i18n_value || '';
};

export const mapLarkUserToMentionItem = (u: any, t: any) => ({
  icon: (
    <Avatar
      avatar={u.avatar}
      background={'#eff6ff'}
      shape={'circle'}
      size={32}
      title={getLarkName(u.name)}
    />
  ),
  key: `lark-user-${u.chat_id || u.user_id}`,
  label: getLarkName(u.name),
  metadata: {
    description:
      getLarkName(u.description) === 'Bot contact'
        ? t('tool:tool.lark-entity.user.description')
        : getLarkName(u.description) || getLarkName(u.en_name) || getLarkName(u.email),
    id: u.chat_id || u.user_id,
    timestamp: 0,
    type: 'lark-user' as const,
  },
});

const getDocIcon = (type: string) => {
  switch (type) {
    case 'pdf': {
      return <Icon color={'#ef4444'} icon={FileText} size={18} />;
    }
    case 'docx':
    case 'doc': {
      return <Icon color={'#3b82f6'} icon={FileText} size={18} />;
    }
    case 'sheet': {
      return <Icon color={'#22c55e'} icon={FileSpreadsheet} size={18} />;
    }
    case 'bitable': {
      return <Icon color={'#eab308'} icon={Layout} size={18} />;
    }
    case 'mindnote': {
      return <Icon color={'#a855f7'} icon={Share2} size={18} />;
    }
    case 'slides': {
      return <Icon color={'#f97316'} icon={Presentation} size={18} />;
    }
    default: {
      return <Icon icon={MessageSquare} size={18} />;
    }
  }
};

export const mapLarkDocToMentionItem = (d: any) => {
  const rawType = (d.type || d.docs_type || 'doc').toLowerCase();
  const sizeStr = d.size
    ? `${(Number(d.size) / 1024 / 1024).toFixed(1)} MB`
    : rawType.toUpperCase();

  return {
    icon: (
      <div
        style={{
          alignItems: 'center',
          background: '#f1f5f9',
          borderRadius: 8,
          display: 'flex',
          height: 32,
          justifyContent: 'center',
          width: 32,
        }}
      >
        {getDocIcon(rawType)}
      </div>
    ),
    key: `lark-doc-${d.token || d.id || d.docs_token}`,
    label: getLarkName(d.title || d.name),
    metadata: {
      description: sizeStr,
      id: d.token || d.id || d.docs_token,
      timestamp: d.update_time ? Number(d.update_time) * 1000 : 0,
      type: 'lark-doc' as const,
    },
  };
};
