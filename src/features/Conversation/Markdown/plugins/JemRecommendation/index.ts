import { createRemarkCustomTagPlugin } from '../remarkPlugins/createRemarkCustomTagPlugin';
import { type MarkdownElement } from '../type';
import Component from './Render';

const JemRecommendation: MarkdownElement = {
  Component,
  remarkPlugin: createRemarkCustomTagPlugin('jemos-recommendation'),
  scope: 'assistant',
  tag: 'jemos-recommendation',
};

export default JemRecommendation;
