import { memo } from 'react';

import JemosChatInput from '@/features/JemosChatInput';

const InputArea = memo(() => {
  return <JemosChatInput showStarters />;
});

export default InputArea;
