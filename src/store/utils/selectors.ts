import { createSelector } from '@reduxjs/toolkit';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKey, type KeyFn } from '@/store/utils/cacheKey';

// ------------------------------
// Keyed selector factories (one createSelector per call; never memoize the factories)
// ------------------------------
const strippedKey = (params: { forceRefresh?: boolean }, key: KeyFn) => {
    // Identifier `params` kept: the TypeError text on undefined params names it.
    const { forceRefresh = false, ...options } = params;
    return key(options);
};

/** Plain. Key = key({ ...params }): forceRefresh KEPT (matches pending); undefined params give '_default'. */
export const makeStatusSelector = <R, P extends object>(bucket: (state: R) => Record<string, LoadingState>, key: KeyFn = createOptionsKey) =>
    (state: R, params: P): LoadingState => {
        const k = key({ ...params });
        return bucket(state)[k] || LoadingState.IDLE;
    };

/** createSelector form of makeStatusSelector (safety district/state). The result is a primitive, so memoizing changes nothing;
 *  it stays a createSelector only so that dev-mode reselect checks and the selector object shape are identical to today. */
export const makeMemoStatusSelector = <R, P extends object>(bucket: (state: R) => Record<string, LoadingState>, key: KeyFn = createOptionsKey) =>
    createSelector(
        [bucket, (_: R, params: P) => key({ ...params })],
        (statuses, k) => statuses[k] || LoadingState.IDLE
    );

/** Plain, unmemoized: a FRESH [] on every miss (safety school data). Throws on undefined params. */
export const makeDataSelector = <R, P extends { forceRefresh?: boolean }, Row>(bucket: (state: R) => Record<string, Row[]>, key: KeyFn = createOptionsKey) =>
    (state: R, params: P): Row[] => {
        const k = strippedKey(params, key);
        return bucket(state)[k] || [];
    };

/** createSelector over (bucket ref, key). Stored ref on a hit; on a miss, a [] that is stable until the bucket ref changes. Throws on undefined params. */
export const makeMemoDataSelector = <R, P extends { forceRefresh?: boolean }, Row>(bucket: (state: R) => Record<string, Row[]>, key: KeyFn = createOptionsKey) =>
    createSelector(
        [bucket, (_: R, params: P) => strippedKey(params, key)],
        (data, k) => data[k] || []
    );
