import React, { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateEnrollmentData } from '../hooks/useStatewideData';
import { formatCount, formatSchoolYear, mergeSeries, toSeries } from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.enrollment;
const GRADE_CHANGE_YEARS = 5;

const LEVELS = [
  { key: 'elementary', name: 'Elementary' },
  { key: 'middle', name: 'Middle' },
  { key: 'high', name: 'High' },
] as const;

const formatThousands = (value: number) => `${Math.round(value / 1000)}K`;

const StateEnrollment: React.FC = () => {
  const { loads, adm, byGrade } = useStateEnrollmentData();
  const { status, retry } = useStateLoads(loads);

  const total = useMemo(() => toSeries(adm, row => row.total).map(point => ({ year: point.year, total: point.value })), [adm]);
  const byLevel = useMemo(() => mergeSeries(Object.fromEntries(LEVELS.map(level => [level.key, toSeries(adm, row => row[level.key])]))), [adm]);

  // Students entering (kindergarten) and leaving (grade 12) each year
  const entering = useMemo(() => {
    const gradeSeries = (name: string) => toSeries(byGrade.filter(row => row.grade?.name === name), row => row.total_enrollment);
    return mergeSeries({ kindergarten: gradeSeries('Kindergarten'), grade12: gradeSeries('Grade 12') });
  }, [byGrade]);

  const gradeTable = useMemo(() => {
    if (!byGrade.length) return { year: null as number | null, compareYear: null as number | null, rows: [] };
    const year = Math.max(...byGrade.map(row => row.year));
    const compareYear = year - GRADE_CHANGE_YEARS;
    const count = (gradeId: number, forYear: number) =>
      byGrade.find(row => row.grade_id === gradeId && row.year === forYear)?.total_enrollment ?? null;
    const rows = byGrade
      .filter(row => row.year === year)
      .sort((a, b) => a.grade_id - b.grade_id)
      .map(row => {
        const earlier = count(row.grade_id, compareYear);
        return {
          grade: row.grade?.name ?? String(row.grade_id),
          students: row.total_enrollment,
          earlier,
          change: earlier ? ((row.total_enrollment - earlier) / earlier) * 100 : null,
        };
      });
    return { year, compareYear, rows };
  }, [byGrade]);

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide enrollment data could not be loaded."
      intro="How many students New Hampshire's public schools serve, and how that is changing grade by grade."
      source="NH Department of Education, average daily membership and town enrollment by grade reports"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Public School Students"
            subtitle="(Average daily membership)"
            data={total}
            series={[{ key: 'total', name: 'Students' }]}
            format={formatCount}
            axisFormat={formatThousands}
            note="Average daily membership is the average number of students enrolled over the school year; it is what cost per student is based on."
            csvName="nh-students"
          />
          <TrendChart
            title="Students by School Level"
            subtitle="(Average daily membership)"
            data={byLevel}
            series={[...LEVELS]}
            format={formatCount}
            axisFormat={formatThousands}
            csvName="nh-students-by-level"
          />
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
          <TrendChart
            title="Students Starting and Finishing School"
            subtitle="(October 1 enrollment in kindergarten and grade 12)"
            data={entering}
            series={[{ key: 'kindergarten', name: 'Kindergarten' }, { key: 'grade12', name: 'Grade 12' }]}
            format={formatCount}
            axisFormat={formatThousands}
            note="When the kindergarten class is smaller than the graduating class, total enrollment falls as those classes move through school."
            csvName="nh-kindergarten-grade-12"
          />
          <StateTable
            title={gradeTable.year ? `Enrollment by Grade, ${formatSchoolYear(gradeTable.year)}` : 'Enrollment by Grade'}
            subtitle="(October 1 enrollment of students living in New Hampshire towns)"
            columns={[
              { key: 'grade', label: 'Grade' },
              { key: 'students', label: 'Students', align: 'right', format: row => formatCount(row.students) },
              {
                key: 'earlier',
                label: gradeTable.compareYear ? formatSchoolYear(gradeTable.compareYear) : 'Earlier',
                align: 'right',
                format: row => formatCount(row.earlier),
              },
              {
                key: 'change',
                label: 'Change',
                align: 'right',
                format: row => (row.change === null ? '—' : `${row.change > 0 ? '+' : ''}${row.change.toFixed(0)}%`),
              },
            ]}
            rows={gradeTable.rows}
            csvName={`nh-enrollment-by-grade-${gradeTable.year ?? ''}`}
          />
        </Box>
      </Box>
    </StatePage>
  );
};

export default StateEnrollment;
