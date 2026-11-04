import React, { useMemo, useState } from 'react';
import { Box, Divider, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable, { StateTableColumn } from '../components/StateTable';
import TrendChart from '../components/TrendChart';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateAssessmentData } from '../hooks/useStatewideData';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  ASSESSMENT_CHANGE_YEARS,
  formatPercent,
  formatSchoolYear,
  latestAssessmentYear,
  proficiencyByGrade,
  proficiencyBySubgroup,
  proficiencyBySubject,
  ProficiencyTableRow,
  SUBJECTS,
} from '../utils/stateMetrics';

const PAGE = PAGE_REGISTRY.state.academic;

const subjectColumns = (firstLabel: string): StateTableColumn<ProficiencyTableRow>[] => [
  { key: 'name', label: firstLabel },
  ...SUBJECTS.map(subject => ({
    key: subject.key,
    label: subject.name,
    align: 'right' as const,
    format: (row: ProficiencyTableRow) => (row[subject.key] === null ? '—' : formatPercent(row[subject.key])),
  })),
];

const StateAcademics: React.FC = () => {
  const { loads, assessments, subgroups } = useStateAssessmentData();
  const { status, retry } = useStateLoads(loads);
  const [subgroupId, setSubgroupId] = useState(ALL_STUDENTS_SUBGROUP_ID);

  // All students first, then the API's (alphabetical) order
  const orderedSubgroups = useMemo(
    () => [...subgroups].sort((a, b) => Number(b.id === ALL_STUDENTS_SUBGROUP_ID) - Number(a.id === ALL_STUDENTS_SUBGROUP_ID)),
    [subgroups]
  );
  const latestYear = useMemo(() => latestAssessmentYear(assessments), [assessments]);
  const trend = useMemo(() => proficiencyBySubject(assessments, subgroupId), [assessments, subgroupId]);
  const bySubgroup = useMemo(
    () => (latestYear ? proficiencyBySubgroup(assessments, latestYear, orderedSubgroups) : []),
    [assessments, latestYear, orderedSubgroups]
  );
  const byGrade = useMemo(() => {
    if (!latestYear) return [];
    const grades = new Map<number, string>();
    assessments.forEach(row => {
      if (row.year === latestYear && row.grade_id !== null) grades.set(row.grade_id, row.grade_name ?? `Grade id ${row.grade_id}`);
    });
    return proficiencyByGrade(assessments, latestYear, [...grades].map(([id, name]) => ({ id, name })));
  }, [assessments, latestYear]);

  const subgroupName = orderedSubgroups.find(subgroup => subgroup.id === subgroupId)?.name ?? 'All students';
  const yearText = latestYear ? formatSchoolYear(latestYear) : '';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide assessment data could not be loaded."
      intro="The share of students scoring proficient or above on the state's tests in math, reading and science. Students take them in grades 3 through 8, with the SAT in grade 11; science is tested in grades 5, 8 and 11."
      source="NH Department of Education, statewide assessment results"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl size="small" sx={{ maxWidth: 320 }}>
          <InputLabel id="state-subgroup-label">Student group</InputLabel>
          <Select
            labelId="state-subgroup-label"
            label="Student group"
            value={subgroupId}
            onChange={event => setSubgroupId(Number(event.target.value))}
          >
            {orderedSubgroups.map(subgroup => (
              <MenuItem key={subgroup.id} value={subgroup.id}>{subgroup.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TrendChart
          title={`Percent Proficient by Year: ${subgroupName}`}
          subtitle="(All tested grades)"
          data={trend}
          series={SUBJECTS.map(subject => ({ key: subject.key, name: subject.name }))}
          format={value => formatPercent(value)}
          yDomain={[0, 100]}
          markers={ASSESSMENT_CHANGE_YEARS.map(year => ({ year, label: 'New test' }))}
          note="The state changed tests in 2015 and again in 2018, so scores before and after those years aren't directly comparable. No tests were given in spring 2020. Groups with too few students to report are left out."
          csvName={`nh-proficiency-${subgroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        />

        <Divider />

        <StateTable
          title={`Percent Proficient by Student Group, ${yearText}`}
          subtitle="(All tested grades; — means too few students to report)"
          columns={subjectColumns('Student group')}
          rows={bySubgroup}
          csvName={`nh-proficiency-by-group-${latestYear ?? ''}`}
        />

        <Divider />

        <StateTable
          title={`Percent Proficient by Grade, ${yearText}`}
          subtitle="(All students)"
          columns={subjectColumns('Grade')}
          rows={byGrade}
          csvName={`nh-proficiency-by-grade-${latestYear ?? ''}`}
        />
      </Box>
    </StatePage>
  );
};

export default StateAcademics;
