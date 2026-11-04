import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { LoadingState, aggregateStatus, retryFailedLoads, PageLoadStatus } from '@/store/utils/loadingState';

export interface StateLoad {
  status: LoadingState;
  load: () => unknown;
}

/**
 * Requests every load that is still IDLE (never requested, or reset by Retry) and gives the page's
 * combined status. Loads already fetched by another page (the district pages share the state data)
 * are not requested again.
 */
export const useStateLoads = (loads: StateLoad[]): { status: PageLoadStatus; retry: () => void } => {
  const dispatch = useAppDispatch();
  const latestLoads = useRef(loads);
  latestLoads.current = loads;
  const statusKey = loads.map(entry => entry.status).join(',');

  useEffect(() => {
    latestLoads.current.forEach(entry => {
      if (entry.status === LoadingState.IDLE) entry.load();
    });
  }, [statusKey]);

  return {
    status: aggregateStatus(loads.map(entry => entry.status)),
    retry: () => { dispatch(retryFailedLoads()); },
  };
};
