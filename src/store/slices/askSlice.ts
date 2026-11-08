import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/store/store';
import { AskAnswer, askApi, AskEarlierTurn } from '@/services/api/endpoints/ask';

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
  status: 'loading' | 'succeeded' | 'failed';
  response: AskAnswer | null;
  error: AskErrorKind | null;
}

export interface AskState {
  /** What's in the question field, sent or not; the home page and the Ask page share it */
  draft: string;
  turns: AskTurn[];
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

/** A question and the earlier ones it follows */
export interface AskRequest {
  question: string;
  context: AskEarlierTurn[];
}

const initialState: AskState = { draft: '', turns: [] };

const errorKind = (error: unknown): AskErrorKind => {
  if (!axios.isAxiosError(error)) return 'server';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'timeout';
  if (!error.response) return 'network';
  if (error.response.status === 429) return 'limit';
  if (error.response.status === 503) return 'unavailable';
  if (error.response.status === 400) return 'tooLong';
  return 'server';
};

export const askQuestion = createAsyncThunk<AskAnswer, AskRequest, { rejectValue: AskErrorKind }>(
  'ask/askQuestion',
  async ({ question, context }, { signal, rejectWithValue }) => {
    try {
      const answer = await askApi.ask(question, context, signal);
      // An answer with no text is no answer
      if (!answer || !Array.isArray(answer.answer) || answer.answer.length === 0) return rejectWithValue('server');
      return answer;
    } catch (error) {
      return rejectWithValue(errorKind(error));
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
    /** Start over: no questions, an empty field */
    clearTurns: (state) => {
      state.turns = [];
      state.draft = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askQuestion.pending, (state, action) => {
        const { question, context } = action.meta.arg;
        state.turns.push({ id: action.meta.requestId, question, context, status: 'loading', response: null, error: null });
        state.turns = state.turns.slice(-MAX_TURNS);
        // The question moves into the thread; the field is ready for the next one
        state.draft = '';
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        const turn = state.turns.find(item => item.id === action.meta.requestId);
        if (!turn) return;
        turn.status = 'succeeded';
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
        turn.error = action.payload ?? 'server';
      });
  },
});

export const { setDraft, removeTurn, clearTurns } = askSlice.actions;
export const selectAsk = (state: RootState) => state.ask;
export default askSlice.reducer;
