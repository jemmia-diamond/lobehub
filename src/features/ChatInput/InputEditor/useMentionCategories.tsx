import { Avatar, Icon } from '@lobehub/ui';
import { SkillsIcon } from '@lobehub/ui/icons';
import { Bot, FileText, MessageSquareText, User, Users, Wrench  } from 'lucide-react';
import { createElement,useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { larkDocService } from '@/services/larkDoc';
import { larkMessageService } from '@/services/larkMessage';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import { useAgentId } from '../hooks/useAgentId';
import { useChatInputStore } from '../store';
import { useInstalledSkillsAndTools } from './ActionTag/useInstalledSkillsAndTools';
import type { MentionCategory } from './MentionMenu/types';
import { mapLarkDocToMentionItem, mapLarkUserToMentionItem } from './MentionMenu/utils';

const MAX_AGENT_ITEMS = 20;
const MAX_TOPIC_LABEL = 50;
type MenuOptionWithMetadata = { key: string; metadata?: Record<string, unknown> };

/** Render a skill/tool avatar as a ReactNode icon. */
const shouldRenderIconAsImage = (str: string) =>
  str.startsWith('http://') ||
  str.startsWith('https://') ||
  str.startsWith('blob:') ||
  /^data:image\//i.test(str);

const renderAvatar = (avatar: string | undefined): React.ReactNode => {
  if (!avatar) return <Icon icon={SkillsIcon} size={16} />;
  if (shouldRenderIconAsImage(avatar)) {
    return createElement('img', {
      alt: '',
      height: 16,
      src: avatar,
      style: { flexShrink: 0, objectFit: 'contain' as const },
      width: 16,
    });
  }
  return createElement('span', { style: { fontSize: 16, lineHeight: 1 } }, avatar);
};

export const useMentionCategories = (): MentionCategory[] => {
  const { t } = useTranslation(['tool', 'common', 'chat']);

  const currentAgentId = useAgentId();
  const allAgents = useHomeStore(homeAgentListSelectors.allAgents);

  const topicPageSize = useGlobalStore(systemStatusSelectors.topicPageSize);
  const topicsSelector = useMemo(
    () => topicSelectors.displayTopicsForSidebar(topicPageSize),
    [topicPageSize],
  );
  const topics = useChatStore(topicsSelector);
  const activeTopicId = useChatStore((s) => s.activeTopicId);

  const externalMentionItems = useChatInputStore((s) => s.mentionItems);
  const isGroupChat = !!externalMentionItems;

  const enableMentionEmployee = useServerConfigStore(featureFlagsSelectors).enableMentionEmployee;
  const enableMentionDoc = useServerConfigStore(featureFlagsSelectors).enableMentionDoc;

  const { data: defaultLarkUsers } = useSWR(
    enableMentionEmployee ? 'default-lark-users' : null,
    async () => {
      const VIETNAMESE_INITIALS = [
        'a',
        'b',
        'c',
        'd',
        'đ',
        'e',
        'g',
        'h',
        'i',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'x',
        'y',
      ];
      const randomQuery =
        VIETNAMESE_INITIALS[Math.floor(Math.random() * VIETNAMESE_INITIALS.length)];

      console.info('[MentionCategories] Fetching default lark users...', {
        randomQuery,
      });
      try {
        const res = (await larkMessageService.searchEmployees({
          pageSize: 4,
          query: randomQuery,
        })) as any;
        console.info('[MentionCategories] Fetch result:', res.success, res.content);
        if (res.success) {
          const data = JSON.parse(res.content);
          return data.items || [];
        }
        return [];
      } catch (e) {
        console.error('Lark default user search error:', e);
        return [];
      }
    },
    { revalidateOnFocus: false },
  );

  const { data: defaultLarkDocs } = useSWR(
    enableMentionDoc ? 'default-lark-docs' : null,
    async () => {
      const VIETNAMESE_INITIALS = ['a', 'b', 'c', 'd', 'đ', 'h', 'l', 'm', 'n', 'p', 's', 't', 'v'];
      const randomQuery =
        VIETNAMESE_INITIALS[Math.floor(Math.random() * VIETNAMESE_INITIALS.length)];
      try {
        const res = (await larkDocService.searchDocs({
          pageSize: 4,
          query: randomQuery,
          sortBy: 1,
        })) as any;
        if (res.success) {
          const data = JSON.parse(res.content);
          return data.items || [];
        }
        return [];
      } catch (e) {
        console.error('Lark default doc search error:', e);
        return [];
      }
    },
    { revalidateOnFocus: false },
  );

  const enabledSkills = useInstalledSkillsAndTools();

  return useMemo(() => {
    const categories: MentionCategory[] = [];

    // --- Agents (non-group only) ---
    if (!isGroupChat) {
      const items = allAgents
        .filter((a) => a.type === 'agent' && a.id !== currentAgentId)
        .slice(0, MAX_AGENT_ITEMS)
        .map((agent) => ({
          icon: (
            <Avatar
              avatar={typeof agent.avatar === 'string' ? agent.avatar : undefined}
              background={agent.backgroundColor ?? undefined}
              size={24}
            />
          ),
          key: `agent-${agent.id}`,
          label: agent.title || t('chat:untitledAgent'),
          metadata: {
            id: agent.id,
            timestamp: new Date(agent.updatedAt).getTime(),
            type: 'agent' as const,
          },
        }));

      if (items.length > 0) {
        categories.push({
          id: 'agent',
          icon: <Icon icon={Bot} size={16} />,
          items,
          label: t('chat:agents'),
        });
      }
    }

    // --- Members (group chat only) ---
    if (isGroupChat && Array.isArray(externalMentionItems)) {
      const items = externalMentionItems
        .filter((item): item is MenuOptionWithMetadata => 'key' in item && !!item.key)
        .map((item) => ({
          ...item,
          metadata: Object.assign({ timestamp: 0, type: 'member' as const }, item.metadata),
        }));

      if (items.length > 0) {
        categories.push({
          id: 'member',
          icon: <Icon icon={Users} size={16} />,
          items,
          label: t('chat:members'),
        });
      }
    }

    // --- Lark Documents ---
    if (enableMentionDoc) {
      const docItems = (defaultLarkDocs || [])
        .slice(0, 4)
        .map((d: any) => mapLarkDocToMentionItem(d));

      if (docItems.length > 0) {
        categories.push({
          id: 'lark-doc',
          icon: <Icon icon={FileText} size={16} />,
          items: docItems,
          label: t('chat:mention.larkDocs', { defaultValue: 'TÀI LIỆU GẦN ĐÂY' }),
        });
      }
    }

    // --- Lark Users ---
    if (enableMentionEmployee) {
      const userItems = (defaultLarkUsers || [])
        .slice(0, 4)
        .map((u: any) => mapLarkUserToMentionItem(u, t));

      if (userItems.length > 0) {
        categories.push({
          id: 'lark-user',
          icon: <Icon icon={User} size={16} />,
          items: userItems,
          label: t('chat:mention.larkUsers', { defaultValue: 'NGƯỜI TƯƠNG TÁC GẦN ĐÂY' }),
        });
      }
    }

    // --- Topics ---
    if (topics && topics.length > 0) {
      const items = topics
        .filter((t) => t.id !== activeTopicId)
        .map((topic) => {
          const title = topic.title || t('chat:topic.untitled' as any);
          const label =
            title.length > MAX_TOPIC_LABEL ? `${title.slice(0, MAX_TOPIC_LABEL)}...` : title;
          return {
            icon: <Icon icon={MessageSquareText} size={16} />,
            key: `topic-${topic.id}`,
            label,
            metadata: {
              topicId: topic.id,
              topicTitle: topic.title,
              timestamp: topic.updatedAt || 0,
              type: 'topic' as const,
            },
          };
        });

      if (items.length > 0) {
        categories.push({
          id: 'topic',
          icon: <Icon icon={MessageSquareText} size={16} />,
          items,
          label: t('chat:topic.recent'),
        });
      }
    }

    // --- Skills ---
    const skillItems = enabledSkills.filter((s) => s.category === 'skill');
    if (skillItems.length > 0) {
      categories.push({
        id: 'skill',
        icon: <Icon icon={SkillsIcon} size={16} />,
        items: skillItems.map((item) => ({
          icon: renderAvatar(item.icon),
          key: `skill-${item.type}`,
          label: item.label,
          metadata: {
            actionCategory: item.category,
            actionType: item.type,
            timestamp: 0,
            type: 'skill' as const,
          },
        })),
        label: 'Skills',
      });
    }

    // --- Tools ---
    const toolItems = enabledSkills.filter((s) => s.category === 'tool');
    if (toolItems.length > 0) {
      categories.push({
        id: 'tool',
        icon: <Icon icon={Wrench} size={16} />,
        items: toolItems.map((item) => ({
          icon: renderAvatar(item.icon),
          key: `tool-${item.type}`,
          label: item.label,
          metadata: {
            actionCategory: item.category,
            actionType: item.type,
            timestamp: 0,
            type: 'tool' as const,
          },
        })),
        label: 'Tools',
      });
    }

    return categories;
  }, [isGroupChat, externalMentionItems, enableMentionDoc, enableMentionEmployee, topics, enabledSkills, allAgents, currentAgentId, t, defaultLarkDocs, defaultLarkUsers, activeTopicId]);
};
