import { useAppSelector } from '@/store/hooks';
import { 
  selectLatestMeasurements, 
  selectLatestMeasurementsLoadingState,
  selectLatestMeasurementsError,
  FetchMeasurementsParams
} from '@/store/slices/measurementSlice';

export const useMeasurements = (params: FetchMeasurementsParams) => {
  const measurements = useAppSelector(state => selectLatestMeasurements(state, params));
  const loadingState = useAppSelector(state => selectLatestMeasurementsLoadingState(state, params));
  const error = useAppSelector(selectLatestMeasurementsError);

  return {
    measurements,
    loadingState,
    error
  };
}; 