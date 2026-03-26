import { Accordion, AccordionItem, ScrollShadow } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

import MarkdownMessage from '@/features/Conversation/Markdown';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { type ChatCitationItem } from '@/types/index';

import ThinkingSteps, { type ThinkingStep } from './ThinkingSteps';
import Title from './Title';

const styles = createStaticStyles(({ css, cssVar }) => ({
  contentScroll: css`
    max-height: min(40vh, 320px);
    padding-block-end: 8px;
    padding-inline: 8px;
    color: ${cssVar.colorTextDescription};

    article * {
      color: ${cssVar.colorTextDescription};
    }
  `,
}));

interface ThinkingProps {
  citations?: ChatCitationItem[];
  content?: string | ReactNode;
  duration?: number;
  style?: CSSProperties;
  thinking?: boolean;
  thinkingAnimated?: boolean;
}

const Thinking = memo<ThinkingProps>((props) => {
  const { content, duration, thinking, citations, thinkingAnimated } = props;
  const [showDetail, setShowDetail] = useState(false);

  const { ref, handleScroll } = useAutoScroll<HTMLDivElement>({
    deps: [content, showDetail],
    enabled: thinking && showDetail,
    threshold: 120,
  });

  useEffect(() => {
    setShowDetail(!!thinking);
  }, [thinking]);

  const steps: ThinkingStep[] = useMemo(() => {
    if (!thinking) {
      return [
        { id: '1', status: 'done', text: 'Phân tích yêu cầu và xác định bối cảnh' },
        { id: '2', status: 'done', text: 'Truy xuất dữ liệu và nghiên cứu thông tin' },
        { id: '3', status: 'done', text: 'Tổng hợp và đưa ra phản hồi' },
      ];
    }
    return [
      { id: '1', status: 'done', text: 'Phân tích yêu cầu và xác định bối cảnh' },
      { id: '2', status: 'processing', text: 'Truy xuất dữ liệu và nghiên cứu thông tin' },
      { id: '3', status: 'pending', text: 'Tổng hợp và đưa ra phản hồi' },
    ];
  }, [thinking]);

  return (
    <Accordion
      expandedKeys={showDetail ? ['thinking'] : []}
      gap={8}
      onExpandedChange={(keys) => setShowDetail(keys.length > 0)}
    >
      <AccordionItem
        itemKey={'thinking'}
        paddingBlock={4}
        paddingInline={4}
        title={<Title duration={duration} showDetail={showDetail} thinking={thinking} />}
      >
        <ScrollShadow
          className={styles.contentScroll}
          offset={12}
          ref={ref as RefObject<HTMLDivElement>}
          size={12}
          onScroll={handleScroll}
        >
          <ThinkingSteps steps={steps} />
          {typeof content === 'string' ? (
            <MarkdownMessage
              animated={thinkingAnimated}
              citations={citations}
              variant={'chat'}
              style={{
                marginTop: 12,
                overflow: 'unset',
              }}
            >
              {content}
            </MarkdownMessage>
          ) : (
            <div style={{ marginTop: 12 }}>{content}</div>
          )}
        </ScrollShadow>
      </AccordionItem>
    </Accordion>
  );
});

export default Thinking;
