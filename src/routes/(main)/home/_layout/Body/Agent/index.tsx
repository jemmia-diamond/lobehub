'use client';

import { Flexbox } from '@lobehub/ui';
import React, { memo, Suspense } from 'react';

import SkeletonList from '@/features/NavPanel/components/SkeletonList';

import List from './List';

const Agent = memo(() => {
  return (
    <Suspense fallback={<SkeletonList rows={3} />}>
      <Flexbox gap={2} paddingBlock={1}>
        <List />
      </Flexbox>
    </Suspense>
  );
});

export default Agent;