'use client';

import { Button, Flexbox, Text } from '@lobehub/ui';
import { createStyles, cssVar } from 'antd-style';
import { ChevronDown, Undo2Icon } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ModelSwitchPanel from '@/features/ModelSwitchPanel';
import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import LobeMessage from '@/routes/onboarding/components/LobeMessage';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

import KlavisServerList from '../components/KlavisServerList';

const useStyles = createStyles(({ css }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 10px;
    padding-inline: 16px;
    border: 1px solid rgb(0 0 0 / 8%);
    border-radius: 12px;

    color: #171717;

    background: #fff;
    box-shadow: 0 4px 12px 0 rgb(0 0 0 / 5%);

    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: rgb(0 0 0 / 12%);
      background: #f9f9f9;
    }
  `,
  text: css`
    font-size: 15px;
    font-weight: 600;
  `,
}));

interface ProSettingsStepProps {
  onBack: () => void;
}

const ProSettingsStep = memo<ProSettingsStepProps>(({ onBack }) => {
  const { styles } = useStyles();
  const { t } = useTranslation(['onboarding', 'home']);
  const navigate = useNavigate();

  const enableKlavis = useServerConfigStore(serverConfigSelectors.enableKlavis);
  const enabledModels = useEnabledChatModels();

  const [updateDefaultModel, finishOnboarding] = useUserStore((s) => [
    s.updateDefaultModel,
    s.finishOnboarding,
  ]);

  const defaultAgentConfig = useUserStore(
    (s) => settingsSelectors.currentSettings(s).defaultAgent?.config,
  );

  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  const jemmiaList = useMemo(() => {
    if (!enabledModels) return [];

    const visibleModelIds = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

    return enabledModels
      .filter((p) => p.id === 'jemmia')
      .map((p) => ({
        ...p,
        children: p.children.filter((m) => visibleModelIds.includes(m.id)),
      }))
      .filter((p) => p.children.length > 0);
  }, [enabledModels]);

  const currentMode = useMemo(() => {
    const model = defaultAgentConfig?.model;
    const provider = defaultAgentConfig?.provider;

    if (provider !== 'jemmia') return 'deep';
    if (model === 'gemini-2.5-flash-lite') return 'fast';
    if (model === 'gemini-2.5-flash') return 'deep';
    if (model === 'gemini-2.5-pro') return 'expert';
    return 'deep';
  }, [defaultAgentConfig]);

  const handleFinish = useCallback(async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    await finishOnboarding();
    navigate('/');
  }, [finishOnboarding, navigate]);

  const handleBack = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    onBack();
  }, [onBack]);

  return (
    <Flexbox gap={16}>
      <LobeMessage
        sentences={[t('proSettings.title'), t('proSettings.title2'), t('proSettings.title3')]}
      />
      <Flexbox gap={16}>
        <Text color={cssVar.colorTextSecondary}>{t('proSettings.model.title')}</Text>
        <ModelSwitchPanel
          enabledList={jemmiaList}
          model={defaultAgentConfig?.model}
          placement="bottomRight"
          provider={defaultAgentConfig?.provider}
          variant="jemmia"
          onModelChange={async ({ model: newModel, provider: newProvider }) => {
            updateDefaultModel(newModel, newProvider);
          }}
        >
          <div className={styles.button}>
            <span className={styles.text}>
              {t(`thinkingMode.${currentMode}.title`, { ns: 'home' })}
            </span>
            <ChevronDown size={14} />
          </div>
        </ModelSwitchPanel>
      </Flexbox>

      {enableKlavis && (
        <Flexbox gap={16}>
          <Text color={cssVar.colorTextSecondary}>{t('proSettings.connectors.title')}</Text>
          <KlavisServerList />
        </Flexbox>
      )}

      <Flexbox horizontal align={'center'} justify={'space-between'} style={{ marginTop: 16 }}>
        <Button
          disabled={isNavigating}
          icon={Undo2Icon}
          type={'text'}
          style={{
            color: cssVar.colorTextDescription,
          }}
          onClick={handleBack}
        >
          {t('back')}
        </Button>
        <Button
          disabled={isNavigating}
          style={{ minWidth: 120 }}
          type="primary"
          onClick={() => void handleFinish()}
        >
          {t('finish')}
        </Button>
      </Flexbox>
    </Flexbox>
  );
});

ProSettingsStep.displayName = 'ProSettingsStep';

export default ProSettingsStep;
