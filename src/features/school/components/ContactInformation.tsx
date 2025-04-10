import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography,  Divider, CircularProgress, Link as MuiLink, Paper, Grid } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {  sortStaffByTypeAndName } from '@/utils/formatting';
import { 
  selectCurrentSchool, 
  selectSchoolLoading, 
  selectLocationError,
  fetchAllSchoolData,
  selectCurrentSau
} from '@/store/slices/locationSlice';
import SectionTitle from '@/components/ui/SectionTitle';

const ContactInformation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const sau = useAppSelector(selectCurrentSau);
  const school = useAppSelector(selectCurrentSchool);
  const schoolLoading = useAppSelector(selectSchoolLoading);
  const error = useAppSelector(selectLocationError);

  // Load school data if it's not already loaded
  useEffect(() => {
    if(id && !schoolLoading && !school) {
      dispatch(fetchAllSchoolData(parseInt(id)));
    }
  }, [id, school, schoolLoading, dispatch]);

  const getSauAddress = () => {
    if (!sau) return 'SAU Address information not available';
    const parts = [sau.address1, sau.address2, sau.town, sau.state, sau.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'SAU Address information not available';
  };

  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) {
      return 'SAU phone information not available';
    }
    if (phone.length === 8 && phone.includes('-')) { 
      return `603-${phone}`;
    }
    return phone;
  };

  const getSchoolAddress = () => {
    if (!school) return 'School address information not available';
    
    const addressParts = [school.address1, school.address2, school.city, school.state, school.zip].filter(Boolean);
    
    if (addressParts.length === 0) {
      return 'School address information not available';
    }
    
    return (
      <>
        {school.address1 && <span>{school.address1}<br /></span>}
        {school.address2 && <span>{school.address2}<br /></span>}
        {(school.city || school.state || school.zip) && (
          <span>
            {school.city}{school.city && school.state ? ', ' : ''}{school.state} {school.zip}
          </span>
        )}
      </>
    );
  };

  if (schoolLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading contact information: {error}</Typography>
      </Box>
    );
  }

  if (!school) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No school contact information found.</Typography>
      </Box>
    );
  }

  return (
    <>
      <SectionTitle>
        {school.name}
      </SectionTitle>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body1" sx={{fontWeight: 'bold'}}>Contact Information</Typography>
        <Typography variant="body1" >{getSchoolAddress()}</Typography>
        <Typography variant="body1" gutterBottom>{school.phone}</Typography>
        <Typography variant="body1" sx={{fontWeight: 'bold'}} >Principal</Typography>
        <Typography variant="body1" >{school.principal_first_name} {school.principal_last_name}</Typography>
        <Typography variant="body1" gutterBottom><a href={`mailto:${school.email}`}>{school.email}</a></Typography>
        <Typography variant="body1" sx={{fontWeight: 'bold'}}>School Website</Typography>
        <Typography variant='body1'>{school.webpage ? (
              <a href={school.webpage} target="_blank" rel="noopener noreferrer">
                {school.webpage}
              </a>
            ) : (
              'Coming Soon'
            )}
        </Typography>
        <Divider sx={{ my: 2 }} />
        {sau && (
        <>
          <Typography variant="h5" gutterBottom>
            Administration
          </Typography>
          <Typography variant="body1" sx={{fontWeight: 'bold'}}>
            {sau.name ? `${sau.name}` : ''} (SAU #{sau.id})
          </Typography>
          <Typography variant="body1" >{getSauAddress()}</Typography>
          <Typography variant="body1" >{formatPhoneNumber(sau.phone)}</Typography>
          {sau.webpage ? (<MuiLink href={sau.webpage} target="_blank" rel="noopener noreferrer">
                    {sau.webpage}
                  </MuiLink>) : ''}

          <Typography variant="body1" sx={{fontWeight: 'bold'}}>Key Staff</Typography>
          {sau.staff && sau.staff.length > 0 ? (
            <>
              {sortStaffByTypeAndName(sau.staff)
                .map((staffMember) => (
                  <>
                    <Typography variant="body1">{`${staffMember.first_name} ${staffMember.last_name} - ${staffMember.title}`}</Typography>
                    <MuiLink href={`mailto:${staffMember.email}`}>{staffMember.email}</MuiLink>
                  </>
                ))}
            </>
          ) : (
            <Typography variant="body2">SAU staff information not available.</Typography>
          )}
        </>
      )}
      </Box>
    </>
  );
};

export default ContactInformation; 