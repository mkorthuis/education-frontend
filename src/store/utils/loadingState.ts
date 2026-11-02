import { createAction } from '@reduxjs/toolkit';

// The one loading-status enum shared by every slice.
export enum LoadingState {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed'
}

// A page's combined status: 'loading' while any request is IDLE or LOADING (IDLE because the
// page's fetch effect has not dispatched it yet), then 'failed' if any request failed, otherwise 'ready'.
export type PageLoadStatus = 'loading' | 'ready' | 'failed';

export const aggregateStatus = (statuses: LoadingState[]): PageLoadStatus => {
    if (statuses.some(status => status === LoadingState.IDLE || status === LoadingState.LOADING)) return 'loading';
    return statuses.some(status => status === LoadingState.FAILED) ? 'failed' : 'ready';
};

// Retry for pages that show a load error: every slice that handles this sets its FAILED
// statuses back to IDLE, and the open page's fetch effect requests those keys again.
export const retryFailedLoads = createAction('loading/retryFailedLoads');

// Sets every FAILED status in a (possibly nested) status record back to IDLE.
export const resetFailedStatuses = (statuses: Record<string, any>) => {
    Object.keys(statuses).forEach(key => {
        const status = statuses[key];
        if (status === LoadingState.FAILED) {
            statuses[key] = LoadingState.IDLE;
        } else if (status && typeof status === 'object') {
            resetFailedStatuses(status);
        }
    });
};
