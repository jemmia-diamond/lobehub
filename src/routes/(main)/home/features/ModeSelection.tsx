import { Flexbox } from '@lobehub/ui';
import { Card, Typography } from 'antd';
import { createStaticStyles, cx } from 'antd-style';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { userService } from '@/services/user';
import { useChatStore } from '@/store/chat';

type ModeKey = 'auto' | 'fast' | 'deep' | 'expert';

interface ModeSelectionProps {
  activeMode?: ModeKey | null;
  onChangeMode?: (mode: ModeKey) => void;
}

const styles = createStaticStyles(({ css, cssVar }) => ({
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;

    @media (width <= 768px) {
      grid-template-columns: 1fr;
    }
  `,
  card: css`
    cursor: pointer;
    transition:
      transform ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut},
      box-shadow ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut},
      border-color ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut};

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
    }

    &:active {
      transform: translateY(0);
    }
  `,
  cardActive: css`
    border-color: #171717 !important;
    background: #fff !important;
    box-shadow: 0 4px 16px rgb(29 78 216 / 8%) !important;
  `,
  exampleCard: css`
    cursor: pointer;
    border: none;
    background: #f1f5f9;
    transition: background 0.2s;

    .ant-card-body {
      padding-block: 8px;
      padding-inline: 12px;
    }

    &:hover {
      background: #e2e8f0;
    }
  `,
}));

const { Text, Paragraph } = Typography;

const MODES: {
  descKey: string;
  icon: string;
  key: ModeKey;
  subtitleKey: string;
  titleKey: string;
}[] = [
  {
    key: 'fast',
    icon: 'bolt',
    titleKey: 'modeSelection.fast.title',
    subtitleKey: 'modeSelection.fast.subtitle',
    descKey: 'modeSelection.fast.desc',
  },
  {
    key: 'deep',
    icon: 'psychology',
    titleKey: 'modeSelection.deep.title',
    subtitleKey: 'modeSelection.deep.subtitle',
    descKey: 'modeSelection.deep.desc',
  },
  {
    key: 'expert',
    icon: 'school',
    titleKey: 'modeSelection.expert.title',
    subtitleKey: 'modeSelection.expert.subtitle',
    descKey: 'modeSelection.expert.desc',
  },
];

const getDepartmentPrefix = (dept?: string | null) => {
  if (!dept) return '';

  const deptMap: Record<string, string> = {
    'marketing': 'marketing',
    'phòng công nghệ': 'tech',
    'công nghệ': 'tech',
    'tech': 'tech',
    'phòng cung ứng': 'supply_chain',
    'cung ứng': 'supply_chain',
    'supply_chain': 'supply_chain',
    'hành chính nhân sự': 'hr',
    'phòng hành chính nhân sự': 'hr',
    'hr': 'hr',
    'tài chính - kế toán': 'finance',
    'phòng tài chính - kế toán': 'finance',
    'finance': 'finance',
    'r&d': 'rnd',
    'phòng r&d': 'rnd',
    'kinh doanh': 'sales',
    'phòng kinh doanh': 'sales',
    'sales': 'sales',
  };

  const normalizedDept = dept.toLowerCase().trim();
  return deptMap[normalizedDept] || '';
};

const ModeSelection = memo<ModeSelectionProps>(({ activeMode = 'deep', onChangeMode }) => {
  const { t } = useTranslation('home');
  const { t: ts } = useTranslation('suggestQuestions');
  const mainInputEditor = useChatStore((s) => s.mainInputEditor);
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getUserDepartment()
      .then((dept) => {
        if (dept) setDepartment(dept);
      })
      .catch((err) => {
        console.error('Failed to fetch user department:', err);
      });
  }, []);

  const handleSelect = useCallback(
    (mode: ModeKey) => {
      onChangeMode?.(mode);
    },
    [onChangeMode],
  );

  const handleExampleClick = useCallback(
    (e: React.MouseEvent, prompt: string, mode: ModeKey) => {
      e.stopPropagation();
      handleSelect(mode);
      mainInputEditor?.instance?.setDocument('markdown', prompt);
      mainInputEditor?.focus();
    },
    [handleSelect, mainInputEditor],
  );

  const getExamples = (mode: ModeKey) => {
    const deptPrefix = getDepartmentPrefix(department);
    const prefix = deptPrefix ? `${deptPrefix}.chat` : 'chat';

    // Map mode to different ranges of questions
    // Since we have at least 6 questions per department and 40 general questions
    const rangeMap: Record<ModeKey, number[]> = {
      auto: [1, 2, 3],
      deep: [4, 5, 6],
      expert: [7, 8, 9],
      fast: [1, 2, 3],
    };

    const ids = rangeMap[mode];

    return ids.map((id) => {
      const idStr = String(id).padStart(2, '0');
      const promptKey = `${prefix}.${idStr}.prompt`;
      const titleKey = `${prefix}.${idStr}.title`;

      return {
        prompt: ts(promptKey as any),
        title: ts(titleKey as any),
      };
    });
  };

  return (
    <div className={styles.grid}>
      {MODES.map((mode) => {
        const examples = getExamples(mode.key);

        return (
          <Card
            className={cx(styles.card, activeMode === mode.key && styles.cardActive)}
            key={mode.key}
            variant="outlined"
            style={{
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
            onClick={() => handleSelect(mode.key)}
          >
            <Flexbox horizontal align="center" gap={12} style={{ marginBlockEnd: 12 }}>
              <Flexbox
                align="center"
                justify="center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f3f4f6',
                  color: '#171717',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {mode.icon}
                </span>
              </Flexbox>
              <Flexbox gap={2}>
                <Text strong style={{ fontSize: 16 }}>
                  {t(mode.titleKey as any)}
                </Text>
                <Text style={{ fontSize: 12 }} type="secondary">
                  {t(mode.subtitleKey as any)}
                </Text>
              </Flexbox>
            </Flexbox>

            <Paragraph
              style={{ fontSize: 13, lineHeight: 1.6, marginBlockEnd: 20 }}
              type="secondary"
            >
              {t(mode.descKey as any)}
            </Paragraph>

            <Flexbox gap={12} style={{ marginBlockStart: 'auto' }}>
              <Text strong style={{ fontSize: 13, color: '#374151' }}>
                {t('modeSelection.fast.examples.title' as any)}
              </Text>
              <Flexbox gap={8}>
                {examples.map((ex, index) => (
                  <Card
                    className={styles.exampleCard}
                    key={index}
                    size="small"
                    style={{ borderRadius: 8, border: 'none', boxShadow: 'none' }}
                    onClick={(e) => handleExampleClick(e, ex.prompt, mode.key)}
                  >
                    <Text style={{ fontSize: 13 }} type="secondary">
                      {ex.title}
                    </Text>
                  </Card>
                ))}
              </Flexbox>
            </Flexbox>
          </Card>
        );
      })}
    </div>
  );
});

export default ModeSelection;
