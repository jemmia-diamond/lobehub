import type { BuiltinSkill } from '@lobechat/types';

import { AgentBrowserSkill } from './agent-browser';
import { ArtifactsSkill } from './artifacts';
import { EmailWriterSkill } from './email-writer';
import { FindSkillsSkill } from './find-skills';
import { LobeHubSkill } from './lobehub';
import { TaskSkill } from './task';

export { AgentBrowserIdentifier } from './agent-browser';
export { ArtifactsIdentifier } from './artifacts';
export { EmailWriterIdentifier } from './email-writer';
export { FindSkillsIdentifier } from './find-skills';
export { LobeHubIdentifier } from './lobehub';
export { TaskIdentifier } from './task';

export const builtinSkills: BuiltinSkill[] = [
  AgentBrowserSkill,
  ArtifactsSkill,
  EmailWriterSkill,
  FindSkillsSkill,
  LobeHubSkill,
  TaskSkill,
];
