import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Divider, FormControl, InputLabel, ListSubheader, MenuItem, Select } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import StatePage from '../components/StatePage';
import StateTable, { StateTableColumn } from '../components/StateTable';
import ChartRow from '../components/ChartRow';
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
  hasProficiencyResult,
  latestAssessmentYear,
  NamedAssessmentRow,
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
const TREND_YEARS = 10;
// The current state test (the NH SAS) began in 2017-18
const CURRENT_TEST_FIRST_YEAR = 2018;
// The grade picker's and grade table's "All Grades", which the data has as no grade
const ALL_GRADES = 0;

const SUBJECT_KEYS = SUBJECTS.map(subject => subject.key);
const SUBJECT_SERIES = SUBJECTS.map(subject => ({ key: subject.key, name: subject.name, color: ENTITY_COLORS[subject.key] }));

type SubgroupRow = ProficiencyTableRow & { section: string };

/** The grades among some rows, in grade order. */
const gradesIn = (rows: NamedAssessmentRow[]): { id: number; name: string }[] => {
  const grades = new Map<number, string>();
  rows.forEach(row => {
    if (row.grade_id !== null) grades.set(row.grade_id, row.grade_name ?? `Grade id ${row.grade_id}`);
  });
  return [...grades].sort(([a], [b]) => a - b).map(([id, name]) => ({ id, name }));
};

const subjectColumns = <T extends ProficiencyTableRow>(firstLabel: string): StateTableColumn<T>[] => [
  { key: 'name', label: firstLabel },
  ...SUBJECTS.map(subject => ({
    key: subject.key,
    label: subject.name,
    align: 'right' as const,
    // "<10%" or ">90%" where the state withholds the share, as the district pages show it; "—" where there's no result
    format: (row: T) => (row[subject.key] !== null ? formatPercent(row[subject.key]) : row.bounds?.[subject.key] ?? '—'),
  })),
];

