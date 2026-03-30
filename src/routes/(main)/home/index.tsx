import { Flexbox } from '@lobehub/ui';
import { type FC, memo } from 'react';

import PageTitle from '@/components/PageTitle';

import Conversation from '../agent/features/Conversation';

const Home: FC = memo(() => {
  return (
    <Flexbox height={'100%'} style={{ display: 'flex', flexDirection: 'column' }}>
      <PageTitle title="" />

      <Flexbox flex={1} style={{ overflowY: 'hidden' }} width={'100%'}>
        <Conversation />
      </Flexbox>
    </Flexbox>
  );
});

export default Home;
