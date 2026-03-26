'use client';

import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Check, Loader2 } from 'lucide-react';
import { memo } from 'react';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-block: 8px;
  `,
  iconDone: css`
    color: ${token.colorSuccess};
  `,
  iconPending: css`
    color: ${token.colorTextQuaternary};
  `,
  iconProcessing: css`
    color: ${token.colorPrimary};
  `,
  step: css`
    display: flex;
    gap: 12px;
    align-items: center;

    padding-block: 12px;
    padding-inline: 16px;
    border: 1px solid rgb(169 180 185 / 10%);
    border-radius: 12px;

    font-size: 13px;
    color: ${token.colorTextSecondary};

    background: #fff;
    box-shadow: 0 4px 12px rgb(42 52 57 / 4%);
  `,
  stepText: css`
    flex: 1;
    font-weight: 500;
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 20px;
    height: 20px;
    border-radius: 50%;
  `,
}));

export interface ThinkingStep {
  id: string;
  status: 'pending' | 'processing' | 'done';
  text: string;
}

interface ThinkingStepsProps {
  steps: ThinkingStep[];
}

const ThinkingSteps = memo<ThinkingStepsProps>(({ steps }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      {steps.map((step) => (
        <div className={styles.step} key={step.id}>
          {step.status === 'done' ? (
            <div className={styles.iconWrapper} style={{ background: '#dcfce7', color: '#22c55e' }}>
              <Icon icon={Check} size={12} />
            </div>
          ) : step.status === 'processing' ? (
            <div className={styles.iconWrapper} style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <Icon spin icon={Loader2} size={12} />
            </div>
          ) : (
            <div className={styles.iconWrapper} style={{ background: '#f1f5f9', color: '#94a3b8' }}>
              <div
                style={{
                  background: 'currentColor',
                  borderRadius: '50%',
                  height: 4,
                  width: 4,
                }}
              />
            </div>
          )}
          <span className={styles.stepText}>{step.text}</span>
        </div>
      ))}
    </div>
  );
});

export default ThinkingSteps;