const StateAcademics: React.FC = () => {
  const { loads, assessments, subgroups } = useStateAssessmentData();
  const { status, retry } = useStateLoads(loads);

  const latestYear = useMemo(() => latestAssessmentYear(assessments), [assessments]);
  // Groups with a result in the latest year (a share withheld as under 10% or over 90% counts), in
  // the picker's order, with plain names; a group the state no longer reports is left out
  const grouped = useMemo(() => {
    const current = new Set(assessments
      .filter(row => row.year === latestYear && row.grade_id === null && hasProficiencyResult(row))
      .map(row => row.assessment_subgroup_id));
    return groupSubgroups(subgroups.filter(subgroup => current.has(subgroup.id)));
  }, [assessments, subgroups, latestYear]);
  const options = useMemo(() => grouped.flatMap(section => section.items.map(item => ({ ...item, section: section.section }))), [grouped]);

  // The test is part of the address (/state/academic/math), so each tile click is a step the back
  // button can undo; the page itself starts with none. The group and grade start over on every
  // visit, at all students in all grades.
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const testKey = pathname.split('/')[3] ?? null;
  const [chosenGroup, setChosenGroup] = useState(ALL_STUDENTS_SUBGROUP_ID);
  const [chosenGrade, setChosenGrade] = useState(ALL_GRADES);
  const subject = SUBJECTS.find(entry => entry.key === testKey) ?? null;
  // On phones the tiles sit well above the chart, so bring the chart into view once a test is chosen
  const chartRef = useRef<HTMLDivElement>(null);
  const chooseTest = (key: string) => {
    if (key === subject?.key) return;
    navigate(`${PAGE.urlPatterns[0]}/${key}`, { state: { keepScroll: true } });
    // A grade the new test isn't given in (science is tested in only three) goes back to all grades
    const nextSubject = SUBJECTS.find(entry => entry.key === key);
    if (!assessments.some(row => row.assessment_subject_id === nextSubject?.id && row.grade_id === chosenGrade)) setChosenGrade(ALL_GRADES);
    const top = chartRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top > window.innerHeight * 0.6) chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const subgroupId = options.some(option => option.id === chosenGroup) ? chosenGroup : ALL_STUDENTS_SUBGROUP_ID;
  const subgroupLabel = options.find(option => option.id === subgroupId)?.label ?? 'All Students';
  const isAllStudents = subgroupId === ALL_STUDENTS_SUBGROUP_ID;
  // Grades with results in the chosen test (science is tested in only three)
  const gradeOptions = useMemo(() => [
    { id: ALL_GRADES, name: 'All Grades' },
    ...gradesIn(assessments.filter(row => row.assessment_subject_id === subject?.id && hasProficiencyResult(row))),
  ], [assessments, subject]);
  const gradeId = gradeOptions.some(option => option.id === chosenGrade) ? chosenGrade : ALL_GRADES;
  const gradeLabel = gradeOptions.find(option => option.id === gradeId)?.name ?? 'All Grades';
  const chartGrade = gradeId === ALL_GRADES ? null : gradeId;
  // Groups and grades with results in the chosen test, given the other picker's choice (a share the
  // state withholds as under 10% or over 90% still counts); the rest are greyed out, as too few students to report
  const reported = useMemo(() => {
    const groups = new Set<number>();
    const grades = new Set<number>();
    assessments.forEach(row => {
      if (row.assessment_subject_id !== subject?.id || !hasProficiencyResult(row)) return;
      if (row.grade_id === chartGrade) groups.add(row.assessment_subgroup_id);
      if (row.assessment_subgroup_id === subgroupId) grades.add(row.grade_id ?? ALL_GRADES);
    });
    return { groups, grades };
  }, [assessments, subject, chartGrade, subgroupId]);

  const allStudents = useMemo(() => proficiencyBySubject(assessments, ALL_STUDENTS_SUBGROUP_ID), [assessments]);
  const trend = useMemo(
    () => withEmptyYears(proficiencyBySubject(assessments, subgroupId, chartGrade, true), [NO_TEST_YEAR], SUBJECT_KEYS),
    [assessments, subgroupId, chartGrade]
  );
  // All students in all grades, drawn dashed whenever the chart shows a group or a grade
  const showAllStudents = !isAllStudents || chartGrade !== null;
  // The chosen test's line, shaded below; the dashed all-students line isn't
  const chartSeries = useMemo(() => SUBJECT_SERIES.filter(entry => entry.key === subject?.key).map(entry => ({ ...entry, fill: true })), [subject]);
  const hasResults = Boolean(subject) && trend.some(row => typeof row[subject!.key] === 'number');
  // Years the state withheld the share as under 10% or over 90%; the line is drawn at 10% or 90%
  // there, as on the district pages, and the tooltip says "<10%" or ">90%"
  const boundsByYear = useMemo(() => new Map(assessments
    .filter(row => row.bound && row.assessment_subject_id === subject?.id && row.assessment_subgroup_id === subgroupId && row.grade_id === chartGrade)
    .map(row => [row.year, row.bound as string])), [assessments, subject, subgroupId, chartGrade]);
  const bySubgroup = useMemo<SubgroupRow[]>(() => {
    if (!latestYear) return [];
    const rows = proficiencyBySubgroup(assessments, latestYear, options.map(option => ({ id: option.id, name: option.label })));
    return rows.map(row => ({ ...row, section: options.find(option => option.id === row.id)?.section ?? '' }));
  }, [assessments, latestYear, options]);
  const byGrade = useMemo(() => {
    if (!latestYear) return [];
    // All grades first (all students' row), the row each grade is read against
    const [allGrades] = proficiencyBySubgroup(assessments, latestYear, [{ id: ALL_STUDENTS_SUBGROUP_ID, name: 'All Grades' }]);
    const grades = gradesIn(assessments.filter(row => row.year === latestYear));
    return [{ ...allGrades, id: ALL_GRADES }, ...proficiencyByGrade(assessments, latestYear, grades)];
  }, [assessments, latestYear]);

  // Key figures and takeaway for all students; the group picker changes only the chart
  const keyFigures = useMemo(() => {
    const latest = allStudents.find(row => row.year === latestYear);
    if (!latestYear || !latest) return { figures: [] as (KeyFigure & { subjectKey: string })[], takeaway: [] as string[] };
    const tested = SUBJECTS.filter(subject => typeof latest[subject.key] === 'number');
    const figures: (KeyFigure & { subjectKey: string })[] = tested.map(subject => {
      const series = toSeries(allStudents, row => row[subject.key]).filter(point => point.year >= CURRENT_TEST_FIRST_YEAR);
      const change = changeSince(series, TREND_YEARS);
      // Share at the highest of the four levels, which the district pages call "above proficient"
      const topLevel = assessments.find(row => row.year === latestYear && row.grade_id === null
        && row.assessment_subgroup_id === ALL_STUDENTS_SUBGROUP_ID && row.assessment_subject_id === subject.id)?.level_4_percentage;
      return {
        label: `Proficient in ${subject.name}`,
        value: formatPercent(latest[subject.key]),
        period: shortYear(latestYear),
        // The change relative to the share then, like the other State pages' tiles
        delta: tileDelta(change, { unit: 'percent', higherIsBetter: true }),
        detail: typeof topLevel === 'number' ? `${formatPercent(topLevel)} at the highest level (4 of 4)` : undefined,
        hideDetailOnPhone: true,
        subjectKey: subject.key,
      };
    });
    // "In 2025-26, 44% of students were proficient in math, 55% in reading and 38% in science."
    const scores = tested.map(subject => ({ value: formatPercent(latest[subject.key]), subject: subject.name.toLowerCase() }));
    const rest = scores.slice(1).map(score => `${score.value} in ${score.subject}`);
    const others = rest.length > 1 ? `, ${rest.slice(0, -1).join(', ')} and ${rest[rest.length - 1]}` : rest.length ? ` and ${rest[0]}` : '';
    const takeaway = scores.length
      ? [`In ${formatSchoolYear(latestYear)}, ${scores[0].value} of students were proficient in ${scores[0].subject}${others}.`, 'Significant variations in different student groups can be seen below.']
      : [];
    return { figures, takeaway };
  }, [allStudents, assessments, latestYear]);

  const yearText = latestYear ? formatSchoolYear(latestYear) : '';

  return (
    <StatePage
      displayName={PAGE.displayName}
      status={status}
      onRetry={retry}
      errorMessage="Statewide assessment data could not be loaded."
      intro="The share of students scoring proficient or above on the state's tests in math, reading and science, meaning they met or exceeded the grade-level standard (level 3 or 4 of 4). Students take the tests in grades 3 through 8, with the SAT in grade 11; science is tested in grades 5, 8 and 11."
      takeaway={keyFigures.takeaway}
      // Each tile also picks the test the chart below shows
      keyFigures={(
        <KeyFigures
          figures={keyFigures.figures.map(({ subjectKey, ...figure }) => ({
            ...figure,
            selected: subject?.key === subjectKey,
            onSelect: () => chooseTest(subjectKey),
          }))}
          centerLastTile
        />
      )}
      keyFiguresBesideIntro
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        <Box ref={chartRef} sx={{ scrollMarginTop: 120 }}>
          <TrendChart
            // The title names the chosen test, so the chart is clear on its own
            title={subject ? `Percent Proficient in ${subject.name} By Year` : 'Percent Proficient By Year'}
            subtitle={subject ? `${subgroupLabel}, ${gradeLabel}` : undefined}
            // Like the district pages: pick a test (a tile above), then narrow it by student group and grade
            filters={subject && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, '& > *': { width: { xs: '100%', sm: 'auto' } } }}>
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel id="state-subgroup-label">Student Group</InputLabel>
                  <Select
                    labelId="state-subgroup-label"
                    label="Student Group"
                    value={options.length ? subgroupId : ''}
                    onChange={event => setChosenGroup(Number(event.target.value))}
                  >
                    {grouped.flatMap(section => [
                      ...(section.section === 'All Students' ? [] : [<ListSubheader key={`header-${section.section}`}>{section.section}</ListSubheader>]),
                      ...section.items.map(item => <MenuItem key={item.id} value={item.id} disabled={!reported.groups.has(item.id)}>{item.label}</MenuItem>),
                    ])}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="state-grade-label">Grade</InputLabel>
                  <Select
                    labelId="state-grade-label"
                    label="Grade"
                    value={gradeId}
                    onChange={event => setChosenGrade(Number(event.target.value))}
                  >
                    {gradeOptions.map(option => <MenuItem key={option.id} value={option.id} disabled={!reported.grades.has(option.id)}>{option.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            )}
            emptyMessage={subject
              ? 'Too few students to report for this group and grade.'
              : 'Select Math, Reading or Science above to see the percent proficient by year.'}
            showViewToggle={false}
            data={hasResults ? trend : []}
            valueLabel={year => boundsByYear.get(year)}
            series={chartSeries}
            format={value => formatPercent(value)}
            yDomain={[0, 100]}
            breaks={ASSESSMENT_CHANGE_YEARS}
            connectGaps
            markers={[...ASSESSMENT_CHANGE_YEARS.map(year => ({ year, label: 'New Test' })), { year: NO_TEST_YEAR, label: 'No Test' }]}
            compare={showAllStudents && hasResults ? { data: allStudents, label: 'All Students, All Grades' } : undefined}
            wideNote
            note={hasResults ? `State changed tests in 2014-15 and 2017-18. Scores before/after change aren't directly comparable. No tests in Spring 2020.${boundsByYear.size ? ' Where the state reports only under 10% or over 90%, the line is drawn at 10% or 90%.' : ''}` : undefined}
          />
        </Box>

        <Divider />

        <ChartRow>
          <StateTable
            title={`Percent Proficient By Grade, ${yearText}`}
            shortTitle={`% Proficient By Grade, ${yearText}`}
            subtitle="All Students. Science Tested Only in 5, 8, 11."
            columns={subjectColumns('Grade')}
            rows={byGrade}
            isHighlighted={row => row.id === ALL_GRADES}
          />
          <StateTable
            title={`Percent Proficient By Student Group, ${yearText}`}
            shortTitle={`% Proficient By Student Group, ${yearText}`}
            subtitle="All Tested Grades"
            columns={subjectColumns<SubgroupRow>('Student Group')}
            rows={bySubgroup}
            sectionOf={row => (row.section === 'All Students' ? '' : row.section)}
            isHighlighted={row => row.id === ALL_STUDENTS_SUBGROUP_ID}
          />
        </ChartRow>
      </Box>
    </StatePage>
  );
};

export default StateAcademics;
