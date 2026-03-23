import { useCallback, useState } from 'react';

import { type StarterMode } from '@/store/home';

const QUESTION_COUNT = 40;
const DISPLAY_COUNT = 6;

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateQuestions = (mode: StarterMode, department?: string | null) => {
  const modeKey = mode ?? 'chat';

  if (!['agent', 'group', 'write', 'chat'].includes(modeKey)) {
    return [];
  }

  const ids = Array.from({ length: QUESTION_COUNT }, (_, i) => i + 1);
  const shuffled = shuffleArray(ids);

  const getDepartmentPrefix = (dept?: string | null) => {
    if (!dept) return '';

    const deptMap: Record<string, string> = {
      // Map by name
      'marketing': 'marketing',
      'phòng công nghệ': 'tech',
      'công nghệ': 'tech',
      'tech': 'tech',
      'phòng cung ứng': 'supply_chain',
      'cung ứng': 'supply_chain',
      'supply_chain': 'supply_chain',
      'hành chính nhân sự': 'hr',
      'phòng hành chính nhân sự': 'hr',
      'hr': 'hr',
      'tài chính - kế toán': 'finance',
      'phòng tài chính - kế toán': 'finance',
      'finance': 'finance',
      'r&d': 'rnd',
      'phòng r&d': 'rnd',
      'kinh doanh': 'sales',
      'phòng kinh doanh': 'sales',
      'sales': 'sales',
    };

    const normalizedDept = dept.toLowerCase().trim();
    return deptMap[normalizedDept] || '';
  };

  const deptPrefix = getDepartmentPrefix(department);
  const prefix = deptPrefix ? `${deptPrefix}.${modeKey}` : modeKey;

  return shuffled.slice(0, DISPLAY_COUNT).map((id) => ({
    id,
    promptKey: `${prefix}.${String(id).padStart(2, '0')}.prompt`,
    titleKey: `${prefix}.${String(id).padStart(2, '0')}.title`,
  }));
};

export interface QuestionItem {
  id: number;
  promptKey: string;
  titleKey: string;
}

interface UseRandomQuestionsResult {
  questions: QuestionItem[];
  refresh: () => void;
}

export const useRandomQuestions = (
  mode: StarterMode,
  department?: string | null,
): UseRandomQuestionsResult => {
  const [questions, setQuestions] = useState<QuestionItem[]>(() =>
    generateQuestions(mode, department),
  );

  const refresh = useCallback(() => {
    setQuestions(generateQuestions(mode, department));
  }, [mode, department]);

  return { questions, refresh };
};
