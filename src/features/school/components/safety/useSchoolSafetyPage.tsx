import { useEffect, useMemo } from 'react';
import { Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectLocationLoading
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as safetySlice from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { aggregateStatus } from '@/store/utils/loadingState';

// The school Safety page's data: fetches, loading gate and notices. Its notices
// differ from the district page's (see useDistrictSafetyPage).
export function useSchoolSafetyPage() {
  const dispatch = useAppDispatch();

  // School and location data
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectLocationLoading);
  
  // Memoize the parameter objects to avoid recreating them on each render
  const schoolId = school?.id || 0;
  const schoolParams = useMemo(() => ({ school_id: schoolId }), [schoolId]);
  const stateParams = useMemo(() => ({}), []);
  
  // Safety data selectors
  const schoolSafetyData = useAppSelector(state => safetySlice.selectSchoolSafetyData(state, schoolParams));
  const schoolHarassmentData = useAppSelector(state => safetySlice.selectSchoolHarassmentData(state, schoolParams));
  const schoolTruancyData = useAppSelector(state => safetySlice.selectSchoolTruancyData(state, schoolParams));
  const schoolSeclusionData = useAppSelector(state => safetySlice.selectSchoolSeclusionData(state, schoolParams));
  const schoolRestraintData = useAppSelector(state => safetySlice.selectSchoolRestraintData(state, schoolParams));
  const schoolBullyingData = useAppSelector(state => safetySlice.selectSchoolBullyingData(state, schoolParams));
  const schoolBullyingClassificationData = useAppSelector(state => safetySlice.selectSchoolBullyingClassificationData(state, schoolParams));
  const schoolBullyingImpactData = useAppSelector(state => safetySlice.selectSchoolBullyingImpactData(state, schoolParams));
  const schoolDisciplineCountData = useAppSelector(state => safetySlice.selectSchoolDisciplineCountData(state, schoolParams));
  const schoolDisciplineIncidentData = useAppSelector(state => safetySlice.selectSchoolDisciplineIncidentData(state, schoolParams));
  const schoolEnrollmentData = useAppSelector(state => safetySlice.selectSchoolEnrollmentData(state, schoolParams));

  // State data selectors - used for comparison
  const stateSafetyData = useAppSelector(state => safetySlice.selectStateSafetyData(state, stateParams));
  const stateHarassmentData = useAppSelector(state => safetySlice.selectStateHarassmentData(state, stateParams));
  const stateTruancyData = useAppSelector(state => safetySlice.selectStateTruancyData(state, stateParams));
  const stateSeclusionData = useAppSelector(state => safetySlice.selectStateSeclusionData(state, stateParams));
  const stateRestraintData = useAppSelector(state => safetySlice.selectStateRestraintData(state, stateParams));
  const stateBullyingData = useAppSelector(state => safetySlice.selectStateBullyingData(state, stateParams));
  const stateBullyingClassificationData = useAppSelector(state => safetySlice.selectStateBullyingClassificationData(state, stateParams));
  const stateBullyingImpactData = useAppSelector(state => safetySlice.selectStateBullyingImpactData(state, stateParams));
  const stateDisciplineCountData = useAppSelector(state => safetySlice.selectStateDisciplineCountData(state, stateParams));
  const stateDisciplineIncidentData = useAppSelector(state => safetySlice.selectStateDisciplineIncidentData(state, stateParams));
  const stateEnrollmentData = useAppSelector(state => safetySlice.selectStateEnrollmentData(state, stateParams));

  // Loading states - consolidated to reduce complexity
  const loadingStates = {
    school: {
      safety: useAppSelector(state => safetySlice.selectSchoolSafetyIncidentsLoadingStatus(state, schoolParams)),
      harassment: useAppSelector(state => safetySlice.selectSchoolHarassmentIncidentsLoadingStatus(state, schoolParams)),
      truancy: useAppSelector(state => safetySlice.selectSchoolTruancyLoadingStatus(state, schoolParams)),
      seclusion: useAppSelector(state => safetySlice.selectSchoolSeclusionLoadingStatus(state, schoolParams)),
      restraint: useAppSelector(state => safetySlice.selectSchoolRestraintLoadingStatus(state, schoolParams)),
      bullying: useAppSelector(state => safetySlice.selectSchoolBullyingIncidentsLoadingStatus(state, schoolParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectSchoolBullyingClassificationsLoadingStatus(state, schoolParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectSchoolBullyingImpactsLoadingStatus(state, schoolParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectSchoolDisciplineCountsLoadingStatus(state, schoolParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectSchoolDisciplineIncidentsLoadingStatus(state, schoolParams)),
      enrollment: useAppSelector(state => safetySlice.selectSchoolEnrollmentLoadingStatus(state, schoolParams))
    },
    state: {
      safety: useAppSelector(state => safetySlice.selectStateSafetyIncidentsLoadingStatus(state, stateParams)),
      harassment: useAppSelector(state => safetySlice.selectStateHarassmentIncidentsLoadingStatus(state, stateParams)),
      truancy: useAppSelector(state => safetySlice.selectStateTruancyLoadingStatus(state, stateParams)),
      seclusion: useAppSelector(state => safetySlice.selectStateSeclusionLoadingStatus(state, stateParams)),
      restraint: useAppSelector(state => safetySlice.selectStateRestraintLoadingStatus(state, stateParams)),
      bullying: useAppSelector(state => safetySlice.selectStateBullyingIncidentsLoadingStatus(state, stateParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectStateBullyingClassificationsLoadingStatus(state, stateParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectStateBullyingImpactsLoadingStatus(state, stateParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectStateDisciplineCountsLoadingStatus(state, stateParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectStateDisciplineIncidentsLoadingStatus(state, stateParams)),
      enrollment: useAppSelector(state => safetySlice.selectStateEnrollmentLoadingStatus(state, stateParams))
    }
  };

  // Helper function to check if data needs to be fetched
  const shouldFetchData = (loadingState: safetySlice.LoadingState, data: any[]) => {
    return loadingState === safetySlice.LoadingState.IDLE && data.length === 0;
  };

  // Fetch safety data when school is available
  useEffect(() => {
    if (!schoolId) return;

    // Fetch school safety data
    const schoolDataFetches = [
      { condition: shouldFetchData(loadingStates.school.safety, schoolSafetyData), 
        action: () => dispatch(safetySlice.fetchSchoolSafetyIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.harassment, schoolHarassmentData), 
        action: () => dispatch(safetySlice.fetchSchoolHarassmentIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.truancy, schoolTruancyData), 
        action: () => dispatch(safetySlice.fetchSchoolTruancyData(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.seclusion, schoolSeclusionData), 
        action: () => dispatch(safetySlice.fetchSchoolSeclusions(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.restraint, schoolRestraintData), 
        action: () => dispatch(safetySlice.fetchSchoolRestraints(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullying, schoolBullyingData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullyingClassification, schoolBullyingClassificationData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingClassifications(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.bullyingImpact, schoolBullyingImpactData), 
        action: () => dispatch(safetySlice.fetchSchoolBullyingImpacts(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.disciplineCount, schoolDisciplineCountData), 
        action: () => dispatch(safetySlice.fetchSchoolDisciplineCounts(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.disciplineIncident, schoolDisciplineIncidentData), 
        action: () => dispatch(safetySlice.fetchSchoolDisciplineIncidents(schoolParams)) },
      { condition: shouldFetchData(loadingStates.school.enrollment, schoolEnrollmentData), 
        action: () => dispatch(safetySlice.fetchSchoolEnrollmentData(schoolParams)) }
    ];

    // Fetch state data
    const stateDataFetches = [
      { condition: shouldFetchData(loadingStates.state.safety, stateSafetyData), 
        action: () => dispatch(safetySlice.fetchStateSafetyIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.harassment, stateHarassmentData), 
        action: () => dispatch(safetySlice.fetchStateHarassmentIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.truancy, stateTruancyData), 
        action: () => dispatch(safetySlice.fetchStateTruancyData(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.seclusion, stateSeclusionData), 
        action: () => dispatch(safetySlice.fetchStateSeclusions(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.restraint, stateRestraintData), 
        action: () => dispatch(safetySlice.fetchStateRestraints(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullying, stateBullyingData), 
        action: () => dispatch(safetySlice.fetchStateBullyingIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullyingClassification, stateBullyingClassificationData), 
        action: () => dispatch(safetySlice.fetchStateBullyingClassifications(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.bullyingImpact, stateBullyingImpactData), 
        action: () => dispatch(safetySlice.fetchStateBullyingImpacts(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.disciplineCount, stateDisciplineCountData), 
        action: () => dispatch(safetySlice.fetchStateDisciplineCounts(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.disciplineIncident, stateDisciplineIncidentData), 
        action: () => dispatch(safetySlice.fetchStateDisciplineIncidents(stateParams)) },
      { condition: shouldFetchData(loadingStates.state.enrollment, stateEnrollmentData), 
        action: () => dispatch(safetySlice.fetchStateEnrollmentData(stateParams)) }
    ];

    // Execute all necessary fetches
    [...schoolDataFetches, ...stateDataFetches].forEach(fetch => {
      if (fetch.condition) {
        fetch.action();
      }
    });
  }, [
    dispatch, schoolId, schoolParams, stateParams,
    loadingStates,
    schoolSafetyData, schoolHarassmentData, schoolTruancyData,
    schoolSeclusionData, schoolRestraintData, schoolBullyingData,
    schoolBullyingClassificationData, schoolBullyingImpactData,
    schoolDisciplineCountData, schoolDisciplineIncidentData, schoolEnrollmentData,
    stateSafetyData, stateHarassmentData, stateTruancyData,
    stateSeclusionData, stateRestraintData, stateBullyingData,
    stateBullyingClassificationData, stateBullyingImpactData,
    stateDisciplineCountData, stateDisciplineIncidentData, stateEnrollmentData
  ]);

  // Loading until every request succeeded; a failed request shows an error with Retry instead
  const loadStatus = aggregateStatus([
    ...Object.values(loadingStates.school),
    ...Object.values(loadingStates.state)
  ]);
  const isLoading = schoolLoading || loadStatus !== 'ready';
  const hasLoadError = !schoolLoading && !!schoolId && loadStatus === 'failed';

  // Determine if data is available for the school
  const hasDataAvailable = useMemo(() => {
    // Check if safety data exists for this school
    const hasSafetyData = schoolSafetyData.length > 0;
    const hasHarassmentData = schoolHarassmentData.length > 0;
    const hasTruancyData = schoolTruancyData.length > 0;
    const hasBullyingData = schoolBullyingData.length > 0;
    const hasRestraintData = schoolRestraintData.length > 0;
    const hasSeclusionData = schoolSeclusionData.length > 0;
    
    return hasSafetyData || hasHarassmentData || hasTruancyData || 
           hasBullyingData || hasRestraintData || hasSeclusionData;
  }, [
    schoolSafetyData, 
    schoolHarassmentData, 
    schoolTruancyData,
    schoolBullyingData,
    schoolRestraintData,
    schoolSeclusionData
  ]);

  // Determine earliest year of data (if any)
  const earliestDataYear = useMemo(() => {
    if (!hasDataAvailable) return null;
    
    const years = [
      ...schoolSafetyData.map(item => item.year),
      ...schoolHarassmentData.map(item => item.year),
      ...schoolTruancyData.map(item => item.year),
      ...schoolBullyingData.map(item => item.year),
      ...schoolRestraintData.map(item => item.year),
      ...schoolSeclusionData.map(item => item.year)
    ].filter(Boolean);
    
    return years.length > 0 ? Math.min(...years) : null;
  }, [
    hasDataAvailable, 
    schoolSafetyData, 
    schoolHarassmentData, 
    schoolTruancyData,
    schoolBullyingData,
    schoolRestraintData,
    schoolSeclusionData
  ]);

  // Desktop notice, shown in the default view
  const desktopNotice = (
    <>
      {!hasDataAvailable && (
        <Typography variant="body1">
          No safety data is available for this school.
        </Typography>
      )}
      {hasDataAvailable && earliestDataYear && earliestDataYear > EARLIEST_YEAR && (
        <Typography variant="body1">
          Note: Data before {earliestDataYear} is unavailable for this school.
        </Typography>
      )}
      {hasDataAvailable && (
        <Typography variant="body1">
          Click on a safety category card to see detailed information.
        </Typography>
      )}
    </>
  );

  // Render data unavailability notice for mobile view
  const renderDataUnavailabilityNotice = () => {
    if (hasDataAvailable && (!earliestDataYear || earliestDataYear <= EARLIEST_YEAR)) return null;
    
    return (
      <>
        {!hasDataAvailable ? (
          <Typography variant="body1">
            Note: No safety data is available for this school.
          </Typography>
        ) : earliestDataYear && earliestDataYear > EARLIEST_YEAR ? (
          <Typography variant="body1">
            Note: Data before {earliestDataYear} is unavailable for this school.
          </Typography>
        ) : null}
      </>
    );
  };

  return {
    title: (
      <SectionTitle 
        displayName={PAGE_REGISTRY.school.safety.displayName}
        schoolName={school?.name}
      />
    ),
    isLoading,
    hasLoadError,
    desktopNotice,
    mobileNotice: renderDataUnavailabilityNotice()
  };
}
