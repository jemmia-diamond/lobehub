import { Flexbox } from '@lobehub/ui';
import { Card, Typography } from 'antd';
import { createStaticStyles, cx, useTheme } from 'antd-style';
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
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
  `,
  card: css`
    cursor: pointer;
    transition:
      transform ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut},
      box-shadow ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut},
      border-color ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut},
      background-color ${cssVar.motionDurationMid} ${cssVar.motionEaseInOut};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${cssVar.boxShadowSecondary};
    }

    &:active {
      transform: translateY(0);
      box-shadow: ${cssVar.boxShadowTertiary};
    }
  `,
  cardActive: css`
    border-color: ${cssVar.colorInfoBorder} !important;
    background: ${cssVar.colorInfoBg};
    box-shadow:
      0 0 0 1px ${cssVar.colorInfoBorder},
      0 0 0 4px ${cssVar.colorInfoBg};
  `,
}));

const { Title, Text, Paragraph } = Typography;

const ModeSelection = memo<ModeSelectionProps>(({ activeMode = 'deep', onChangeMode }) => {
  const theme = useTheme();
  const { t } = useTranslation('home');

  const handleSelect = useCallback(
    (mode: ModeKey) => {
      onChangeMode?.(mode);
    },
    [onChangeMode],
  );

  return (
    <Flexbox gap={32} style={{ paddingBlock: 24 }}>
      <Flexbox gap={16}>
        <Title level={2} style={{ margin: 0 }}>
          {t('modeSelection.title')}
        </Title>
      </Flexbox>
      <div className={styles.grid}>
        <Card
          bordered
          className={cx(styles.card, activeMode === 'fast' && styles.cardActive)}
          style={{
            borderRadius: 16,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => handleSelect('fast')}
        >
          <Flexbox align="flex-start" gap={16} style={{ marginBottom: 16 }}>
            <Flexbox
              align="center"
              justify="center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: theme.colorFillTertiary,
                fontSize: 24,
              }}
            >
              ⚡
            </Flexbox>
            <Flexbox gap={4}>
              <Text strong style={{ fontSize: 18 }}>
                {t('modeSelection.fast.title')}
              </Text>
              <Text style={{ fontSize: 12 }} type="secondary">
                {t('modeSelection.fast.subtitle')}
              </Text>
            </Flexbox>
          </Flexbox>
          <Paragraph style={{ marginBottom: 24 }} type="secondary">
            {t('modeSelection.fast.desc')}
          </Paragraph>
          <Flexbox gap={8} style={{ marginTop: 'auto' }}>
            <Text strong style={{ fontSize: 12 }}>
              {t('modeSelection.fast.examples.title')}
            </Text>
            <Flexbox direction="vertical" gap={8}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.fast.examples.1')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.fast.examples.2')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.fast.examples.3')}</Text>
              </Card>
            </Flexbox>
          </Flexbox>
        </Card>
        <Card
          bordered
          className={cx(styles.card, activeMode === 'deep' && styles.cardActive)}
          style={{
            borderRadius: 16,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => handleSelect('deep')}
        >
          <Flexbox align="flex-start" gap={16} style={{ marginBottom: 16 }}>
            <Flexbox
              align="center"
              justify="center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: theme.colorFillTertiary,
                fontSize: 24,
              }}
            >
              🤔
            </Flexbox>
            <Flexbox gap={4}>
              <Text strong style={{ fontSize: 18 }}>
                {t('modeSelection.deep.title')}
              </Text>
              <Text style={{ fontSize: 12 }} type="secondary">
                {t('modeSelection.deep.subtitle')}
              </Text>
            </Flexbox>
          </Flexbox>
          <Paragraph style={{ marginBottom: 24 }} type="secondary">
            {t('modeSelection.deep.desc')}
          </Paragraph>
          <Flexbox gap={8} style={{ marginTop: 'auto' }}>
            <Text strong style={{ fontSize: 12 }}>
              {t('modeSelection.deep.examples.title')}
            </Text>
            <Flexbox direction="vertical" gap={8}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.deep.examples.1')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.deep.examples.2')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.deep.examples.3')}</Text>
              </Card>
            </Flexbox>
          </Flexbox>
        </Card>
        <Card
          bordered
          className={cx(styles.card, activeMode === 'expert' && styles.cardActive)}
          style={{
            borderRadius: 16,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => handleSelect('expert')}
        >
          <Flexbox align="flex-start" gap={16} style={{ marginBottom: 16 }}>
            <Flexbox
              align="center"
              justify="center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: theme.colorFillTertiary,
                fontSize: 24,
              }}
            >
              👑
            </Flexbox>
            <Flexbox gap={4}>
              <Text strong style={{ fontSize: 18 }}>
                {t('modeSelection.expert.title')}
              </Text>
              <Text style={{ fontSize: 12 }} type="secondary">
                {t('modeSelection.expert.subtitle')}
              </Text>
            </Flexbox>
          </Flexbox>
          <Paragraph style={{ marginBottom: 24 }} type="secondary">
            {t('modeSelection.expert.desc')}
          </Paragraph>
          <Flexbox gap={8} style={{ marginTop: 'auto' }}>
            <Text strong style={{ fontSize: 12 }}>
              {t('modeSelection.expert.examples.title')}
            </Text>
            <Flexbox direction="vertical" gap={8}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.expert.examples.1')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.expert.examples.2')}</Text>
              </Card>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: theme.colorFillSecondary,
                }}
              >
                <Text type="secondary">{t('modeSelection.expert.examples.3')}</Text>
              </Card>
            </Flexbox>
          </Flexbox>
        </Card>
      </div>
    </Flexbox>
  );
});

export default ModeSelection;
