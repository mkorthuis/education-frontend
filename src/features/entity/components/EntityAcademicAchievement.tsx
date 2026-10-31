import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAnyLocationLoading } from '@/store/slices/locationSlice';
import {
  setSelectedSubjectId,
  selectSelectedSubjectId,
  selectSelectedSubject,
  fetchAssessmentStateData,
  selectCurrentAssessmentStateData,
  AssessmentDataQueryKey,
  selectAssessmentStateLoadingStatus,
  resetFailedAssessmentLoad
} from '@/store/slices/assessmentSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import EntityMeasurementCard from './academic/EntityMeasurementCard';
import EntityAcademicSubjectDetails from './academic/EntityAcademicSubjectDetails';
import AcademicDefaultView from '@/components/ui/academic/AcademicDefaultView';
import { filterAssessmentResults, ALL_GRADES_ID } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState } from '@/store/slices/safetySlice';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { EntityKind, SELECT_CURRENT_ENTITY } from '@/features/entity/entity';
import { ASSESSMENT, EntityAssessmentData, EntityAssessmentParams, dispatchEntityAssessmentFetch } from '@/features/entity/bindings/assessment';

const EntityAcademicAchievement: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { subjectName } = useParams<{ subjectName?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const assessment = ASSESSMENT[kind];

  // Selectors
  const entity = useAppSelector(SELECT_CURRENT_ENTITY[kind]);
  const entityId = entity?.id;
  const entityLoading = useAppSelector(selectAnyLocationLoading);
  
  // Create query params for initial entity data fetch
  // (school_id is a string, district_id a number or undefined)
  const initialQueryParams: EntityAssessmentParams = useMemo(() => assessment.initialParams(entityId), [assessment, entityId]);
  
  // Use parameterized loading selector
  const entityAssessmentLoading = useAppSelector(state => assessment.selectLoading(state, initialQueryParams));
  const stateAssessmentLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));
  
  const entityAssessmentData = useAppSelector(state => assessment.selectData(state, initialQueryParams));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);

  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubject = useAppSelector(selectSelectedSubject);

  // Effect to sync URL with selected subject
  useEffect(() => {
    if (!subjectName && selectedSubjectId) {
      // Clear selected subject when visiting base academic page
      dispatch(setSelectedSubjectId(null));
    } else if (subjectName && entityAssessmentData.length > 0) {
      // Find the subject ID that matches the URL subject name
      const matchingSubject = entityAssessmentData.find(data => {
        const subjectDescription = data.assessment_subject?.description || '';
        const urlSafeSubjectName = encodeURIComponent(subjectDescription.toLowerCase().replace(/\s+/g, '-'));
        return urlSafeSubjectName === subjectName;
      });

      if (matchingSubject?.assessment_subject?.id) {
        dispatch(setSelectedSubjectId(matchingSubject.assessment_subject.id));
      }
    }
  }, [subjectName, entityAssessmentData, dispatch]);

  // Fetch assessment data when the entity is available
  useEffect(() => {
    if (entityId) {
      // Fetch state assessment data if not already loaded
      if (stateAssessmentLoading === LoadingState.IDLE && stateAssessmentData.length === 0) {
        dispatch(fetchAssessmentStateData({}));
      }

      // Fetch entity assessment data if not already loaded
      if (entityAssessmentLoading === LoadingState.IDLE && entityAssessmentData.length === 0) {
        dispatch(assessment.setCurrentKey("-1"));
        dispatchEntityAssessmentFetch(dispatch, kind, initialQueryParams).then((action) => {
          // After fetching is complete, set the current entity data key manually
          if (action.meta.requestStatus === 'fulfilled') {
            // Type assertion to access the payload properly
            const payload = action.payload as { 
              key: AssessmentDataQueryKey; 
              params: any; 
              data: EntityAssessmentData[] 
            };
            dispatch(assessment.setCurrentKey(payload.key));
          }
        });
      }
    }
  }, [
    dispatch, kind, assessment, entityId,
    // The district page also re-runs this effect when the district object changes.
    kind === 'district' ? entity : undefined,
    entityAssessmentLoading, 
    entityAssessmentData.length, stateAssessmentLoading,
    stateAssessmentData.length, initialQueryParams
  ]);

  // Show loading when any data is still loading
  const isLoading = entityLoading || entityAssessmentLoading !== LoadingState.SUCCEEDED || stateAssessmentLoading !== LoadingState.SUCCEEDED;

  // Show an error with a retry instead of loading forever when an assessment request failed
  const hasLoadError = !entityLoading && !!entityId && (entityAssessmentLoading === LoadingState.FAILED || stateAssessmentLoading === LoadingState.FAILED);

  // Reset only the failed requests to IDLE so the fetch effect above requests them again
  const handleRetry = () => {
    dispatch(resetFailedAssessmentLoad({ category: assessment.resetCategory, params: initialQueryParams }));
    dispatch(resetFailedAssessmentLoad({ category: 'state', params: {} }));
  };

  // Filter assessment data by the card-list year and subgroup_id
  // (school: FISCAL_YEAR, district: ASSESSMENT_YEAR)
  const filteredAssessmentData = filterAssessmentResults<EntityAssessmentData>(entityAssessmentData, {
    year: assessment.cardListYear,
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
        displayName={PAGE_REGISTRY[kind].academic.displayName}
        schoolName={kind === 'school' ? entity?.name : undefined}
        districtName={kind === 'district' ? entity?.name : undefined}
      />
      {hasLoadError ? (
        <Box sx={{ my: 4 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            Assessment data could not be loaded.
          </Alert>
        </Box>
      ) : isLoading ? (
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
              <EntityMeasurementCard
                kind={kind}
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
              <EntityAcademicSubjectDetails kind={kind} subject={selectedSubject} />
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1 }}>
              <AcademicDefaultView 
                assessmentData={entityAssessmentData} 
                fiscalYear={assessment.cardListYear} 
              />
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default EntityAcademicAchievement;
