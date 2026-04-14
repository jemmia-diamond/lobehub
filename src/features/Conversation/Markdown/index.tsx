import { Image, Markdown, type MarkdownProps } from '@lobehub/ui';
import { type CSSProperties, memo, useMemo } from 'react';

import { getLarkUrlForR2 } from '@/config/r2ToLarkMapping';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

const MarkdownMessage = memo<MarkdownProps>(({ children, componentProps, components, ...rest }) => {
  const { highlighterTheme, mermaidTheme, fontSize } = useUserStore(
    userGeneralSettingsSelectors.config,
  );
  const markdownComponents = useMemo<MarkdownProps['components']>(
    () =>
      ({
        ...(components as MarkdownProps['components']),
        a: ({ node: _node, href, children: linkChildren, ...props }: any) => {
          const resolvedHref = href ? (getLarkUrlForR2(href) ?? href) : href;
          if (resolvedHref !== href) {
            console.info('[R2→Lark] Redirecting:', href, '→', resolvedHref);
          }
          return (
            <a href={resolvedHref} rel="noopener noreferrer" target="_blank" {...props}>
              {linkChildren}
            </a>
          );
        },
        img: ({ node: _node, alt = 'img', style, ...props }: any) => (
          <Image
            alt={alt}
            style={{
              borderRadius: 'calc(var(--lobe-markdown-border-radius) * 1px)',
              marginBlock: 'calc(var(--lobe-markdown-margin-multiple) * 1em)',
              ...(style as CSSProperties),
            }}
            {...props}
          />
        ),
      }) as MarkdownProps['components'],
    [components],
  );

  return (
    <Markdown
      components={markdownComponents}
      fontSize={fontSize}
      variant={'chat'}
      componentProps={{
        ...componentProps,
        highlight: {
          fullFeatured: true,
          theme: highlighterTheme,
          ...componentProps?.highlight,
        },
        mermaid: { fullFeatured: false, theme: mermaidTheme, ...componentProps?.mermaid },
      }}
      {...rest}
    >
      {children}
    </Markdown>
  );
});

export default MarkdownMessage;
