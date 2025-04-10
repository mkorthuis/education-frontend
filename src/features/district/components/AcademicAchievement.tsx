import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
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
import { FISCAL_YEAR } from '@/utils/environment';

const AcademicAchievement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  // Selectors
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

  // Effect to reset selected subject - runs only once when component mounts
  useEffect(() => {
    dispatch(setSelectedSubjectId(null));
  }, [dispatch]);

  // Fetch all required data
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

      // Fetch state assessment data if not already loaded
      if (!stateAssessmentLoading && stateAssessmentData.length === 0) {
        dispatch(fetchAssessmentStateData({}));
      }

      // Fetch district assessment data if not already loaded
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
  }, [
    dispatch, id, district, districtLoading, 
    measurementsLoading, measurements.length, 
    measurementTypesLoaded, assessmentLoading, 
    assessmentData.length, stateAssessmentLoading,
    stateAssessmentData.length
  ]);

  // Show loading when any data is still loading
  const isLoading = districtLoading || measurementsLoading || assessmentLoading;

  // Filter assessment data by fiscal year and subgroup_id
  const filteredAssessmentData = filterAssessmentResults(assessmentData, {
    year: FISCAL_YEAR,
    assessment_subgroup_id: 1,
    grade_id: ALL_GRADES_ID
  }).filter(item => item.above_proficient_percentage !== null);

  // Card container styling for responsive layout
  const cardContainerStyles = {
    marginRight: { xs: 0, md: '16px' }, 
    display: 'flex', 
    flexDirection: { 
      xs: selectedSubjectId ? 'row' : 'column', 
      md: 'column' 
    },
    flexWrap: { xs: selectedSubjectId ? 'wrap' : 'nowrap', md: 'nowrap' },
    width: { xs: '100%', md: '300px'}, 
    gap: 0, // Explicitly set gap to 0
    flexShrink: 0,
    mb: selectedSubjectId ? 2 : 0,
    justifyContent: selectedSubjectId ? 'space-between' : 'flex-start'
  };

  return (
    <>
      <SectionTitle>{district?.name} School District</SectionTitle>    
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
          {/* Mobile instruction text - only visible on mobile and when no subject is selected */}
          {!selectedSubjectId && (
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
              <Typography variant="body1">
                Please Click A Subject For Detailed Information
              </Typography>
            </Box>
          )}

          {/* Measurement cards container */}
          <Box sx={cardContainerStyles}>
            {filteredAssessmentData.map((item, index) => (
              <MeasurementCard
                key={item.id}
                assessment_subject_id={item.assessment_subject?.id || 0}
                totalCount={filteredAssessmentData.length}
                index={index}
              />
            ))}
          </Box>
          
          {/* Conditionally render AcademicSubjectDetails or AcademicDefaultView */}
          {selectedSubjectId ? (
            <AcademicSubjectDetails subject={selectedSubject} />
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1 }}>
              <AcademicDefaultView 
                assessmentData={assessmentData} 
                fiscalYear={FISCAL_YEAR} 
              />
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default AcademicAchievement; 