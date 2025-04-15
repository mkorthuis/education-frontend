import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Divider,
} from '@mui/material';

// Define the interface for a safety incident
export interface SafetyIncident {
  id: number;
  year: number;
  school_id: number;
  count: number;
  safety_type: {
    name: string;
  };
}

export interface SchoolSafetyIncidentsTableProps {
  schoolName: string;
  incidents: SafetyIncident[];
  showDivider?: boolean;
}

const SchoolSafetyIncidentsTable: React.FC<SchoolSafetyIncidentsTableProps> = ({
  schoolName,
  incidents,
  showDivider = false
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      width: '100%'
    }}>
      <Box sx={{ 
        maxWidth: theme => ({
          md: '100%',
          lg: '90%',
          xl: '70%'
        }),
        width: '100%'
      }}>
        {showDivider && <Divider sx={{ my: 3 }} />}
        {/* Centered school name */}
        <Typography 
          variant="body1" 
          sx={{
            textAlign: "center",
            width: "100%",
            mb: 1,
            fontWeight: 'medium'
          }}
        >
          {schoolName}
        </Typography>
        
        {/* Left-aligned table */}
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Table size="small">
            <TableHead sx={{ 
              backgroundColor: 'grey.200',
              '& th': {
                borderBottom: '2px solid',
                borderColor: 'grey.400',
              }
            }}>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Incident Type</TableCell>
                <TableCell align="right"># of Incidents</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents && incidents.length > 0 ? (
                incidents
                  .slice() // Create a copy to avoid mutating the original array
                  .sort((a, b) => b.year - a.year) // Sort by year in descending order
                  .map((incident, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{incident.year}</TableCell>
                    <TableCell>{incident.safety_type.name}</TableCell>
                    <TableCell align="right">{incident.count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">No incidents reported</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SchoolSafetyIncidentsTable; 