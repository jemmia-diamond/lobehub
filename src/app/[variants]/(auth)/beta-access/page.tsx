'use client';

import { Icon } from '@lobehub/ui';
import { Button, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { signOut, useSession } from '@/libs/better-auth/auth-client';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 40px;

    text-align: center;
  `,
  description: css`
    max-width: 400px;
    margin-block-end: 32px;
    color: ${token.colorTextSecondary};
  `,
  icon: css`
    margin-block-end: 24px;
    padding: 20px;
    border-radius: 50%;

    color: ${token.colorPrimary};

    background: ${token.colorFillSecondary};
  `,
  title: css`
    margin-block-end: 16px !important;
  `,
}));

const BetaAccessPage = () => {
  const { styles } = useStyles();
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/signin');
        },
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <Icon icon={Lock} size={48} />
      </div>
      <Typography.Title className={styles.title} level={2}>
        {t('betaAccess.title')}
      </Typography.Title>
      <Typography.Paragraph className={styles.description}>
        {t('betaAccess.description')}
      </Typography.Paragraph>
      {session?.user?.email && (
        <Typography.Text
          code
          style={{ display: 'block', marginBlockEnd: 32, opacity: 0.66 }}
          type="secondary"
        >
          {session.user.email}
        </Typography.Text>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={handleLogout}>{t('betaAccess.action.logout')}</Button>
        <Button type="primary">
          {t('betaAccess.action.contact')}
        </Button>
      </div>
    </div>
  );
};

export default BetaAccessPage;
