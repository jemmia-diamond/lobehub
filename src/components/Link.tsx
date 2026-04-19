import { type AnchorHTMLAttributes } from 'react';
import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { getLarkUrlForR2 } from '@/config/r2ToLarkMapping';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode | undefined;
  href?: string;
}

/**
 * Smart Link component for global use.
 * - External links (http://, https://) → native <a> tag (with R2→Lark redirect)
 * - Internal routes → React Router Link
 */
const Link = memo<LinkProps>(({ href, children, ...props }) => {
  // External links use native <a> tag
  if (href?.startsWith('http://') || href?.startsWith('https://')) {
    const resolvedHref = getLarkUrlForR2(href) ?? href;
    return (
      <a href={resolvedHref} rel="noreferrer" {...props}>
        {children}
      </a>
    );
  }

  // Internal routes use React Router Link
  return (
    <RouterLink to={href || '/'} {...props}>
      {children}
    </RouterLink>
  );
});

export default Link;
