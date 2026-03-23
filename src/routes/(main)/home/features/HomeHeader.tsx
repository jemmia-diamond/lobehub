'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const HomeHeader = memo(() => {
  const { t } = useTranslation('home');
  return (
    <h1
      style={{
        color: '#111827',
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
        margin: 0,
        maxWidth: '100%',
        textAlign: 'left',
      }}
    >
      {t('modeSelection.title')}
    </h1>
  );
});

export default HomeHeader;
