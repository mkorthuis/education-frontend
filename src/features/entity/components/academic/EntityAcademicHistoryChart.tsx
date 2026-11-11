import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectAssessmentSubgroups
} from '@/store/slices/assessmentSlice';
import { ALL_GRADES_ID, ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import TrendChart from '@/features/state/components/TrendChart';
import {
  ASSESSMENT_CHANGE_YEARS,
  formatPercent,
  mergeSeries,
  NO_TEST_YEAR,
  NamedAssessmentRow,
  normalizeAssessmentRows,
  proficiencyBySubject,
  StoredAssessmentRow,
  SUBJECTS,
  toSeries,
  withEmptyYears
} from '@/features/state/utils/stateMetrics';
import { plainLabel, STUDENT_GROUP_LABELS } from '@/features/state/utils/labels';
import { EntityKind } from '@/features/entity/entity';
import { ASSESSMENT } from '@/features/entity/bindings/assessment';
import { besideState, RATE_SERIES } from '@/features/entity/trends';

// Results by student group start with the current test
const GROUPS_FROM_YEAR = 2018;

const MARKERS = [...ASSESSMENT_CHANGE_YEARS.map(year => ({ year, label: 'New Test' })), { year: NO_TEST_YEAR, label: 'No Test' }];

/** The share proficient in the chosen test, group and grade by year, beside the state's, as on the State Academics page */
const EntityAcademicHistoryChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const entityResults = useAppSelector(state => ASSESSMENT[kind].selectCurrentData(state));
  const stateResults = useAppSelector(selectCurrentAssessmentStateData);
  const subjectId = useAppSelector(selectSelectedSubjectId);
  const gradeId = useAppSelector(selectSelectedGradeId);
  const subgroupId = useAppSelector(selectSelectedSubgroupId) ?? ALL_STUDENTS_SUBGROUP_ID;
  const subgroups = useAppSelector(selectAssessmentSubgroups);

  const entityRows = useMemo(() => normalizeAssessmentRows(entityResults as StoredAssessmentRow[]), [entityResults]);
  const stateRows = useMemo(() => normalizeAssessmentRows(stateResults as StoredAssessmentRow[]), [stateResults]);

  const chart = useMemo(() => {
    const subject = SUBJECTS.find(entry => entry.id === subjectId);
    if (!subject) return null;
    const grade = gradeId === ALL_GRADES_ID ? null : gradeId;
    const isGroup = subgroupId !== ALL_STUDENTS_SUBGROUP_ID;
    // The share proficient each year, drawn at 10% or 90% where the state reports only "<10%" or ">90%"
    const shares = (rows: NamedAssessmentRow[], group: number) =>
      toSeries(proficiencyBySubject(rows, group, grade, true), row => row[subject.key])
        .filter(point => !isGroup || point.year >= GROUPS_FROM_YEAR);
    const rows = withEmptyYears(besideState(shares(entityRows, subgroupId), shares(stateRows, subgroupId)), [NO_TEST_YEAR], ['entity', 'state']);
    // "<10%" or ">90%" in the tooltip where that's all the state reports
    const boundsOf = (key: string, results: NamedAssessmentRow[]) => results
      .filter(row => row.bound && row.assessment_subject_id === subject.id && row.assessment_subgroup_id === subgroupId && row.grade_id === grade)
      .map(row => [`${key}-${row.year}`, row.bound as string] as const);
    const bounds = new Map([...boundsOf('entity', entityRows), ...boundsOf('state', stateRows)]);
    const groupName = subgroups.find(entry => entry.id === subgroupId)?.name;
    return {
      rows,
      bounds,
      subtitle: `${isGroup && groupName ? plainLabel(STUDENT_GROUP_LABELS, groupName) : 'All Students'}, ${
        entityRows.find(row => row.grade_id === grade && row.grade_name)?.grade_name ?? 'All Grades'}`,
      // All students in the same grade, dashed beside a group
      overall: isGroup
        ? { data: mergeSeries({ entity: shares(entityRows, ALL_STUDENTS_SUBGROUP_ID) }), label: 'All Students' }
        : undefined,
      estimated: rows.some(row => row.year < GROUPS_FROM_YEAR),
    };
  }, [subjectId, gradeId, subgroupId, subgroups, entityRows, stateRows]);

  const note = chart && chart.rows.length > 0 ? [
    "State changed tests in 2014-15 and 2017-18. Scores before/after change aren't directly comparable. No tests in Spring 2020.",
    chart.bounds.size ? 'Where the state reports only under 10% or over 90%, the line is drawn at 10% or 90%.' : '',
    chart.estimated
      ? `${kind === 'district' ? 'District and state' : 'State'} figures before 2017-18 were calculated from school results, not by the NH DOE: very close, but not exact.`
      : '',
  ].filter(Boolean).join(' ') : undefined;

  return (
    <TrendChart
      title="% Students Proficient Over Time"
      subtitle={chart?.subtitle}
      data={chart?.rows ?? []}
      series={RATE_SERIES[kind]}
      compare={chart?.overall}
      valueLabel={(year, key) => chart?.bounds.get(`${key}-${year}`)}
      format={value => formatPercent(value)}
      yDomain={[0, 100]}
      breaks={ASSESSMENT_CHANGE_YEARS}
      connectGaps
      markers={MARKERS}
      note={note}
      emptyMessage="No results for this test, group and grade."
    />
  );
};

export default EntityAcademicHistoryChart;
