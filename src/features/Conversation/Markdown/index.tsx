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
          let resolvedHref = href;
          const dataLink = props['data-link'];
          if (dataLink && href?.startsWith('#')) {
            try {
              const parsed = typeof dataLink === 'string' ? JSON.parse(dataLink) : dataLink;
              if (parsed?.url) {
                resolvedHref = getLarkUrlForR2(parsed.url) ?? parsed.url;
              }
            } catch {}
          } else {
            resolvedHref = href ? (getLarkUrlForR2(href) ?? href) : href;
          }
          const isRedirected = resolvedHref !== href;
          return (
            <a
              {...props}
              href={isRedirected ? resolvedHref : href}
              rel="noopener noreferrer"
              target={isRedirected ? '_blank' : props.target}
              onClick={
                isRedirected
                  ? (e) => {
                      e.preventDefault();
                      window.open(resolvedHref, '_blank', 'noopener,noreferrer');
                    }
                  : props.onClick
              }
            >
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
