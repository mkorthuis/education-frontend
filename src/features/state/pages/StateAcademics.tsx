import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Divider, FormControl, InputLabel, ListSubheader, MenuItem, Select } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable, { StateTableColumn } from '../components/StateTable';
import TrendChart, { ENTITY_COLORS } from '../components/TrendChart';
import KeyFigures, { KeyFigure } from '../components/KeyFigures';
import { useStateLoads } from '../hooks/useStateLoads';
import { useStateAssessmentData } from '../hooks/useStatewideData';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  ASSESSMENT_CHANGE_YEARS,
  changeSince,
  formatPercent,
  formatSchoolYear,
  latestAssessmentYear,
  NO_TEST_YEAR,
  proficiencyByGrade,
  proficiencyBySubgroup,
  proficiencyBySubject,
  ProficiencyTableRow,
  SUBJECTS,
  toSeries,
  withEmptyYears,
} from '../utils/stateMetrics';
import { groupSubgroups } from '../utils/labels';
import { shortYear, tileDelta } from '../utils/phrases';

const PAGE = PAGE_REGISTRY.state.academic;
// The current state test (the NH SAS) began in 2017-18
const CURRENT_TEST_FIRST_YEAR = 2018;
const TABLE_WIDTH = 720;

const SUBJECT_SERIES = SUBJECTS.map(subject => ({ key: subject.key, name: subject.name, color: ENTITY_COLORS[subject.key] }));

type SubgroupRow = ProficiencyTableRow & { section: string };

const subjectColumns = <T extends ProficiencyTableRow>(firstLabel: string): StateTableColumn<T>[] => [
  { key: 'name', label: firstLabel },
  ...SUBJECTS.map(subject => ({
    key: subject.key,
    label: subject.name,
    align: 'right' as const,
    format: (row: T) => (row[subject.key] === null ? '—' : formatPercent(row[subject.key])),
  })),
];

