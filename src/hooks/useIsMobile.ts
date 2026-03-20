import { useResponsive } from 'antd-style';
import { useMemo } from 'react';

export const useIsMobile = (): boolean => {
  const { mobile, tablet } = useResponsive();

  return useMemo(() => !!mobile || !!tablet, [mobile, tablet]);
};
