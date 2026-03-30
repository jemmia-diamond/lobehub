'use client';

import { Center, Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

const Body = memo(() => {
  const url = useChatStore(chatPortalSelectors.larkPreviewUrl);

  if (!url) return <Center height={'100%'}>No Preview URL</Center>;

  return (
    <Flexbox height={'100%'} style={{ overflow: 'hidden' }} width={'100%'}>
      <iframe
        src={url}
        style={{ border: 'none', height: '100%', width: '100%' }}
        title="Lark Preview"
      />
    </Flexbox>
  );
});

export default Body;