const StateAcademics: React.FC = () => {
  const { loads, assessments, subgroups } = useStateAssessmentData();
  const { status, retry } = useStateLoads(loads);
  const [searchParams, setSearchParams] = useSearchParams();

  // Only groups with results; in the picker's order, with plain names
  const grouped = useMemo(() => {
    const withResults = new Set(
      assessments.filter(row => row.grade_id === null && row.above_proficient_percentage !== null).map(row => row.assessment_subgroup_id)
    );
    return groupSubgroups(subgroups.filter(subgroup => withResults.has(subgroup.id)));
  }, [assessments, subgroups]);
  const options = useMemo(() => grouped.flatMap(section => section.items.map(item => ({ ...item, section: section.section }))), [grouped]);

  // The chosen group is kept in the address (?group=9), so a view can be shared
  const requested = Number(searchParams.get('group'));
  const subgroupId = options.some(option => option.id === requested) ? requested : ALL_STUDENTS_SUBGROUP_ID;
  const subgroupLabel = options.find(option => option.id === subgroupId)?.label ?? 'All students';
  const isAllStudents = subgroupId === ALL_STUDENTS_SUBGROUP_ID;
  const chooseGroup = (id: number) => {
    const next = new URLSearchParams(searchParams);
    if (id === ALL_STUDENTS_SUBGROUP_ID) next.delete('group'); else next.set('group', String(id));
    setSearchParams(next, { replace: true });
  };

  const latestYear = useMemo(() => latestAssessmentYear(assessments), [assessments]);
  const subjectKeys = SUBJECTS.map(subject => subject.key);
  const allStudents = useMemo(() => proficiencyBySubject(assessments, ALL_STUDENTS_SUBGROUP_ID), [assessments]);
  const trend = useMemo(
    () => withEmptyYears(proficiencyBySubject(assessments, subgroupId), [NO_TEST_YEAR], subjectKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assessments, subgroupId]
  );
  const bySubgroup = useMemo<SubgroupRow[]>(() => {
    if (!latestYear) return [];
    const rows = proficiencyBySubgroup(assessments, latestYear, options.map(option => ({ id: option.id, name: option.label })));
    return rows.map(row => ({ ...row, section: options.find(option => option.id === row.id)?.section ?? '' }));
  }, [assessments, latestYear, options]);
  const byGrade = useMemo(() => {
    if (!latestYear) return [];
    const grades = new Map<number, string>();
    assessments.forEach(row => {
      if (row.year === latestYear && row.grade_id !== null) grades.set(row.grade_id, row.grade_name ?? `Grade id ${row.grade_id}`);
    });
    return proficiencyByGrade(assessments, latestYear, [...grades].map(([id, name]) => ({ id, name })));
  }, [assessments, latestYear]);

  // Key figures for the chosen group, with all students alongside when it's a smaller group
  const keyFigures = useMemo(() => {
    const groupLatest = trend.find(row => row.year === latestYear);
    const allLatest = allStudents.find(row => row.year === latestYear);
    if (!latestYear || !groupLatest) return { figures: [] as KeyFigure[], takeaway: [] as string[] };
    const figures: KeyFigure[] = SUBJECTS.filter(subject => typeof groupLatest[subject.key] === 'number').map(subject => {
      const series = toSeries(trend, row => row[subject.key]).filter(point => point.year >= CURRENT_TEST_FIRST_YEAR);
      const change = changeSince(series, 10);
      // Share at the highest of the four levels, which the district pages call "above proficient"
      const topLevel = assessments.find(row => row.year === latestYear && row.grade_id === null
        && row.assessment_subgroup_id === subgroupId && row.assessment_subject_id === subject.id)?.level_4_percentage;
      const details = [
        typeof topLevel === 'number' ? `${formatPercent(topLevel)} at the highest level (4 of 4)` : null,
        !isAllStudents && typeof allLatest?.[subject.key] === 'number' ? `All students: ${formatPercent(allLatest[subject.key])}` : null,
      ].filter(Boolean);
      return {
        label: `Proficient in ${subject.name}`,
        value: formatPercent(groupLatest[subject.key]),
        period: shortYear(latestYear),
        delta: tileDelta(change, { unit: 'points', higherIsBetter: true }),
        detail: details.length ? details.join('; ') : undefined,
      };
    });
    // "In 2025-26, 44% of students were proficient in math, 55% in reading and 38% in science."
    const scores = SUBJECTS.filter(subject => typeof groupLatest[subject.key] === 'number')
      .map(subject => ({ value: formatPercent(groupLatest[subject.key]), subject: subject.name.toLowerCase() }));
    const rest = scores.slice(1).map(score => `${score.value} in ${score.subject}`);
    const others = rest.length > 1 ? `, ${rest.slice(0, -1).join(', ')} and ${rest[rest.length - 1]}` : rest.length ? ` and ${rest[0]}` : '';
    const takeaway = !scores.length ? [] : isAllStudents
      ? [`In ${formatSchoolYear(latestYear)}, ${scores[0].value} of students were proficient in ${scores[0].subject}${others}.`]
      : [`${subgroupLabel}, ${formatSchoolYear(latestYear)}: ${scores[0].value} proficient in ${scores[0].subject}${others}.`];
    if (!isAllStudents && allLatest && typeof allLatest.math === 'number' && typeof groupLatest.math === 'number') {
      const gap = Math.round(groupLatest.math) - Math.round(allLatest.math);
      const gapText = gap === 0 ? 'the same as' : `${Math.abs(gap)} point${Math.abs(gap) === 1 ? '' : 's'} ${gap < 0 ? 'below' : 'above'}`;
      takeaway.push(`For comparison, ${formatPercent(allLatest.math)} of all students were proficient in math, so this group is ${gapText} all students.`);
    }
    return { figures, takeaway };
  }, [trend, allStudents, assessments, subgroupId, latestYear, isAllStudents, subgroupLabel]);

  const yearText = latestYear ? formatSchoolYear(latestYear) : '';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide assessment data could not be loaded."
      intro="The share of students scoring proficient or above on the state's tests in math, reading and science, meaning they met or exceeded the grade-level standard (level 3 or 4 of 4). Students take the tests in grades 3 through 8, with the SAT in grade 11; science is tested in grades 5, 8 and 11."
      keyFigures={(
        <>
          {/* The group picker comes first: it changes the key figures as well as the chart */}
          <FormControl size="small" sx={{ maxWidth: 400, mb: 3, display: 'flex' }}>
            <InputLabel id="state-subgroup-label">Student group</InputLabel>
            <Select
              labelId="state-subgroup-label"
              label="Student group"
              value={options.length ? subgroupId : ''}
              onChange={event => chooseGroup(Number(event.target.value))}
            >
              {grouped.flatMap(section => [
                ...(section.section === 'All students' ? [] : [<ListSubheader key={`header-${section.section}`}>{section.section}</ListSubheader>]),
                ...section.items.map(item => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>),
              ])}
            </Select>
          </FormControl>
          <KeyFigures takeaway={keyFigures.takeaway} figures={keyFigures.figures} />
        </>
      )}
      districtSection="academic"
      notCovered="Comparisons with other states (the national NAEP test), the state's proficiency goals, trends for a single grade, and graduation or discipline by student group aren't on the site yet."
      source="NH Department of Education, statewide assessment results"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        <TrendChart
          title={`Percent proficient by year: ${subgroupLabel}`}
          subtitle="All tested grades"
          data={trend}
          series={SUBJECT_SERIES}
          format={value => formatPercent(value)}
          yDomain={[0, 100]}
          breaks={ASSESSMENT_CHANGE_YEARS}
          markers={[...ASSESSMENT_CHANGE_YEARS.map(year => ({ year, label: 'New test' })), { year: NO_TEST_YEAR, label: 'No test' }]}
          compare={isAllStudents ? undefined : { data: allStudents, label: 'All students' }}
          note="The lines break where the state changed tests (2014-15 and 2017-18), because scores before and after aren't comparable. No tests were given in spring 2020. Groups with too few students to report are left out."
          csvName={`nh-proficiency-${subgroupLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          csvUnit="% proficient"
        />

        <Divider />

        <StateTable
          title={`Percent proficient by grade, ${yearText}`}
          subtitle="All students. — means the subject isn't tested in that grade (science is tested in grades 5, 8 and 11)."
          columns={subjectColumns('Grade')}
          rows={byGrade}
          maxWidth={TABLE_WIDTH}
          csvName={`nh-proficiency-by-grade-${latestYear ?? ''}`}
        />

        <Divider />

        <StateTable
          title={`Percent proficient by student group, ${yearText}`}
          subtitle="All tested grades. — means too few students to report."
          columns={subjectColumns<SubgroupRow>('Student group')}
          rows={bySubgroup}
          sectionOf={row => (row.section === 'All students' ? '' : row.section)}
          maxWidth={TABLE_WIDTH}
          csvName={`nh-proficiency-by-group-${latestYear ?? ''}`}
        />
      </Box>
    </StatePage>
  );
};

export default StateAcademics;
