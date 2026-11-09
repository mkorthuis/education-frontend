import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { readAnswer } from '@/services/api/endpoints/ask';

const answer = { status: 'answered', answer: ['Concord spent $24,351 per student.', 'More than the state.'], charts: [] };

/** A response body that arrives in these pieces, then fails if `error` is given */
const body = (pieces: string[], error?: unknown) => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      pieces.forEach(piece => controller.enqueue(encoder.encode(piece)));
      if (error) controller.error(error);
      else controller.close();
    },
  });
};

describe('readAnswer', () => {
  it('shows the paragraphs as they are written, then returns the answer', async () => {
    const onPartial = vi.fn();
    const lines = `  {"partial": ["Concord spent"]}\n {"partial": ["Concord spent $24,351 per student.", "More"]}\n${JSON.stringify(answer)}`;
    // Pieces that cut lines, and a two-byte character, partway
    const bytes = new TextEncoder().encode(lines.replace('$24,351', '$24,351 — é'));
    const pieces = [bytes.slice(0, 20), bytes.slice(20, 61), bytes.slice(61, 62), bytes.slice(62)];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { pieces.forEach(piece => controller.enqueue(piece)); controller.close(); },
    });
    expect(await readAnswer(stream, onPartial)).toEqual(answer);
    expect(onPartial.mock.calls.map(call => call[0])).toEqual([
      ['Concord spent'],
      ['Concord spent $24,351 — é per student.', 'More'],
    ]);
  });

  it('reads a saved answer, or a failure, which come whole', async () => {
    const onPartial = vi.fn();
    expect(await readAnswer(JSON.stringify(answer), onPartial)).toEqual(answer);
    expect(await readAnswer(body(['   ', '{"detail": "Please try again."}']), onPartial)).toEqual({ detail: 'Please try again.' });
    expect(onPartial).not.toHaveBeenCalled();
  });

  it('says the connection was lost when it drops partway', async () => {
    const error = await readAnswer(body(['{"partial": ["Concord"]}\n'], new TypeError('network error')), vi.fn()).catch(caught => caught);
    expect(error).toBeInstanceOf(AxiosError);
    expect(error.code).toBe(AxiosError.ERR_NETWORK);
    expect(error.response).toBeUndefined();
  });

  it('tells a time-out from a cancel when the browser only says it was aborted', async () => {
    const aborted = new DOMException('The operation was aborted.', 'AbortError');
    const timedOut = await readAnswer(body([], aborted), vi.fn(), new AbortController().signal).catch(caught => caught);
    expect(timedOut.code).toBe(AxiosError.ETIMEDOUT);
    const controller = new AbortController();
    controller.abort();
    expect(await readAnswer(body([], aborted), vi.fn(), controller.signal).catch(caught => caught)).toBe(aborted);
  });
});
