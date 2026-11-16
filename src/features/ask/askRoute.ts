import { AskEarlierTurn, AskPlace } from '@/services/api/endpoints/ask';

// How a question reaches the Ask page

export const ASK_PATH = '/ask';

/** The Ask page for a district's or school's questions (/district/111/ask), or for any place's (/ask) */
export const askPathFor = (place: AskPlace | null) => (place ? `/${place.kind}/${place.id}/ask` : ASK_PATH);

/** The district or school an Ask page is for, from its address; none for /ask */
export const placeAt = (pathname: string): AskPlace | null => {
  const match = pathname.match(/^\/(district|school)\/(\d+)\/ask\/?$/);
  return match ? { kind: match[1] as AskPlace['kind'], id: Number(match[2]) } : null;
};

/**
 * How a question opens the Ask page: in the history entry's state, not the address, so questions
 * stay out of the browser's history list, address-bar suggestions and analytics on shared devices,
 * while Back, Forward and a reload still find them. `context` is the earlier questions it follows,
 * kept with it so a reload asks it the same way.
 */
export const askState = (question: string, context: AskEarlierTurn[] = [], deep = false) => ({ state: { question, context, deep } });

/** Whether two places are the same, or both none */
export const samePlace = (a: AskPlace | null, b: AskPlace | null) => a?.kind === b?.kind && a?.id === b?.id;

/** Whether a history entry's question is asked taking more time */
export const deepIn = (state: unknown): boolean => (state as { deep?: unknown } | null)?.deep === true;

/** The earlier questions a history entry's question follows */
export const contextIn = (state: unknown): AskEarlierTurn[] => {
  const context = (state as { context?: unknown } | null)?.context;
  return Array.isArray(context) ? context.filter((turn): turn is AskEarlierTurn => typeof turn?.question === 'string' && Array.isArray(turn?.answer)) : [];
};

/** The question a history entry carries, if any */
export const questionIn = (state: unknown): string => {
  const question = (state as { question?: unknown } | null)?.question;
  return typeof question === 'string' ? question.trim() : '';
};
