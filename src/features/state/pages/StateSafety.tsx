import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateSafetyData } from '../hooks/useStatewideData';
import { formatCount, formatSchoolYear, mergeSeries, pivotByYear, sortByYear, toSeries, YearValue } from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.safety;

/** Counts per 100 students, matching years with the safety reports' enrollment. */
const per100 = (counts: YearValue[], enrollment: YearValue[]): YearValue[] => {
  const enrolled = new Map(enrollment.map(point => [point.year, point.value]));
  return counts
    .filter(point => (enrolled.get(point.year) ?? 0) > 0)
    .map(point => ({ year: point.year, value: (point.value / enrolled.get(point.year)!) * 100 }));
};

const StateSafety: React.FC = () => {
  const { loads, truancy, bullying, incidents, restraints, seclusions, enrollment } = useStateSafetyData();
  const { status, retry } = useStateLoads(loads);

  const enrolled = useMemo(() => toSeries(enrollment, row => row.total_enrollment), [enrollment]);
  const truancyRows = useMemo(() => {
    const counts = toSeries(truancy, row => row.count);
    return mergeSeries({ students: counts, per100: per100(counts, enrolled) });
  }, [truancy, enrolled]);

  const bullyingRows = useMemo(() => {
    const anyKind = bullying.filter(row => row.bullying_type.name === 'Bullying (of any kind)');
    return mergeSeries({
      reported: toSeries(anyKind, row => row.reported),
      confirmed: toSeries(anyKind, row => row.investigated_actual),
    });
  }, [bullying]);

  const restraintRows = useMemo(() => mergeSeries({
    restraints: toSeries(restraints, row => row.generated),
    seclusions: toSeries(seclusions, row => row.generated),
  }), [restraints, seclusions]);

  // Serious incidents: one column per incident type, newest year first
  const incidentTable = useMemo(() => {
    const byYear = pivotByYear(incidents, row => row.safety_type.name, row => row.count);
    const types = [...new Set(incidents.map(row => row.safety_type.name))].sort();
    return { types, rows: sortByYear(byYear).reverse() };
  }, [incidents]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide safety data could not be loaded."
      intro="Truancy, bullying, restraint and seclusion, and serious incidents that schools report to the state at the end of each school year."
      source="NH Department of Education, School Safety Data Collection and truancy reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Truant Students"
            subtitle="(Students with ten or more half-days of unexcused absence)"
            data={truancyRows.map(row => ({ year: row.year, students: row.students }))}
            series={[{ key: 'students', name: 'Truant students' }]}
            format={formatCount}
            axisFormat={value => `${Math.round(value / 1000)}K`}
            csvName="nh-truant-students"
          />
          <TrendChart
            title="Truant Students per 100 Students"
            data={truancyRows.map(row => ({ year: row.year, per100: row.per100 }))}
            series={[{ key: 'per100', name: 'Per 100 students' }]}
            format={value => value.toFixed(1)}
            note="New Hampshire doesn't publish chronic absenteeism (missing 10% or more of school days for any reason); truancy counts only unexcused absences."
            csvName="nh-truancy-rate"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Bullying Reports"
            subtitle="(Bullying of any kind)"
            data={bullyingRows}
            series={[{ key: 'reported', name: 'Reported' }, { key: 'confirmed', name: 'Confirmed by investigation' }]}
            format={formatCount}
            csvName="nh-bullying"
          />
          <TrendChart
            title="Restraints and Seclusions"
            subtitle="(Times school staff physically held or isolated a student)"
            data={restraintRows}
            series={[{ key: 'restraints', name: 'Restraints' }, { key: 'seclusions', name: 'Seclusions' }]}
            format={formatCount}
            note="State law allows restraint and seclusion only when a student's behavior poses a substantial and imminent risk of serious bodily harm."
            csvName="nh-restraint-seclusion"
          />
        </Box>

        <Divider />

        <StateTable
          title="Serious Safety Incidents by Year"
          subtitle="(Incidents reported by schools statewide)"
          columns={[
            { key: 'year', label: 'School year', format: row => formatSchoolYear(row.year) },
            ...incidentTable.types.map(type => ({
              key: type,
              label: type,
              align: 'right' as const,
              format: (row: Record<string, number | null>) => formatCount(row[type] ?? 0),
            })),
          ]}
          rows={incidentTable.rows}
          csvName="nh-serious-safety-incidents"
        />
      </Box>
    </StatePage>
  );
};

export default StateSafety;
