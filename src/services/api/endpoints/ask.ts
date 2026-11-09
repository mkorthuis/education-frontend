import axios, { AxiosError } from 'axios';
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
  /** What in the answer this source supports, one line per fact, written by AI with the answer */
  reasons?: string[];
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
/** Deep Think thinks longer: the server allows it 90 seconds */
export const ASK_DEEP_TIMEOUT_MS = 100000;

/** An earlier question on the Ask page and its answer, which a follow-up may refer to */
export interface AskEarlierTurn {
  question: string;
  answer: string[];
}

/**
 * Reads the answer as it arrives: lines of JSON, {"partial": [paragraphs so far]} while it's being
 * written, then the answer, or {"detail"} if it failed. Spaces between lines keep the connection open.
 * A saved answer, or one from a server that doesn't stream, is just the answer, which reads the same.
 */
export const readAnswer = async (
  body: ReadableStream<Uint8Array> | string,
  onPartial: (paragraphs: string[]) => void,
  signal?: AbortSignal,
): Promise<AskAnswer> => {
  let answer: AskAnswer | null = null;
  // Shows the newest paragraphs among the lines; returns whatever's after the last whole line
  const readLines = (text: string): string => {
    const lines = text.split('\n');
    const rest = lines.pop() ?? '';
    let partial: string[] | null = null;
    for (const line of lines) {
      if (!line.trim()) continue;
      const value = JSON.parse(line);
      if (Array.isArray(value?.partial)) partial = value.partial;
      else answer = value;
    }
    if (partial) onPartial(partial);
    return rest;
  };

  if (typeof body === 'string') {
    readLines(`${body}\n`);
    return answer as unknown as AskAnswer;
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let rest = '';
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (error) {
      // Canceled or timed out (axios's own errors, or the browser's abort when it doesn't pass them on),
      // or the connection dropped
      if (axios.isAxiosError(error) || axios.isCancel(error)) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw signal?.aborted ? error : new AxiosError('The answer took too long', AxiosError.ETIMEDOUT);
      }
      throw new AxiosError('The connection was lost', AxiosError.ERR_NETWORK);
    }
    if (chunk.done) break;
    rest = readLines(rest + decoder.decode(chunk.value, { stream: true }));
  }
  readLines(`${rest}${decoder.decode()}\n`);
  return answer as unknown as AskAnswer;
};

export const askApi = {
  /**
   * `history` is the page's earlier questions, oldest first, so "What about science?" knows what came
   * before. `deep` is Deep Think: Claude thinks longer, for complex questions. `onPartial` is given the
   * answer's paragraphs as they're written.
   */
  ask: async (
    question: string,
    history: AskEarlierTurn[],
    signal?: AbortSignal,
    deep = false,
    onPartial: (paragraphs: string[]) => void = () => {},
  ): Promise<AskAnswer> => {
    // Fetch, which can hand over the answer as it arrives; the timeout runs until the last of it
    const response = await axiosInstance.post(
      `${BASE_API_URL}ask`,
      { question, history, stream: true, ...(deep && { deep: true }) },
      { timeout: deep ? ASK_DEEP_TIMEOUT_MS : ASK_TIMEOUT_MS, skipCache: true, signal, adapter: 'fetch', responseType: 'stream' },
    );
    return readAnswer(response.data, onPartial, signal);
  },
};
