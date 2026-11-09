import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';

// Ask NH Education Facts: a visitor's question, answered by the backend from the site's data

export interface AskChart {
  title: string;
  kind: 'line' | 'bar';
  /** percent, dollars, count or number */
  unit: string;
  /** What the points are, e.g. "School year", "Class" or "Student group" */
  x_label: string;
  series: string[];
  /** One point per year or group, with a value per series (null where there's none) */
  points: { label: string; values: (number | null)[] }[];
  note?: string | null;
}

export interface AskTable {
  title: string;
  unit: string;
  columns: string[];
  /** Each column's unit (percent, dollars, count or number); the first, the label column, is null */
  units: (string | null)[];
  rows: (number | string | null)[][];
  note?: string | null;
}

/** A page outside this site an answer relies on (a law, a study, an organization). The server only
 * returns links stored with its reference facts and national data, never one the AI wrote. */
export interface AskSource {
  label: string;
  url: string;
  /** The website, e.g. gc.nh.gov */
  site: string;
  /** When the fact was checked against this page (YYYY-MM-DD) */
  as_of?: string | null;
}

export interface AskAnswer {
  /** answered, partial (part of the question), no_data (the site doesn't have it), general (an explanation
   * from general knowledge, not the site's data) or declined (off-topic or private) */
  status: 'answered' | 'partial' | 'no_data' | 'general' | 'declined';
  /** Plain-text paragraphs */
  answer: string[];
  charts: AskChart[];
  tables: AskTable[];
  /** Pages on this site, checked by the server */
  references: { label: string; path: string }[];
  follow_ups: string[];
  /** Missing from answers saved before outside sources existed */
  sources?: AskSource[];
  cached: boolean;
}

export const ASK_MAX_LENGTH = 500;
/** Answers usually take 5 to 15 seconds; the visitor gets an error after this long */
export const ASK_TIMEOUT_MS = 45000;

/** An earlier question on the Ask page and its answer, which a follow-up may refer to */
export interface AskEarlierTurn {
  question: string;
  answer: string[];
}

export const askApi = {
  /** `history` is the page's earlier questions, oldest first, so "What about science?" knows what came before */
  ask: async (question: string, history: AskEarlierTurn[], signal?: AbortSignal): Promise<AskAnswer> => {
    const response = await axiosInstance.post(`${BASE_API_URL}ask`, { question, history }, { timeout: ASK_TIMEOUT_MS, skipCache: true, signal });
    return response.data;
  },
};
