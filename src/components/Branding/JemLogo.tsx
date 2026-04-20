'use client';

import { memo } from 'react';

interface JemLogoProps {
  size?: number;
}

const JemLogo = memo<JemLogoProps>(({ size = 24 }) => (
  <img alt="Jemmia" height={size} src="/logo.svg" width={size} />
));

JemLogo.displayName = 'JemLogo';

export default JemLogo;
