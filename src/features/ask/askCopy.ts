import { ASK_MAX_LENGTH, AskAnswer } from '@/services/api/endpoints/ask';
import { AskErrorKind } from '@/store/slices/askSlice';

// What the home page's question box and the Ask page say

export const EXAMPLE_QUESTIONS = [
  'How much does Concord spend per student?',
  'How are Nashua students doing in reading?',
  "What is Manchester's graduation rate?",
  'How has the number of students in NH changed?',
  'What is the average class size in Claremont?',
  'Which districts spend the most per student?',
];

export const AI_NOTE = "Answers written by AI from site's data. Validate with linked pages.";
export const LOADING_TEXT = "Looking up the answer in this site's data. This usually takes 5 to 15 seconds.";

export const ERRORS: Record<AskErrorKind, { message: string; severity: 'info' | 'error'; action: 'retry' | 'edit' | 'browse' }> = {
  limit: { message: "We've reached today's limit on questions. Please try again tomorrow. You can still look up any district or school, or see statewide data.", severity: 'info', action: 'browse' },
  unavailable: { message: "Asking questions isn't available right now. You can still look up any district or school, or see statewide data.", severity: 'info', action: 'browse' },
  tooLong: { message: `Questions can be up to ${ASK_MAX_LENGTH} characters. Please shorten your question.`, severity: 'info', action: 'edit' },
  network: { message: "We couldn't connect. Check your internet connection, then try again.", severity: 'error', action: 'retry' },
  timeout: { message: 'This is taking too long. Please try again in a minute.', severity: 'error', action: 'retry' },
  server: { message: 'Something went wrong on our end. Please try again.', severity: 'error', action: 'retry' },
};

// A question this box can't take, whether off-topic or about a person
export const DECLINED_MESSAGE = "We can only answer questions about New Hampshire public schools using this site's data, and we can't answer questions about a particular student, teacher or family.";

export const readyMessage = (answer: AskAnswer) => {
  const parts = [
    answer.charts.length ? `${answer.charts.length} chart${answer.charts.length > 1 ? 's' : ''}` : '',
    answer.tables.length ? `${answer.tables.length} table${answer.tables.length > 1 ? 's' : ''}` : '',
  ].filter(Boolean);
  return parts.length ? `Answer ready, with ${parts.join(' and ')}.` : 'Answer ready.';
};
