import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSchool,
  selectAnyLocationLoading
} from '@/store/slices/locationSlice';
import {
  fetchAssessmentSchoolData,
  setSelectedSubjectId,
  selectSelectedSubjectId,
  selectSelectedSubject,
  fetchAssessmentStateData,
  selectCurrentAssessmentStateData,
  setCurrentSchoolDataKey,
  AssessmentSchoolData,
  AssessmentDataQueryKey,
  selectAssessmentSchoolLoadingStatus,
  selectAssessmentStateLoadingStatus,
  selectAssessmentSchoolData
} from '@/store/slices/assessmentSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import MeasurementCard from '@/features/school/components/academic/MeasurementCard';
import AcademicSubjectDetails from '@/features/school/components/academic/AcademicSubjectDetails';
import AcademicDefaultView from '@/features/school/components/academic/AcademicDefaultView';
import { filterAssessmentResults, ALL_GRADES_ID } from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { LoadingState } from '@/store/slices/safetySlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const AcademicAchievement: React.FC = () => {
  const { subjectName } = useParams<{ subjectName?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Selectors
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectAnyLocationLoading);
  
  // Create query params for initial school data fetch
  const initialQueryParams = useMemo(() => ({
    school_id: school?.id.toString() || ''
  }), [school?.id]);
  
  // Use parameterized loading selector
  const schoolAssessmentLoading = useAppSelector(state => selectAssessmentSchoolLoadingStatus(state, initialQueryParams));
  const stateAssessmentLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));
  
  const schoolAssessmentData = useAppSelector(state => selectAssessmentSchoolData(state, initialQueryParams));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);

  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubject = useAppSelector(selectSelectedSubject);

  // Effect to sync URL with selected subject
  useEffect(() => {
    if (!subjectName && selectedSubjectId) {
      // Clear selected subject when visiting base academic page
      dispatch(setSelectedSubjectId(null));
    } else if (subjectName && schoolAssessmentData.length > 0) {
      // Find the subject ID that matches the URL subject name
      const matchingSubject = schoolAssessmentData.find(data => {
        const subjectDescription = data.assessment_subject?.description || '';
        const urlSafeSubjectName = encodeURIComponent(subjectDescription.toLowerCase().replace(/\s+/g, '-'));
        return urlSafeSubjectName === subjectName;
      });

      if (matchingSubject?.assessment_subject?.id) {
        dispatch(setSelectedSubjectId(matchingSubject.assessment_subject.id));
      }
    }
  }, [subjectName, schoolAssessmentData, dispatch]);

  // Fetch assessment data when school is available
  useEffect(() => {
    if (school?.id) {
      // Fetch state assessment data if not already loaded
      if (stateAssessmentLoading === LoadingState.IDLE && stateAssessmentData.length === 0) {
        dispatch(fetchAssessmentStateData({}));
      }

      // Fetch school assessment data if not already loaded
      if (schoolAssessmentLoading === LoadingState.IDLE && schoolAssessmentData.length === 0) {
        dispatch(setCurrentSchoolDataKey("-1"));
        dispatch(fetchAssessmentSchoolData(initialQueryParams)).then((action) => {
          // After fetching is complete, set the current school data key manually
          if (action.meta.requestStatus === 'fulfilled') {
            // Type assertion to access the payload properly
            const payload = action.payload as { 
              key: AssessmentDataQueryKey; 
              params: any; 
              data: AssessmentSchoolData[] 
            };
            dispatch(setCurrentSchoolDataKey(payload.key));
          }
        });
      }
    }
  }, [
    dispatch, school?.id, schoolAssessmentLoading, 
    schoolAssessmentData.length, stateAssessmentLoading,
    stateAssessmentData.length, initialQueryParams
  ]);

  // Show loading when any data is still loading
  const isLoading = schoolLoading || schoolAssessmentLoading !== LoadingState.SUCCEEDED || stateAssessmentLoading !== LoadingState.SUCCEEDED;

  // Filter assessment data by fiscal year and subgroup_id
  const filteredAssessmentData = filterAssessmentResults(schoolAssessmentData, {
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
        displayName={PAGE_REGISTRY.school.academic.displayName}
        schoolName={school?.name}
      />    
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
                assessmentData={schoolAssessmentData} 
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