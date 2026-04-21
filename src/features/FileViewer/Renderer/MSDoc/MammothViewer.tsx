'use client';

import { Flexbox } from '@lobehub/ui';
import { css, cx } from 'antd-style';
import { memo, useEffect, useState } from 'react';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';

const container = css`
  position: relative;
  overflow: auto;
  padding: 24px;
`;

const content = css`
  max-width: 800px;
  margin-block: 0;
  margin-inline: auto;
  padding: 40px;
  border-radius: 4px;

  line-height: 1.6;
  color: #333;

  background: white;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);

  h1, h2, h3, h4 {
    margin-block: 1.5em 0.5em;
  }

  p {
    margin-block-end: 1em;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin-block-end: 1em;
  }

  table, th, td {
    padding: 8px;
    border: 1px solid #ddd;
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

interface MammothViewerProps {
  url: string;
}

const MammothViewer = memo<MammothViewerProps>(({ url }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDocx = async () => {
      setLoading(true);
      setError(null);
      try {
        const mammoth = await import('mammoth');
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch (e) {
        console.error('Mammoth conversion error:', e);
        setError('Failed to render document locally.');
      } finally {
        setLoading(false);
      }
    };

    renderDocx();
  }, [url]);

  if (loading) {
    return (
      <Flexbox align={'center'} height={'100%'} justify={'center'} width={'100%'}>
        <NeuralNetworkLoading size={36} />
      </Flexbox>
    );
  }

  if (error) {
    return (
      <Flexbox align={'center'} height={'100%'} justify={'center'} width={'100%'}>
        <div style={{ color: '#ff4d4f' }}>{error}</div>
      </Flexbox>
    );
  }

  return (
    <Flexbox className={cx(container)} height={'100%'} width={'100%'}>
      <div className={cx(content)} dangerouslySetInnerHTML={{ __html: html }} />
    </Flexbox>
  );
});

export default MammothViewer;
