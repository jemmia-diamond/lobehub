'use client';

import { ActionIcon, Flexbox, Text } from '@lobehub/ui';
import { ArrowLeft } from 'lucide-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { oneLineEllipsis } from '@/styles';

const Title = memo(() => {
  const [goBack, title] = useChatStore((s) => [s.goBack, chatPortalSelectors.larkPreviewTitle(s)]);

  return (
    <Flexbox horizontal align={'center'} gap={4}>
      <ActionIcon icon={ArrowLeft} size={'small'} onClick={() => goBack()} />
      <Text className={oneLineEllipsis} style={{ fontSize: 16 }} type={'secondary'}>
        {title}
      </Text>
    </Flexbox>
  );
});

export default Title;
