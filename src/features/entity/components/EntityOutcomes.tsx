import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress, Divider } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectLocationLoading } from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import EntityOutcomeSummaryCard from './outcome/EntityOutcomeSummaryCard';
import EntityWhatIsNextDetails from './outcome/EntityWhatIsNextDetails';
import EntityGraduationRateChart from './outcome/EntityGraduationRateChart';
import EntityWhatIsNextChart from './outcome/EntityWhatIsNextChart';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { EntityKind, SELECT_CURRENT_ENTITY } from '@/features/entity/entity';
import { OUTCOME } from '@/features/entity/bindings/outcome';

const EntityOutcomes: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const dispatch = useAppDispatch();
  const outcome = OUTCOME[kind];

  // Entity and location data
  const entity = useAppSelector(SELECT_CURRENT_ENTITY[kind]);
  const entityId = entity?.id;
  const entityLoading = useAppSelector(selectLocationLoading);

  // Memoize the parameter objects to avoid recreating them on each render
  const entityParams = useMemo(() => outcome.params(entityId), [outcome, entityId]);
  const stateParams = useMemo(() => ({}), []);

  const entityPostGraduationData = useAppSelector(state =>
    outcome.select.postGraduation(state, entityParams));
  const statePostGraduationData = useAppSelector(state =>
    outcomeSlice.selectStatePostGraduationData(state, stateParams));

  const entityEarlyExitData = useAppSelector(state =>
    outcome.select.earlyExit(state, entityParams));
  const stateEarlyExitData = useAppSelector(state =>
    outcomeSlice.selectStateEarlyExitData(state, stateParams));

  const entityGraduationCohortData = useAppSelector(state =>
    outcome.select.graduationCohort(state, entityParams));
  const stateGraduationCohortData = useAppSelector(state =>
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));

  // Post-graduation types data
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  // Loading states
  const loadingStates = {
    types: {
      postGraduationTypes: useAppSelector(outcomeSlice.selectPostGraduationTypesLoadingStatus)
    },
    entity: {
      postGraduation: useAppSelector(state =>
        outcome.loading.postGraduation(state, entityParams)),
      earlyExit: useAppSelector(state =>
        outcome.loading.earlyExit(state, entityParams)),
      graduationCohort: useAppSelector(state =>
        outcome.loading.graduationCohort(state, entityParams))
    },
    state: {
      postGraduation: useAppSelector(state =>
        outcomeSlice.selectStatePostGraduationLoadingStatus(state, stateParams)),
      earlyExit: useAppSelector(state =>
        outcomeSlice.selectStateEarlyExitLoadingStatus(state, stateParams)),
      graduationCohort: useAppSelector(state =>
        outcomeSlice.selectStateGraduationCohortLoadingStatus(state, stateParams))
    }
  };

  // Check if any data is still loading
  const isLoading = useMemo(() => {
    return entityLoading ||
      loadingStates.types.postGraduationTypes !== outcomeSlice.LoadingState.SUCCEEDED ||
      Object.values(loadingStates.entity).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED) ||
      Object.values(loadingStates.state).some(state => state !== outcomeSlice.LoadingState.SUCCEEDED);
  }, [entityLoading, loadingStates]);

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: outcomeSlice.LoadingState, data: any[]) => {
    return loadingState === outcomeSlice.LoadingState.IDLE && data.length === 0;
  };

  useEffect(() => {
    if (!entityId) return;

    // Only fetch other data if we have the entity data
    if (entity) {

      // Fetch post-graduation types if needed
      if (shouldFetchData(loadingStates.types.postGraduationTypes, postGraduationTypes)) {
        dispatch(outcomeSlice.fetchPostGraduationTypes());
      }

      // Fetch entity data
      if (shouldFetchData(loadingStates.entity.postGraduation, entityPostGraduationData)) {
        dispatch(outcome.fetch.postGraduation(entityParams));
      }
      if (shouldFetchData(loadingStates.entity.earlyExit, entityEarlyExitData)) {
        dispatch(outcome.fetch.earlyExit(entityParams));
      }
      if (shouldFetchData(loadingStates.entity.graduationCohort, entityGraduationCohortData)) {
        dispatch(outcome.fetch.graduationCohort(entityParams));
      }

      // Fetch state data
      if (shouldFetchData(loadingStates.state.postGraduation, statePostGraduationData)) {
        dispatch(outcomeSlice.fetchStatePostGraduationOutcomes(stateParams));
      }
      if (shouldFetchData(loadingStates.state.earlyExit, stateEarlyExitData)) {
        dispatch(outcomeSlice.fetchStateEarlyExitData(stateParams));
      }
      if (shouldFetchData(loadingStates.state.graduationCohort, stateGraduationCohortData)) {
        dispatch(outcomeSlice.fetchStateGraduationCohortData(stateParams));
      }
    }
  }, [
    dispatch, outcome, entityId, entity,
    loadingStates, entityParams, stateParams,
    entityPostGraduationData, entityEarlyExitData, entityGraduationCohortData,
    statePostGraduationData, stateEarlyExitData, stateGraduationCohortData,
    postGraduationTypes
  ]);

  return (
    <>
      <SectionTitle
        displayName={PAGE_REGISTRY[kind].outcomes.displayName}
        schoolName={kind === 'school' ? entity?.name : undefined}
        districtName={kind === 'district' ? entity?.name : undefined}
      />

      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <EntityOutcomeSummaryCard kind={kind} />
              </Box>
              <Divider sx={{ display: { xs: 'block', lg: 'none' }, borderBottomWidth: 1 }} />
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Box sx={{ flex: 1 }}>
                <EntityGraduationRateChart kind={kind} />
              </Box>
            </Box>
            <Divider sx={{ display: { xs: 'block', md: 'none' }, borderBottomWidth: 2 }} />
            <Divider sx={{ display: { xs: 'none', md: 'block' }, borderBottomWidth: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <EntityWhatIsNextDetails kind={kind} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', lg: 'none' }, borderBottomWidth: 1 }} />
              <Box sx={{ flex: 1 }}>
                <EntityWhatIsNextChart kind={kind} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default EntityOutcomes;
