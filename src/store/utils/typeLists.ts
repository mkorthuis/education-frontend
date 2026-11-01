import { createAsyncThunk, type ActionReducerMapBuilder, type AsyncThunk } from '@reduxjs/toolkit';
import { LoadingState } from '@/store/utils/loadingState';

// ------------------------------
// Type lists: zero-arg lookups stored in state[field], status in typeLoadingStatus[field]
// ------------------------------
// Payload is the thunk's payload type exactly as today: any (safety, assessment) or X[] (outcome, staff).
export const createTypeListThunk = <Payload>(typePrefix: string, request: () => Promise<any>): AsyncThunk<Payload, void, {}> =>
    createAsyncThunk<Payload, void>(typePrefix, async (_, { rejectWithValue }) => {
        try {
            return await request();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    });

// pending: LOADING; fulfilled: state[field] = payload, then SUCCEEDED; rejected: FAILED.
export const addTypeListCases = <
    S extends { typeLoadingStatus: Record<string, LoadingState> },
    F extends keyof S & keyof S['typeLoadingStatus'] & string
>(builder: ActionReducerMapBuilder<S>, thunk: AsyncThunk<any, any, any>, field: F) => {
    builder
        .addCase(thunk.pending, (state) => {
            (state as any).typeLoadingStatus[field] = LoadingState.LOADING;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            (state as any)[field] = action.payload;
            (state as any).typeLoadingStatus[field] = LoadingState.SUCCEEDED;
        })
        .addCase(thunk.rejected, (state) => {
            (state as any).typeLoadingStatus[field] = LoadingState.FAILED;
        });
};
