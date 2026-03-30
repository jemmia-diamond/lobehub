import { LoadingOutlined } from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import { Center, Flexbox } from '@lobehub/ui';
import { Spin } from 'antd';
import { createStaticStyles, cx } from 'antd-style';
import { Settings2Icon } from 'lucide-react';
import { memo, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ModelSwitchPanel from '@/features/ModelSwitchPanel';
import ModelDetailPanel from '@/features/ModelSwitchPanel/components/ModelDetailPanel';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { aiModelSelectors, useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { useAgentId } from '../../hooks/useAgentId';
import Action from '../components/Action';
import { useActionBarContext } from '../context';
import { JEMMIA_MODEL_IDS, JEMMIA_MODEL_LABEL_KEYS } from './constants';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    border-radius: 24px;
    background: ${cssVar.colorFillTertiary};
  `,
  icon: cx(
    'model-switch',
    css`
      transition: scale 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
    `,
  ),
  model: css`
    cursor: pointer;
    border-radius: 24px;

    :hover {
      background: ${cssVar.colorFillSecondary};
    }

    :active {
      .model-switch {
        scale: 0.8;
      }
    }
  `,
  modelWithControl: css`
    border-radius: 24px;

    :hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  jemButton: css`
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;
    border: none;
    border-radius: 0.25rem;

    font-size: 12px;
    font-weight: 600;

    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);

    transition: opacity 200ms ease;

    && {
      color: white;
      background: #1d4ed8;
      outline: none;
    }

    &&:hover {
      opacity: 0.9;
    }
  `,
}));

const ModelSwitch = memo(() => {
  const { t } = useTranslation('chat');
  const { dropdownPlacement } = useActionBarContext();
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  const agentId = useAgentId();
  const [model, provider, updateAgentConfigById] = useAgentStore((s) => [
    agentByIdSelectors.getAgentModelById(agentId)(s),
    agentByIdSelectors.getAgentModelProviderById(agentId)(s),
    s.updateAgentConfigById,
  ]);

  const isModelHasExtendParams = useAiInfraStore(
    aiModelSelectors.isModelHasExtendParams(model, provider),
  );

  const showExtendParams = isDevMode && isModelHasExtendParams;

  const handleModelChange = useCallback(
    async (params: { model: string; provider: string }) => {
      await updateAgentConfigById(agentId, params);
    },
    [agentId, updateAgentConfigById],
  );

  return (
    <Flexbox horizontal align={'center'} className={showExtendParams ? styles.container : ''}>
      <ModelSwitchPanel
        model={model}
        placement={dropdownPlacement}
        provider={provider}
        variant={provider === 'jemmia' && JEMMIA_MODEL_IDS.includes(model) ? 'jemmia' : 'default'}
        onModelChange={handleModelChange}
      >
        {provider === 'jemmia' && JEMMIA_MODEL_IDS.includes(model) ? (
          <button className={styles.jemButton} type="button">
            <span className={`material-symbols-outlined`} style={{ fontSize: 18 }}>
              {model === 'gemini-2.5-flash'
                ? 'psychology'
                : model === 'gemini-2.5-flash-lite'
                  ? 'bolt'
                  : 'school'}
            </span>
            <span>{t(JEMMIA_MODEL_LABEL_KEYS[model] as any)}</span>
            <span className={`material-symbols-outlined`} style={{ fontSize: 18 }}>
              expand_more
            </span>
          </button>
        ) : (
          <Center
            className={cx(styles.model, showExtendParams && styles.modelWithControl)}
            height={36}
            width={36}
          >
            <div className={styles.icon}>
              <ModelIcon model={model} size={22} />
            </div>
          </Center>
        )}
      </ModelSwitchPanel>

      {showExtendParams && (
        <Action
          icon={Settings2Icon}
          showTooltip={false}
          style={{ borderRadius: 24, marginInlineStart: -4 }}
          title={t('extendParams.title')}
          popover={{
            content: (
              <Suspense
                fallback={
                  <Flexbox
                    align={'center'}
                    justify={'center'}
                    style={{ minHeight: 100, width: '100%' }}
                  >
                    <Spin indicator={<LoadingOutlined spin />} />
                  </Flexbox>
                }
              >
                <ModelDetailPanel model={model} provider={provider} />
              </Suspense>
            ),
            maxWidth: 400,
            minWidth: 400,
            placement: 'topLeft',
          }}
        />
      )}
    </Flexbox>
  );
});

ModelSwitch.displayName = 'ModelSwitch';

export default ModelSwitch;
