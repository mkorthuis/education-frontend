import React, { useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as staffSlice from '@/store/slices/staffSlice';
import { useParams } from 'react-router-dom';
import { FISCAL_YEAR } from '@/utils/environment';

const TeacherSalaryBand: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  const formattedFiscalYear = `${(defaultFiscalYear - 1).toString().slice(-2)}/${defaultFiscalYear.toString().slice(-2)}`;

  // Get teacher salary band data
  const districtTeacherSalaryBandData = useAppSelector(state => 
    staffSlice.selectDistrictTeacherSalaryBandData(state, districtParams));
  const teacherSalaryBandTypes = useAppSelector(staffSlice.selectTeacherSalaryBandTypes);

  // Process data for the table
  const tableData = useMemo(() => {
    const currentYear = defaultFiscalYear;

    // Create rows for each teacher salary band
    return teacherSalaryBandTypes.map(band => {
      const currentItem = districtTeacherSalaryBandData.find(
        item => item.year === currentYear && 
        item.salary_band_type.id === band.id
      );

      return {
        name: band.name,
        description: band.description,
        min: currentItem?.min_salary || 0,
        max: currentItem?.max_salary || 0,
        steps: currentItem?.steps || 0
      };
    });
  }, [districtTeacherSalaryBandData, teacherSalaryBandTypes, defaultFiscalYear]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: isMobile ? 'center' : 'flex-start',
        mb: 2,
        width: '100%'
      }}>
        <Typography 
          variant={isMobile ? "h6" : "body1"} 
          sx={{ 
            textAlign: isMobile ? "center" : "left",
            width: "100%",
            fontWeight: 'medium',
            fontSize: isMobile ? '1.25rem' : 'inherit'
          }} 
        >
          {isMobile ? `${formattedFiscalYear} Teacher Salary Bands` : 'Teacher Salary Bands'}
        </Typography>
        {!isMobile && (
          <Typography        
            variant="body2" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium',
              fontStyle: 'italic',
              color: 'text.secondary'
            }}
          >
            (For {formattedFiscalYear})
          </Typography>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell>Salary Band</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell align="right">Steps</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  {isMobile ? row.name : row.description}
                </TableCell>
                <TableCell align="right">
                  {row.min === 0 && row.max === 0 && row.steps === 0 ? 'N/A' : `$${row.min.toLocaleString()}`}
                </TableCell>
                <TableCell align="right">
                  {row.min === 0 && row.max === 0 && row.steps === 0 ? 'N/A' : `$${row.max.toLocaleString()}`}
                </TableCell>
                <TableCell align="right">
                  {row.min === 0 && row.max === 0 && row.steps === 0 ? 'N/A' : row.steps}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TeacherSalaryBand; 