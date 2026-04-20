import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import JemLogo from '@/components/Branding/JemLogo';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

const HomeHeader = memo(() => {
  const { t } = useTranslation('welcome');
  const userName = useUserStore(userProfileSelectors.nickName) || '';

  return (
    <Flexbox align="center" gap={8} style={{ width: '100%' }}>
      <Flexbox horizontal align="center" gap={8}>
        <JemLogo size={24} />
        <h2
          style={{
            color: 'inherit',
            fontSize: 18,
            fontWeight: 200,
                        margin: 0,
            textAlign: 'center',
          }}
        >
          {(t as any)('guide.welcome', { name: userName })}
        </h2>
      </Flexbox>
      <h1
        style={{
          color: 'inherit',
          fontSize: 24,
          fontWeight: 200,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {(t as any)('guide.intro')}
      </h1>
    </Flexbox>
  );
});

export default HomeHeader;
