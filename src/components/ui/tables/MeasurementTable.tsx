import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Measurement } from '@/store/slices/measurementSlice';

interface MeasurementTableProps {
  data: Measurement[];
}

/**
 * A reusable table component for displaying measurement data
 * Can be used across different features that display measurements
 */
const MeasurementTable: React.FC<MeasurementTableProps> = ({ data }) => {
  return (
    <TableContainer>
      <Table aria-label="measurement data">
        <TableHead>
          <TableRow>
            <TableCell><strong>Measurement Type</strong></TableCell>
            <TableCell><strong>Year</strong></TableCell>
            <TableCell align="right"><strong>Value</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((measurement) => (
            <TableRow key={measurement.id}>
              <TableCell>{measurement.measurement_type.name || `Type ${measurement.measurement_type.id}`}</TableCell>
              <TableCell>{measurement.year}</TableCell>
              <TableCell align="right">{measurement.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MeasurementTable; 