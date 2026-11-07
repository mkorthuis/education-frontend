import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '@/store/store';
import { AskAnswer, askApi } from '@/services/api/endpoints/ask';

// The home page's question and its answer. Kept in memory only (never in browser storage, since
// family devices are shared), so Back from a linked page brings the answer back without asking
// again, and a reload clears it.

/** What went wrong, which picks the message the page shows */
export type AskErrorKind = 'limit' | 'unavailable' | 'tooLong' | 'network' | 'timeout' | 'server';

export interface AskState {
  /** The question as last sent */
  question: string;
  /** What's in the field, sent or not */
  draft: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  response: AskAnswer | null;
  error: AskErrorKind | null;
}

const initialState: AskState = { question: '', draft: '', status: 'idle', response: null, error: null };

const errorKind = (error: unknown): AskErrorKind => {
  if (!axios.isAxiosError(error)) return 'server';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'timeout';
  if (!error.response) return 'network';
  if (error.response.status === 429) return 'limit';
  if (error.response.status === 503) return 'unavailable';
  if (error.response.status === 400) return 'tooLong';
  return 'server';
};

export const askQuestion = createAsyncThunk<AskAnswer, string, { rejectValue: AskErrorKind }>(
  'ask/askQuestion',
  async (question, { signal, rejectWithValue }) => {
    try {
      const answer = await askApi.ask(question, signal);
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
    /** Cancel: back to no answer, keeping the question in the field */
    clearAnswer: (state) => {
      state.status = 'idle';
      state.response = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askQuestion.pending, (state, action) => {
        state.question = action.meta.arg;
        state.draft = action.meta.arg;
        state.status = 'loading';
        state.response = null;
        state.error = null;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        // Only the latest question's answer counts
        if (action.meta.arg !== state.question) return;
        state.status = 'succeeded';
        state.response = action.payload;
      })
      .addCase(askQuestion.rejected, (state, action) => {
        // A canceled request leaves the state to clearAnswer
        if (action.meta.aborted || action.meta.arg !== state.question) return;
        state.status = 'failed';
        state.error = action.payload ?? 'server';
      });
  },
});

export const { setDraft, clearAnswer } = askSlice.actions;
export const selectAsk = (state: RootState) => state.ask;
export default askSlice.reducer;
