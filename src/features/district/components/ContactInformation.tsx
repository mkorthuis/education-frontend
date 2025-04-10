import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, Link as MuiLink, CircularProgress, Grid } from '@mui/material';
import {  Phone, Web, LocationOn, Person, School as SchoolIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentSau, 
  selectCurrentSchools, 
  selectCurrentDistrict,
  selectLocationLoading, 
  selectLocationError,
  fetchAllDistrictData
} from '@/store/slices/locationSlice';
import { formatGradesDisplay, sortStaffByTypeAndName } from '@/utils/formatting';
import SectionTitle from '@/components/ui/SectionTitle';

const ContactInformation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const sau = useAppSelector(selectCurrentSau);
  const schools = useAppSelector(selectCurrentSchools);
  const district = useAppSelector(selectCurrentDistrict);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);

  // Load district data if it's not already loaded
  useEffect(() => {
    if (id && !district && !loading) {
      dispatch(fetchAllDistrictData(parseInt(id)));
    }
  }, [id, district, loading, dispatch]);

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

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading contact information: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
        {sau && (
          <>
            <SectionTitle>
              Administration Contact Details
            </SectionTitle>
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
            <Divider sx={{ my: 2 }} />
          </>
        )}
    
        <Typography variant="h5" gutterBottom>School Board</Typography>
        <Typography variant="body1" >Information regarding the School Board is not currently available. Please refer to your SAU or District website for details.</Typography>

        <Divider sx={{ my: 2}} />
        <Typography variant="h5" gutterBottom>Schools</Typography>
        <Typography variant="body1" gutterBottom>Click a school below to view contact information.</Typography>
        <Box sx={{ mb: 4 }}>
          {schools.map((school) => {
            const gradesDisplay = formatGradesDisplay(school);
            
            return (
              <Typography key={school.id} variant="body1">
                <Link to={`/school/${school.id}/contact`} style={{ textDecoration: 'none', color: 'primary.main' }}>
                  {school.name}
                </Link>
                {gradesDisplay && ` (${gradesDisplay})`}
              </Typography>
            );
          })}
        </Box>
    </>
  );
};

export default ContactInformation; 