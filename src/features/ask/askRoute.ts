import { AskEarlierTurn, AskPlace } from '@/services/api/endpoints/ask';

// How a question reaches the Ask page

export const ASK_PATH = '/ask';

/**
 * How a question opens the Ask page: in the history entry's state, not the address, so questions
 * stay out of the browser's history list, address-bar suggestions and analytics on shared devices,
 * while Back, Forward and a reload still find them. `context` is the earlier questions it follows,
 * and `place` the district or school page the discussion started from, kept with it so a reload asks
 * it the same way.
 */
export const askState = (question: string, context: AskEarlierTurn[] = [], deep = false, place: AskPlace | null = null) =>
  ({ state: { question, context, deep, place } });

/** The district or school page a history entry's question is about, if any */
export const placeIn = (state: unknown): AskPlace | null => {
  const place = (state as { place?: Partial<AskPlace> | null } | null)?.place;
  return place && (place.kind === 'district' || place.kind === 'school') && typeof place.id === 'number'
    ? { kind: place.kind, id: place.id }
    : null;
};

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
