import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectAnyLocationLoading
} from '@/store/slices/locationSlice';
import {
  fetchAssessmentDistrictData,
  selectCurrentAssessmentDistrictData,
  setSelectedSubjectId,
  selectSelectedSubjectId,
  selectSelectedSubject,
  fetchAssessmentStateData,
  selectCurrentAssessmentStateData,
  setCurrentDistrictDataKey,
  AssessmentDistrictData,
  AssessmentDataQueryKey,
  clearAssessments,
  selectAssessmentDistrictLoadingStatus,
  selectAssessmentStateLoadingStatus,
  selectAssessmentDistrictData
} from '@/store/slices/assessmentSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import MeasurementCard from '@/features/district/components/academic/MeasurementCard';
import AcademicSubjectDetails from '@/features/district/components/academic/AcademicSubjectDetails';
import AcademicDefaultView from '@/features/district/components/academic/AcademicDefaultView';
import { filterAssessmentResults, ALL_GRADES_ID } from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { LoadingState } from '@/store/slices/safetySlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const AcademicAchievement: React.FC = () => {
  const { subjectName } = useParams<{ subjectName?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Selectors
  const district = useAppSelector(selectCurrentDistrict);
  const districtId = district?.id;
  const districtLoading = useAppSelector(selectAnyLocationLoading);
  
  // Create query params for initial district data fetch
  const initialQueryParams = useMemo(() => ({
    district_id: districtId
  }), [districtId]);
  
  // Use parameterized loading selector
  const districtAssessmentLoading = useAppSelector(state => selectAssessmentDistrictLoadingStatus(state, initialQueryParams));
  const stateAssessmentLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));
  
  const districtAssessmentData = useAppSelector(state => selectAssessmentDistrictData(state, initialQueryParams));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);

  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubject = useAppSelector(selectSelectedSubject);

  // Effect to sync URL with selected subject
  useEffect(() => {
    if (!subjectName && selectedSubjectId) {
      // Clear selected subject when visiting base academic page
      dispatch(setSelectedSubjectId(null));
    } else if (subjectName && districtAssessmentData.length > 0) {
      // Find the subject ID that matches the URL subject name
      const matchingSubject = districtAssessmentData.find(data => {
        const subjectDescription = data.assessment_subject?.description || '';
        const urlSafeSubjectName = encodeURIComponent(subjectDescription.toLowerCase().replace(/\s+/g, '-'));
        return urlSafeSubjectName === subjectName;
      });

      if (matchingSubject?.assessment_subject?.id) {
        dispatch(setSelectedSubjectId(matchingSubject.assessment_subject.id));
      }
    }
  }, [subjectName, districtAssessmentData, dispatch]);

  // Fetch all required data
  useEffect(() => {
    if (!districtId) return;

    // Only fetch assessment data if we have the district data
    if (district) {
      // Fetch state assessment data if not already loaded
      if (stateAssessmentLoading === LoadingState.IDLE && stateAssessmentData.length === 0) {
        dispatch(fetchAssessmentStateData({}));
      }

      // Fetch district assessment data if not already loaded
      if (districtAssessmentLoading === LoadingState.IDLE && districtAssessmentData.length === 0) {
        dispatch(setCurrentDistrictDataKey("-1"));
        dispatch(fetchAssessmentDistrictData(initialQueryParams)).then((action) => {
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
    dispatch, 
    districtId, 
    district,
    districtAssessmentLoading, 
    districtAssessmentData.length, 
    stateAssessmentLoading,
    stateAssessmentData.length, 
    initialQueryParams
  ]);

  // Show loading when any data is still loading
  const isLoading = districtLoading || districtAssessmentLoading != LoadingState.SUCCEEDED || stateAssessmentLoading != LoadingState.SUCCEEDED;

  // Filter assessment data by fiscal year and subgroup_id
  const filteredAssessmentData = filterAssessmentResults(districtAssessmentData, {
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
      <SectionTitle 
        displayName={PAGE_REGISTRY.district.academic.displayName}
        districtName={district?.name}
      />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', width: '100%' }}>
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
            <Box sx={{ flex: 1, width: { xs: '100%', sm: '100%' } }}>
              <AcademicSubjectDetails subject={selectedSubject} />
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1 }}>
              <AcademicDefaultView 
                assessmentData={districtAssessmentData} 
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