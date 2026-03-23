import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import PageTitle from '@/components/PageTitle';
import NavHeader from '@/features/NavHeader';
import WideScreenContainer from '@/features/WideScreenContainer';

import { PinnedInputArea, ScrollableContent } from './features';

const Home: FC = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === '/';
  const { t } = useTranslation('home');

  return (
    <Flexbox height={'100%'} style={{ display: 'flex', flexDirection: 'column' }}>
      {isHomeRoute && <PageTitle title="" />}
      <NavHeader
        right={<Flexbox horizontal align="center" />}
        showTogglePanelButton={false}
        left={
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8', paddingLeft: 24 }}>
            Trợ lý JemX
          </span>
        }
      />

      <Flexbox flex={1} style={{ overflowY: 'auto' }} width={'100%'}>
        <Flexbox style={{ width: '100%', maxWidth: '100%', padding: '0 24px' }}>
          <Flexbox
            justify="center"
            style={{ marginBlock: 'auto', minHeight: '60vh', width: '100%' }}
          >
            <ScrollableContent />
          </Flexbox>
        </Flexbox>
      </Flexbox>

      <Flexbox flex={'none'} width={'100%'}>
        <WideScreenContainer>
          <PinnedInputArea />
        </WideScreenContainer>
      </Flexbox>

      <Flexbox
        align="center"
        flex={'none'}
        width={'100%'}
        style={{
          paddingBlock: 12,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: '#9ca3af',
          textTransform: 'uppercase',
        }}
      >
        {t('home.footer')}
      </Flexbox>
    </Flexbox>
  );
};

export default Home;
