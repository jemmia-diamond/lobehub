import { createRemarkCustomTagPlugin } from '../remarkPlugins/createRemarkCustomTagPlugin';
import { type MarkdownElement } from '../type';
import Component from './Render';

const JemRecommendation: MarkdownElement = {
  Component,
  remarkPlugin: createRemarkCustomTagPlugin('jem-recommendation'),
  scope: 'assistant',
  tag: 'jem-recommendation',
};

export default JemRecommendation;
