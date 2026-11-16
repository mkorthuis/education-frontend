import { createAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/store/store';
import { AskAnswer, askApi, AskEarlierTurn, AskPlace } from '@/services/api/endpoints/ask';
import { trackEvent } from '@/utils/analytics';

// The Ask page's questions and answers, oldest first. Kept in memory only (never in browser storage,
// since family devices are shared), so Back from a linked page brings the answers back without asking
// again. A reload clears them, and the page asks the latest question again.

/** What went wrong, which picks the message the page shows */
export type AskErrorKind = 'limit' | 'unavailable' | 'tooLong' | 'network' | 'timeout' | 'server';

export interface AskTurn {
  /** The request's id */
  id: string;
  question: string;
  /** The earlier questions it was asked after, sent again if it's retried */
  context: AskEarlierTurn[];
  /** Asked taking more time, which a retry keeps */
  deep: boolean;
  /** The district or school page it was about, which a retry keeps */
  place: AskPlace | null;
  status: 'loading' | 'succeeded' | 'failed';
  /** The answer's paragraphs written so far, while it's loading */
  partial: string[];
  response: AskAnswer | null;
  error: AskErrorKind | null;
}

export interface AskState {
  /** What's in the question field, sent or not; the home page and the Ask page share it */
  draft: string;
  turns: AskTurn[];
  /** Whether the next question is asked taking more time */
  moreTime: boolean;
  /** The district or school page the discussion started from: a question that names no place is about it */
  place: AskPlace | null;
}

// The page keeps the latest questions; older ones drop off the top
export const MAX_TURNS = 10;
// How many earlier questions a new one brings, for follow-ups like "What about science?": every one
// still on the page
export const MAX_CONTEXT = MAX_TURNS;

/** The answered questions on the page, oldest first, as a follow-up's context. Declined and failed ones don't count. */
export const contextFrom = (turns: AskTurn[]): AskEarlierTurn[] =>
  turns
    .filter(turn => turn.status === 'succeeded' && turn.response && turn.response.status !== 'declined')
    .slice(-MAX_CONTEXT)
    .map(turn => ({ question: turn.question, answer: turn.response!.answer }));

/** A question, the earlier ones it follows, whether it's asked taking more time, and the page it's about */
export interface AskRequest {
  question: string;
  context: AskEarlierTurn[];
  deep?: boolean;
  place?: AskPlace | null;
}

const initialState: AskState = { draft: '', turns: [], moreTime: false, place: null };

const errorKind = (error: unknown): AskErrorKind => {
  if (!axios.isAxiosError(error)) return 'server';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'timeout';
  if (!error.response) return 'network';
  if (error.response.status === 429) return 'limit';
  if (error.response.status === 503) return 'unavailable';
  if (error.response.status === 400) return 'tooLong';
  return 'server';
};

/** More of a question's answer, written so far */
export const showPartial = createAction<{ id: string; paragraphs: string[] }>('ask/showPartial');

export const askQuestion = createAsyncThunk<AskAnswer, AskRequest, { rejectValue: AskErrorKind }>(
  'ask/askQuestion',
  async ({ question, context, deep = false, place = null }, { signal, rejectWithValue, dispatch, requestId }) => {
    // How Ask is used and how it does, never what was asked
    const asked = { follow_up: context.length > 0, more_time: deep };
    trackEvent('ask_question', asked);
    const failed = (kind: AskErrorKind) => {
      trackEvent('ask_failed', { ...asked, reason: signal.aborted ? 'canceled' : kind });
      return rejectWithValue(kind);
    };
    try {
      const answer = await askApi.ask(question, context, signal, deep, paragraphs => dispatch(showPartial({ id: requestId, paragraphs })), place);
      // An answer with no text is no answer
      if (!answer || !Array.isArray(answer.answer) || answer.answer.length === 0) return failed('server');
      trackEvent('ask_answer', { ...asked, status: answer.status, cached: answer.cached });
      return answer;
    } catch (error) {
      return failed(errorKind(error));
    }
  }
);

const askSlice = createSlice({
  name: 'ask',
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<string>) => {
      state.draft = action.payload;
    },
    /** Drops one question, such as a failed one about to be asked again */
    removeTurn: (state, action: PayloadAction<string>) => {
      state.turns = state.turns.filter(turn => turn.id !== action.payload);
    },
    setMoreTime: (state, action: PayloadAction<boolean>) => {
      state.moreTime = action.payload;
    },
    /** The district or school page questions that name no place are about, or none */
    setPlace: (state, action: PayloadAction<AskPlace | null>) => {
      state.place = action.payload;
    },
    /** A new discussion, from the home page or starting over (no place) or from a district's or school's page: no questions, an empty field */
    startDiscussion: (state, action: PayloadAction<AskPlace | null>) => {
      state.turns = [];
      state.draft = '';
      state.place = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askQuestion.pending, (state, action) => {
        const { question, context, deep = false, place = null } = action.meta.arg;
        state.turns.push({ id: action.meta.requestId, question, context, deep, place, status: 'loading', partial: [], response: null, error: null });
        state.turns = state.turns.slice(-MAX_TURNS);
        // The question moves into the thread; the field is ready for the next one
        state.draft = '';
      })
      .addCase(showPartial, (state, action) => {
        const turn = state.turns.find(item => item.id === action.payload.id);
        if (turn?.status === 'loading') turn.partial = action.payload.paragraphs;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        const turn = state.turns.find(item => item.id === action.meta.requestId);
        if (!turn) return;
        turn.status = 'succeeded';
        turn.partial = [];
        turn.response = action.payload;
      })
      .addCase(askQuestion.rejected, (state, action) => {
        const turn = state.turns.find(item => item.id === action.meta.requestId);
        if (!turn) return;
        if (action.meta.aborted) {
          // Canceled: the question goes back in the field to edit
          state.turns = state.turns.filter(item => item.id !== turn.id);
          if (!state.draft) state.draft = turn.question;
          return;
        }
        turn.status = 'failed';
        turn.partial = [];
        turn.error = action.payload ?? 'server';
      });
  },
});

export const { setDraft, setMoreTime, removeTurn, setPlace, startDiscussion } = askSlice.actions;
export const selectAsk = (state: RootState) => state.ask;
export default askSlice.reducer;
