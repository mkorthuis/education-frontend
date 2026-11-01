import { createAsyncThunk, type ActionReducerMapBuilder, type AsyncThunk, type Draft, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKey, type KeyFn } from '@/store/utils/cacheKey';

// ------------------------------
// Keyed resources: one record per options key (params minus forceRefresh)
// ------------------------------
export interface KeyedPayload<Row> {
    key: string;
    data: Row[];
}

export type KeyedArg = { forceRefresh?: boolean };
export type KeyedOptions<Arg extends KeyedArg> = Omit<Arg, 'forceRefresh'>;

export interface ThunkHooks {
    getState: () => unknown;
    dispatch: ThunkDispatch<unknown, unknown, UnknownAction>;
}

export interface KeyedThunkConfig<Arg extends KeyedArg, Row> {
    /** Rest object (params minus forceRefresh) in the caller's key order. A plain arrow that returns the endpoint promise. */
    request: (options: KeyedOptions<Arg>, forceRefresh: boolean) => Promise<any>;
    /** Cache-key builder, default createOptionsKey. */
    key?: KeyFn;
    /** ONLY where the hand-written thunk had a slice cache check. Hit = `cached && !forceRefresh` ([] counts as a hit). */
    cached?: (getState: () => unknown, key: string) => Row[] | undefined;
    /** Synchronous. Return a promise only if it started work that must be awaited (await parity). */
    before?: (hooks: ThunkHooks) => Promise<unknown> | undefined;
    /** Synchronous post-request transform that reads fresh state (assessment enrichment). */
    transform?: (raw: any, getState: () => unknown) => Row[];
}

export const createKeyedThunk = <Arg extends KeyedArg, Row>(typePrefix: string, config: KeyedThunkConfig<Arg, Row>): AsyncThunk<KeyedPayload<Row>, Arg, {}> =>
    createAsyncThunk<KeyedPayload<Row>, Arg>(typePrefix, async (params, { getState, dispatch, rejectWithValue }) => {
        try {
            // Defensive only: an undefined arg never reaches here, because the pending reducer throws first.
            const { forceRefresh = false, ...options } = (params ?? {}) as Arg;
            const waitFor = config.before?.({ getState, dispatch });
            if (waitFor) await waitFor;
            const key = (config.key ?? createOptionsKey)(options);
            if (config.cached) {
                const cachedData = config.cached(getState, key);
                if (cachedData && !forceRefresh) {
                    return { key, data: cachedData };
                }
            }
            const raw = await config.request(options as KeyedOptions<Arg>, forceRefresh);
            return { key, data: config.transform ? config.transform(raw, getState) : raw };
        } catch (error: any) {
            // Must stay error.message: a failed type prefetch rethrows a non-Error, so this is rejectWithValue(undefined).
            return rejectWithValue(error.message);
        }
    });

// ------------------------------
// Reducer cases
// ------------------------------
export interface KeyedCaseConfig<S, Row> {
    data: (state: Draft<S>) => Record<string, Row[]>;
    status: (state: Draft<S>) => Record<string, LoadingState>;
    /** Key for pending/rejected, applied to the RAW action.meta.arg (forceRefresh included). Default createOptionsKey. */
    key?: KeyFn;
    /** Extra fulfilled write (assessment currentStateKey only). */
    onFulfilled?: (state: Draft<S>, payload: KeyedPayload<Row>) => void;
}

// pending/rejected are keyed on the raw meta.arg (forceRefresh kept, throws on undefined); fulfilled on payload.key.
export const addKeyedCases = <S, Row, Arg>(builder: ActionReducerMapBuilder<S>, thunk: AsyncThunk<KeyedPayload<Row>, Arg, any>, config: KeyedCaseConfig<S, Row>) => {
    const keyFn = config.key ?? createOptionsKey;
    builder
        .addCase(thunk.pending, (state, action) => {
            const key = keyFn(action.meta.arg as Record<string, any>);
            config.status(state)[key] = LoadingState.LOADING;
        })
        .addCase(thunk.fulfilled, (state, action) => {
            config.data(state)[action.payload.key] = action.payload.data;
            config.onFulfilled?.(state, action.payload);
            config.status(state)[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(thunk.rejected, (state, action) => {
            const key = keyFn(action.meta.arg as Record<string, any>);
            config.status(state)[key] = LoadingState.FAILED;
        });
};

// ------------------------------
// Type prefetch
// ------------------------------
/** IDLE && empty: start the type thunk and return its unwrap() promise; otherwise undefined (no await). */
export const prefetchIfIdle = (status: LoadingState, list: readonly unknown[], start: () => { unwrap(): Promise<unknown> }): Promise<unknown> | undefined =>
    status === LoadingState.IDLE && list.length === 0 ? start().unwrap() : undefined;
