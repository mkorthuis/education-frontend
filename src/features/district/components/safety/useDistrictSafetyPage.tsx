import { useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  selectCurrentSchools
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import * as safetySlice from '@/store/slices/safetySlice';
import { EARLIEST_YEAR } from '@/utils/safetyCalculations';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { aggregateStatus } from '@/store/utils/loadingState';
import { downloadWorkbook } from '@/features/state/utils/excel';
import { entityFileName } from '@/features/entity/excel';
import { safetyWorkbook } from '@/features/entity/workbooks/safetyWorkbook';

// The district Safety page's data: fetches (including the 2 school-level requests
// by district_id), loading gate and notices. Its notices list schools with missing
// harassment data, unlike the school page's (see useSchoolSafetyPage).
export function useDistrictSafetyPage() {
  const dispatch = useAppDispatch();

  // District and location data
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const districtLoading = useAppSelector(selectLocationLoading);
  const schools = useAppSelector(selectCurrentSchools);
  
  // Memoize the parameter objects to avoid recreating them on each render
  const districtParams = useMemo(() => ({ district_id: districtId }), [districtId]);
  const stateParams = useMemo(() => ({}), []);
  
  // Safety data selectors
  const schoolSafetyData = useAppSelector(state => safetySlice.selectSchoolSafetyData(state, districtParams));
  const schoolHarassmentData = useAppSelector(state => safetySlice.selectSchoolHarassmentData(state, districtParams));
  const districtSafetyData = useAppSelector(state => safetySlice.selectDistrictSafetyData(state, districtParams));
  const districtHarassmentData = useAppSelector(state => safetySlice.selectDistrictHarassmentData(state, districtParams));
  const districtTruancyData = useAppSelector(state => safetySlice.selectDistrictTruancyData(state, districtParams));
  const districtSeclusionData = useAppSelector(state => safetySlice.selectDistrictSeclusionData(state, districtParams));
  const districtRestraintData = useAppSelector(state => safetySlice.selectDistrictRestraintData(state, districtParams));
  const districtBullyingData = useAppSelector(state => safetySlice.selectDistrictBullyingData(state, districtParams));
  const districtBullyingClassificationData = useAppSelector(state => safetySlice.selectDistrictBullyingClassificationData(state, districtParams));
  const districtBullyingImpactData = useAppSelector(state => safetySlice.selectDistrictBullyingImpactData(state, districtParams));
  const districtDisciplineCountData = useAppSelector(state => safetySlice.selectDistrictDisciplineCountData(state, districtParams));
  const districtDisciplineIncidentData = useAppSelector(state => safetySlice.selectDistrictDisciplineIncidentData(state, districtParams));
  const districtEnrollmentData = useAppSelector(state => safetySlice.selectDistrictEnrollmentData(state, districtParams));

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
      safety: useAppSelector(state => safetySlice.selectSchoolSafetyIncidentsLoadingStatus(state, districtParams)),
      harassment: useAppSelector(state => safetySlice.selectSchoolHarassmentIncidentsLoadingStatus(state, districtParams))
    },
    district: {
      safety: useAppSelector(state => safetySlice.selectDistrictSafetyIncidentsLoadingStatus(state, districtParams)),
      harassment: useAppSelector(state => safetySlice.selectDistrictHarassmentIncidentsLoadingStatus(state, districtParams)),
      truancy: useAppSelector(state => safetySlice.selectDistrictTruancyLoadingStatus(state, districtParams)),
      seclusion: useAppSelector(state => safetySlice.selectDistrictSeclusionLoadingStatus(state, districtParams)),
      restraint: useAppSelector(state => safetySlice.selectDistrictRestraintLoadingStatus(state, districtParams)),
      bullying: useAppSelector(state => safetySlice.selectDistrictBullyingIncidentsLoadingStatus(state, districtParams)),
      bullyingClassification: useAppSelector(state => safetySlice.selectDistrictBullyingClassificationsLoadingStatus(state, districtParams)),
      bullyingImpact: useAppSelector(state => safetySlice.selectDistrictBullyingImpactsLoadingStatus(state, districtParams)),
      disciplineCount: useAppSelector(state => safetySlice.selectDistrictDisciplineCountsLoadingStatus(state, districtParams)),
      disciplineIncident: useAppSelector(state => safetySlice.selectDistrictDisciplineIncidentsLoadingStatus(state, districtParams)),
      enrollment: useAppSelector(state => safetySlice.selectDistrictEnrollmentLoadingStatus(state, districtParams))
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

  useEffect(() => {
    if (!districtId) return;

    // Only fetch other data if we have the district data
    if (district) {
      // Fetch school data
      if (shouldFetchData(loadingStates.school.harassment, schoolHarassmentData)) {
        dispatch(safetySlice.fetchSchoolHarassmentIncidents(districtParams));
      }
      
      if (shouldFetchData(loadingStates.school.safety, schoolSafetyData)) {
        dispatch(safetySlice.fetchSchoolSafetyIncidents(districtParams));
      }

      // Fetch district data
      const districtDataFetches = [
        { condition: shouldFetchData(loadingStates.district.safety, districtSafetyData), 
          action: () => dispatch(safetySlice.fetchDistrictSafetyIncidents(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.harassment, districtHarassmentData), 
          action: () => dispatch(safetySlice.fetchDistrictHarassmentIncidents(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.truancy, districtTruancyData), 
          action: () => dispatch(safetySlice.fetchDistrictTruancyData(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.seclusion, districtSeclusionData), 
          action: () => dispatch(safetySlice.fetchDistrictSeclusions(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.restraint, districtRestraintData), 
          action: () => dispatch(safetySlice.fetchDistrictRestraints(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.bullying, districtBullyingData), 
          action: () => dispatch(safetySlice.fetchDistrictBullyingIncidents(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.bullyingClassification, districtBullyingClassificationData), 
          action: () => dispatch(safetySlice.fetchDistrictBullyingClassifications(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.bullyingImpact, districtBullyingImpactData), 
          action: () => dispatch(safetySlice.fetchDistrictBullyingImpacts(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.disciplineCount, districtDisciplineCountData), 
          action: () => dispatch(safetySlice.fetchDistrictDisciplineCounts(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.disciplineIncident, districtDisciplineIncidentData), 
          action: () => dispatch(safetySlice.fetchDistrictDisciplineIncidents(districtParams)) },
        { condition: shouldFetchData(loadingStates.district.enrollment, districtEnrollmentData), 
          action: () => dispatch(safetySlice.fetchDistrictEnrollmentData(districtParams)) }
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
      [...districtDataFetches, ...stateDataFetches].forEach(fetch => {
        if (fetch.condition) {
          fetch.action();
        }
      });
    }
  }, [
    dispatch, districtId, district,
    loadingStates, districtParams, stateParams,
    schoolSafetyData, schoolHarassmentData,
    districtSafetyData, districtHarassmentData, districtTruancyData,
    districtSeclusionData, districtRestraintData, districtBullyingData,
    districtBullyingClassificationData, districtBullyingImpactData,
    districtDisciplineCountData, districtDisciplineIncidentData, districtEnrollmentData,
    stateSafetyData, stateHarassmentData, stateTruancyData,
    stateSeclusionData, stateRestraintData, stateBullyingData,
    stateBullyingClassificationData, stateBullyingImpactData,
    stateDisciplineCountData, stateDisciplineIncidentData, stateEnrollmentData
  ]);

  // Loading until every request succeeded; a failed request shows an error with Retry instead
  const loadStatus = aggregateStatus([
    ...Object.values(loadingStates.district),
    ...Object.values(loadingStates.state),
    ...Object.values(loadingStates.school)
  ]);
  const isLoading = districtLoading || loadStatus !== 'ready';
  const hasLoadError = !districtLoading && !!districtId && loadStatus === 'failed';

  // Process school harassment data to find earliest years
  const getSchoolsWithEarliestHarassmentYear = useMemo(() => {
    // Early return if schools or data aren't loaded yet
    if (!schools.length || !schoolHarassmentData.length) {
      return [];
    }

    // Create a map to store the earliest year for each school
    const schoolYearMap = new Map<number, number>();

    // Process harassment data to find earliest year for each school
    schoolHarassmentData.forEach(item => {
      const schoolId = item.school_id;
      const year = item.year;
      
      // If this school isn't in our map yet, or this year is earlier than what we have
      if (!schoolYearMap.has(schoolId) || year < schoolYearMap.get(schoolId)!) {
        schoolYearMap.set(schoolId, year);
      }
    });

    // Create the result array with school name and earliest year
    return schools.map(school => ({
      id: school.id,
      name: school.name,
      earliestYear: schoolYearMap.get(school.id) || null
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, schoolHarassmentData]);

  // Filter schools to exclude those with data from EARLIEST_YEAR
  const filteredSchools = useMemo(() => {
    return getSchoolsWithEarliestHarassmentYear.filter(
      school => !school.earliestYear || school.earliestYear > EARLIEST_YEAR
    );
  }, [getSchoolsWithEarliestHarassmentYear]);

  // Render school unavailability notice for both views
  const renderSchoolUnavailabilityNotice = () => {
    if (filteredSchools.length === 0) return null;
    
    return (
      <>
        <Typography variant="body1">
          Note: The Following School Data is Unavailable:
        </Typography>
        <Box component="ul" sx={{pl: 3, mt: 1}}>
          {filteredSchools.map((school) => (
            <Typography component="li" variant="body2" key={school.id}>
              {school.earliestYear 
                ? `${school.name}: Data Before ${school.earliestYear}`
                : `${school.name}: No Safety Data`}
            </Typography>
          ))}
        </Box>
      </>
    );
  };

  // Everything on the page as one workbook: every category and year, with New Hampshire's rates
  // beside the district's, and each school's serious incidents
  const displayName = PAGE_REGISTRY.district.safety.displayName;
  const downloadExcel = () => {
    if (!district) return;
    const schoolNames = new Map(schools.map(school => [school.id, school.name]));
    return downloadWorkbook(entityFileName('district', district.name, 'safety'), safetyWorkbook({
      kind: 'district',
      name: district.name,
      displayName,
      entity: {
        truancy: districtTruancyData,
        bullying: districtBullyingData,
        bullyingClassification: districtBullyingClassificationData,
        bullyingImpact: districtBullyingImpactData,
        harassment: districtHarassmentData,
        restraint: districtRestraintData,
        seclusion: districtSeclusionData,
        disciplineCount: districtDisciplineCountData,
        disciplineIncident: districtDisciplineIncidentData,
        enrollment: districtEnrollmentData,
      },
      state: {
        truancy: stateTruancyData,
        bullying: stateBullyingData,
        harassment: stateHarassmentData,
        restraint: stateRestraintData,
        seclusion: stateSeclusionData,
        disciplineCount: stateDisciplineCountData,
        disciplineIncident: stateDisciplineIncidentData,
        enrollment: stateEnrollmentData,
      },
      serious: schoolSafetyData.map(row => ({
        school: schoolNames.get(row.school_id) ?? `School (ID: ${row.school_id})`,
        year: row.year,
        type: row.safety_type.name,
        count: row.count,
      })),
    }));
  };

  return {
    // The whitespace after the title is a text node the page has always rendered.
    title: (
      <>
        <SectionTitle 
          displayName={displayName}
          districtName={district?.name}
          onDownload={downloadExcel}
          downloadReady={!isLoading && !hasLoadError && !!district}
        />{'      '}
      </>
    ),
    isLoading,
    hasLoadError,
    desktopNotice: renderSchoolUnavailabilityNotice(),
    mobileNotice: renderSchoolUnavailabilityNotice()
  };
}
