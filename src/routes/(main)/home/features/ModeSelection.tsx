import { Flexbox } from '@lobehub/ui';
import { Card, Typography } from 'antd';
import { createStaticStyles, cx } from 'antd-style';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type ModeKey = 'fast' | 'deep' | 'expert';

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
    border-color: #1d4ed8 !important;
    background: #fff !important;
    box-shadow: 0 4px 16px rgb(29 78 216 / 8%) !important;
  `,
  exampleCard: css`
    cursor: pointer;
    border: none;
    background: #f1f5f9;

    .ant-card-body {
      padding-block: 8px;
      padding-inline: 12px;
    }
  `,
}));

const { Text, Paragraph } = Typography;

const MODES: {
  descKey: string;
  examples: string[];
  examplesTitleKey: string;
  icon: string;
  key: ModeKey;
  subtitleKey: string;
  titleKey: string;
}[] = [
  {
    key: 'fast',
    icon: '⚡',
    titleKey: 'modeSelection.fast.title',
    subtitleKey: 'modeSelection.fast.subtitle',
    descKey: 'modeSelection.fast.desc',
    examplesTitleKey: 'modeSelection.fast.examples.title',
    examples: [
      'modeSelection.fast.examples.1',
      'modeSelection.fast.examples.2',
      'modeSelection.fast.examples.3',
    ],
  },
  {
    key: 'deep',
    icon: '🤔',
    titleKey: 'modeSelection.deep.title',
    subtitleKey: 'modeSelection.deep.subtitle',
    descKey: 'modeSelection.deep.desc',
    examplesTitleKey: 'modeSelection.deep.examples.title',
    examples: [
      'modeSelection.deep.examples.1',
      'modeSelection.deep.examples.2',
      'modeSelection.deep.examples.3',
    ],
  },
  {
    key: 'expert',
    icon: '🎓',
    titleKey: 'modeSelection.expert.title',
    subtitleKey: 'modeSelection.expert.subtitle',
    descKey: 'modeSelection.expert.desc',
    examplesTitleKey: 'modeSelection.expert.examples.title',
    examples: [
      'modeSelection.expert.examples.1',
      'modeSelection.expert.examples.2',
      'modeSelection.expert.examples.3',
    ],
  },
];

const ModeSelection = memo<ModeSelectionProps>(({ activeMode = 'deep', onChangeMode }) => {
  const { t } = useTranslation('home');

  const handleSelect = useCallback(
    (mode: ModeKey) => {
      onChangeMode?.(mode);
    },
    [onChangeMode],
  );

  return (
    <div className={styles.grid}>
      {MODES.map((mode) => (
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
                fontSize: 22,
              }}
            >
              {mode.icon}
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

          <Paragraph style={{ fontSize: 13, lineHeight: 1.6, marginBlockEnd: 20 }} type="secondary">
            {t(mode.descKey as any)}
          </Paragraph>

          <Flexbox gap={12} style={{ marginBlockStart: 'auto' }}>
            <Text strong style={{ fontSize: 13, color: '#374151' }}>
              {t(mode.examplesTitleKey as any)}
            </Text>
            <Flexbox gap={8}>
              {mode.examples.map((exKey) => (
                <Card
                  className={styles.exampleCard}
                  key={exKey}
                  size="small"
                  style={{ borderRadius: 8, border: 'none', boxShadow: 'none' }}
                >
                  <Text style={{ fontSize: 13 }} type="secondary">
                    {t(exKey as any)}
                  </Text>
                </Card>
              ))}
            </Flexbox>
          </Flexbox>
        </Card>
      ))}
    </div>
  );
});

export default ModeSelection;
