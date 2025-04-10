import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectAnyLocationLoading,
  fetchAllDistrictData
} from '@/store/slices/locationSlice';
import { 
  fetchAllMeasurements, 
  fetchMeasurementTypes,
  selectMeasurementsLoading,
  selectAllMeasurements,
  selectMeasurementTypesLoaded,
} from '@/store/slices/measurementSlice';
import {
  fetchAssessmentDistrictData,
  selectCurrentAssessmentDistrictData,
  selectAssessmentDistrictDataLoading,
  setSelectedSubjectId,
  selectSelectedSubjectId,
  selectSelectedSubject,
  fetchAssessmentStateData,
  selectCurrentAssessmentStateData,
  selectAssessmentStateDataLoading,
  setCurrentDistrictDataKey,
  AssessmentDistrictData,
  AssessmentDataQueryKey
} from '@/store/slices/assessmentSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import MeasurementCard from '@/features/district/components/academic/MeasurementCard';
import AcademicSubjectDetails from '@/features/district/components/academic/AcademicSubjectDetails';
import AcademicDefaultView from '@/features/district/components/academic/AcademicDefaultView';
import { filterAssessmentResults, ALL_GRADES_ID } from '@/features/district/utils/assessmentDataProcessing';

// Get current fiscal year (July to June)
const getCurrentFiscalYear = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = January, 6 = July)
  const currentYear = today.getFullYear();
  
  // If we're in or after July (month 6), use current year, otherwise use previous year
  return currentMonth >= 6 ? currentYear.toString() : (currentYear - 1).toString();
};

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectAnyLocationLoading);
  const measurementsLoading = useAppSelector(selectMeasurementsLoading);
  const measurements = useAppSelector(selectAllMeasurements);
  const measurementTypesLoaded = useAppSelector(selectMeasurementTypesLoaded);
  const assessmentData = useAppSelector(selectCurrentAssessmentDistrictData);
  const assessmentLoading = useAppSelector(selectAssessmentDistrictDataLoading);
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  const stateAssessmentLoading = useAppSelector(selectAssessmentStateDataLoading);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubject = useAppSelector(selectSelectedSubject);
  const dispatch = useAppDispatch();

  const FISCAL_YEAR = getCurrentFiscalYear();

  // Effect to reset selected subject - runs only once when component mounts
  useEffect(() => {
    dispatch(setSelectedSubjectId(null));
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(parseInt(id)));
      }
      
      // If measurement types are not loaded, fetch them
      if (!measurementTypesLoaded) {
        dispatch(fetchMeasurementTypes());
      }
      
      // If we have the district but no measurements, fetch them
      if (district && !measurementsLoading && measurements.length === 0) {
        dispatch(fetchAllMeasurements({ entityId: id, entityType: 'district' }));
      }

      if (!stateAssessmentLoading && stateAssessmentData.length === 0) {
        dispatch(fetchAssessmentStateData({}));
      }

      if ((district && !assessmentLoading && assessmentData.length === 0)) {

        dispatch(fetchAssessmentDistrictData({
          district_id: parseInt(id)
        })).then((action) => {
          // After fetching is complete, set the current district data key manually
          if (action.meta.requestStatus === 'fulfilled') {
            // Type assertion to access the payload properly
            const payload = action.payload as { 
              key: AssessmentDataQueryKey; 
              params: any; 
              data: AssessmentDistrictData[] 
            };
            dispatch(setCurrentDistrictDataKey(payload.key));
          }
        });
      }
    }
  }, [dispatch, id, district, districtLoading, measurementsLoading, measurements.length, measurementTypesLoaded, assessmentLoading, assessmentData.length]);


  // Show loading when either district data or measurement data is loading
  const isLoading = districtLoading || measurementsLoading || assessmentLoading;

  // Filter assessment data by fiscal year, subject_id=1, and subgroup_id=1
  const filteredAssessmentData = filterAssessmentResults(assessmentData, {
    year: FISCAL_YEAR,
    assessment_subgroup_id: 1,
    grade_id: ALL_GRADES_ID // Using constant instead of hardcoded 999
  });

  return (
    <>
      <SectionTitle>{district?.name} School District</SectionTitle>    
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }}}>
            <Box sx={{display: 'flex', flexDirection: 'column', width: { xs: '100%', md: '300px' }, flexShrink: 0}}>
              {filteredAssessmentData.map((item) => (
                <MeasurementCard
                  key={item.id}
                  assessment_subject_id={item.assessment_subject?.id || 0}
                />
              ))}
            </Box>
            
            {/* Conditionally render either AcademicSubjectDetails or AcademicDefaultView based on selectedSubjectId */}
            {selectedSubjectId ? (
              <AcademicSubjectDetails subject={selectedSubject} />
            ) : (
              <AcademicDefaultView 
                assessmentData={assessmentData} 
                fiscalYear={FISCAL_YEAR} 
              />
            )}
            
          </Box>
        )}
    </>
  );
};

export default AcademicAchievement; 