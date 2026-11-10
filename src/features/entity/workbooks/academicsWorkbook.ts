import { AssessmentDistrictData, AssessmentSchoolData, AssessmentStateData } from '@/store/slices/assessmentSlice';
import { PROFICIENCY_LEVELS } from '@/components/ui/academic/utils/academicUtils';
import { ALL_STUDENTS_SUBGROUP_ID, EARLIEST_YEAR, getDistrictRankInfo, getSchoolRankInfo } from '@/features/district/utils/assessmentDataProcessing';
import { asFraction, ExcelColumn, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { groupSubgroups } from '@/features/state/utils/labels';
import { formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '../entity';
import { entityTitle, nh } from '../excel';

export type AssessmentRow = AssessmentDistrictData | AssessmentSchoolData | AssessmentStateData;

export interface AcademicsData {
  kind: EntityKind;
  id: number;
  name: string;
  displayName: string;
  /** The page's latest test year, e.g. 2025 for 2024-25 */
  year: number;
  /** The district's or school's results: every year, subject, student group and grade */
  results: AssessmentRow[];
  /** New Hampshire's results, the same way */
  stateResults: AssessmentRow[];
  /** Every district's or school's result for all students in all grades in `year`, each subject: what the ranks are among */
  peers: AssessmentRow[];
}

// All grades together, which the data has as no grade
const ALL_GRADES = 0;
// A share the state withholds, as the page shows it
const BOUNDS: Record<string, string> = { SCORE_UNDER_10: '<10%', SCORE_OVER_90: '>90%' };
// Change in percentage points, signed
const POINTS = '+0.0;-0.0;0.0';

/** A share as a fraction for the PERCENT format, "<10%" or ">90%" where the state withholds it, blank when there's no result. */
const shareOf = (value: number | null | undefined, exception: string | null | undefined): ExcelValue =>
  asFraction(value) ?? (exception ? BOUNDS[exception] ?? null : null);

const proficient = (row: AssessmentRow | undefined): ExcelValue =>
  row ? shareOf(row.above_proficient_percentage, row.above_proficient_percentage_exception) : null;

const levels = (row: AssessmentRow | undefined): ExcelValue[] =>
  PROFICIENCY_LEVELS.map(level => (row
    ? shareOf(row[level.key as keyof AssessmentRow] as number | null, row[level.exception as keyof AssessmentRow] as string | null)
    : null));

// Undefined for a grade the site doesn't know, which the page leaves out too
const gradeKey = (row: AssessmentRow): number | undefined => (row.grade === null ? ALL_GRADES : row.grade?.id);

const uniqueById = <T extends { id: number }>(items: (T | null | undefined)[]): T[] =>
  [...new Map(items.filter((item): item is T => Boolean(item)).map(item => [item.id, item])).values()].sort((a, b) => a.id - b.id);

const keyOf = (subjectId: number, groupId: number, grade: number, year: number) => `${subjectId}|${groupId}|${grade}|${year}`;

const indexRows = (rows: AssessmentRow[]) => {
  const byKey = new Map<string, AssessmentRow>();
  rows.forEach(row => {
    const grade = gradeKey(row);
    if (row.assessment_subject && row.assessment_subgroup && grade !== undefined) {
      byKey.set(keyOf(row.assessment_subject.id, row.assessment_subgroup.id, grade, row.year), row);
    }
  });
  return byKey;
};

/**
 * The Academic Performance page as one workbook: the subject cards, the share proficient by grade
 * and by student group in the latest year, every result the subject pickers can show (each group,
 * grade and year, with the achievement levels), and every district's or school's result behind the
 * ranks, with New Hampshire's figures beside the district's or school's.
 */
export const academicsWorkbook = (data: AcademicsData): ExcelSheet[] => {
  const title = entityTitle(data.kind, data.name);
  const noun = data.kind === 'district' ? 'District' : 'School';
  const yearText = formatSchoolYear(data.year);
  const entity = indexRows(data.results);
  const state = indexRows(data.stateResults);
  const entityRow = (subjectId: number, groupId: number, grade: number, year: number) => entity.get(keyOf(subjectId, groupId, grade, year));
  const stateRow = (subjectId: number, groupId: number, grade: number, year: number) => state.get(keyOf(subjectId, groupId, grade, year));
  const hasResult = (row: AssessmentRow | undefined) => proficient(row) !== null;

  // Subjects, groups and grades in the district's or school's results, in the page's order
  const subjects = uniqueById(data.results.map(row => row.assessment_subject));
  const grouped = groupSubgroups(uniqueById(data.results.map(row => row.assessment_subgroup)));
  const groups = grouped.flatMap(section => section.items);
  const grades = [{ id: ALL_GRADES, name: 'All Grades' }, ...uniqueById(data.results.map(row => row.grade))];
  const years = [...new Set(data.results.map(row => row.year))].sort((a, b) => a - b);

  // A subject's column and New Hampshire's beside it
  const subjectColumns: ExcelColumn[] = subjects.flatMap(subject => [
    { header: subject.description, width: 12, format: PERCENT },
    { header: nh(subject.description), width: 12, format: PERCENT },
  ]);
  const subjectCells = (groupId: number, grade: number) => subjects.flatMap(subject => [
    proficient(entityRow(subject.id, groupId, grade, data.year)),
    proficient(stateRow(subject.id, groupId, grade, data.year)),
  ]);

  // Each subject's results for every district or school, all students in all grades, by place
  const peerName = (row: AssessmentRow) => (data.kind === 'district' ? row.district_name : row.school_name) ?? '';
  const peerId = (row: AssessmentRow) => (data.kind === 'district' ? row.district_id : row.school_id);
  // One row a place, should a result come back twice
  const peerRows = (subjectId: number) => [...new Map(data.peers
    .filter(row => row.assessment_subject?.id === subjectId && row.assessment_subgroup?.id === ALL_STUDENTS_SUBGROUP_ID && row.grade === null && row.year === data.year)
    .map(row => [peerId(row), row])).values()];
  const rankInfo = data.kind === 'district' ? getDistrictRankInfo : getSchoolRankInfo;
  const places = [...new Map(data.peers.map(row => [peerId(row), row])).values()]
    .filter(row => peerId(row) !== null)
    .sort((a, b) => peerName(a).localeCompare(peerName(b)));

  const keyFigureRows = subjects
    .filter(subject => hasResult(entityRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, ALL_GRADES, data.year)))
    .map(subject => {
      const latest = entityRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, ALL_GRADES, data.year)?.above_proficient_percentage;
      const earliest = entityRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, ALL_GRADES, EARLIEST_YEAR)?.above_proficient_percentage;
      const { rank, total } = rankInfo(peerRows(subject.id), data.id);
      return [
        subject.description,
        yearText,
        proficient(entityRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, ALL_GRADES, data.year)),
        proficient(stateRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, ALL_GRADES, data.year)),
        typeof latest === 'number' && typeof earliest === 'number' ? Number((latest - earliest).toFixed(1)) : null,
        rank,
        total || null,
      ];
    });

  // The grades and groups with a result in the latest year, as on the page's pickers
  const latestGrades = grades.filter(grade => subjects.some(subject => hasResult(entityRow(subject.id, ALL_STUDENTS_SUBGROUP_ID, grade.id, data.year))));
  const groupRows: { label: string; groupId: number | null }[] = grouped.flatMap(section => {
    const items = section.items.filter(item => subjects.some(subject => hasResult(entityRow(subject.id, item.id, ALL_GRADES, data.year))));
    if (items.length === 0) return [];
    return [
      ...(section.section === 'All Students' ? [] : [{ label: section.section, groupId: null }]),
      ...items.map(item => ({ label: item.label, groupId: item.id })),
    ];
  });

  const levelHeaders = PROFICIENCY_LEVELS.map((level, index) => `${level.label} (Level ${index + 1})`);
  const subjectSheet = (subject: { id: number; description: string }): ExcelSheet => ({
    name: `${subject.description} Results By Year`,
    title: `${subject.description}: Every Student Group, Grade and Year`,
    subtitle: `${title}'s percent proficient and share at each achievement level, with New Hampshire's for the same group, grade and year`,
    columns: [
      { header: 'Student Group', width: 32 },
      { header: 'Grade', width: 14 },
      { header: 'School Year', width: 12 },
      { header: 'Percent Proficient', width: 12, format: PERCENT },
      { header: nh('Percent Proficient'), width: 12, format: PERCENT },
      ...levelHeaders.map(header => ({ header, width: 14, format: PERCENT })),
      ...levelHeaders.map(header => ({ header: nh(header), width: 14, format: PERCENT })),
    ],
    rows: groups.flatMap(group => grades.flatMap(grade => years.flatMap(year => {
      const row = entityRow(subject.id, group.id, grade.id, year);
      const values = [proficient(row), ...levels(row)];
      if (values.every(value => value === null)) return [];
      const stateValues = stateRow(subject.id, group.id, grade.id, year);
      return [[group.label, grade.name, formatSchoolYear(year), values[0], proficient(stateValues), ...values.slice(1), ...levels(stateValues)]];
    }))),
  });

  const placesSheet: ExcelSheet = {
    name: `All ${noun}s`,
    title: `Percent Proficient in Every ${noun}, ${yearText}`,
    subtitle: `All students, all tested grades: what each subject's rank is among. ${title} is in bold.`,
    columns: [
      { header: noun, width: 36 },
      ...(data.kind === 'school' ? [{ header: 'District', width: 24 }] : []),
      ...subjects.map(subject => ({ header: subject.description, width: 12, format: PERCENT })),
    ],
    rows: places.map(place => [
      peerName(place),
      ...(data.kind === 'school' ? [place.district_name ?? null] : []),
      ...subjects.map(subject => proficient(peerRows(subject.id).find(row => peerId(row) === peerId(place)))),
    ]),
    subtotalRows: places.flatMap((place, index) => (peerId(place) === data.id ? [index] : [])),
  };

  return [
    {
      name: 'Key Figures',
      subtitle: `${title}: all students, all tested grades, as on the page's subject cards`,
      columns: [
        { header: 'Subject', width: 14 },
        { header: 'School Year', width: 12 },
        { header: 'Percent Proficient', width: 12, format: PERCENT },
        { header: nh('Percent Proficient'), width: 12, format: PERCENT },
        { header: `Change Since ${formatSchoolYear(EARLIEST_YEAR)} (Percentage Points)`, width: 18, format: POINTS },
        { header: `Rank Among ${noun}s`, width: 14 },
        { header: `${noun}s Ranked`, width: 12 },
      ],
      rows: keyFigureRows,
    },
    {
      name: 'Proficient By Grade',
      title: `Percent Proficient By Grade, ${yearText}`,
      subtitle: `${title}: all students; science is tested only in grades 5, 8 and 11`,
      columns: [{ header: 'Grade', width: 16 }, ...subjectColumns],
      rows: latestGrades.map(grade => [grade.name, ...subjectCells(ALL_STUDENTS_SUBGROUP_ID, grade.id)]),
      subtotalRows: latestGrades[0]?.id === ALL_GRADES ? [0] : [],
    },
    {
      name: 'Proficient By Student Group',
      title: `Percent Proficient By Student Group, ${yearText}`,
      subtitle: `${title}: all tested grades`,
      columns: [{ header: 'Student Group', width: 40 }, ...subjectColumns],
      rows: groupRows.map(row => [row.label, ...(row.groupId === null ? subjects.flatMap(() => [null, null]) : subjectCells(row.groupId, ALL_GRADES))]),
      subtotalRows: groupRows.flatMap((row, index) => (row.groupId === null || row.groupId === ALL_STUDENTS_SUBGROUP_ID ? [index] : [])),
    },
    ...subjects.map(subjectSheet),
    ...(places.length > 0 ? [placesSheet] : []),
    notesSheet(`${data.displayName} for ${title}`, [
      'Source: NH Department of Education, statewide assessment results.',
      'Percent proficient is the share of students who met or exceeded the grade-level standard: level 3 or 4 of the four achievement levels (below proficient, near proficient, proficient and above proficient). Students take the tests in grades 3 through 8, with the SAT in grade 11; science is tested in grades 5, 8 and 11 (grade 4 on the earlier tests).',
      'The state changed tests in 2014-15 and 2017-18, so scores before and after a change aren\'t directly comparable. No tests were given in spring 2020.',
      'Where the state reports only that a share is under 10% or over 90%, the sheets show "<10%" or ">90%". A blank cell, or a group, grade or year left out, means there\'s no result: too few students to report, or the test wasn\'t given in that grade or year.',
      `Columns starting "NH" are New Hampshire's figures for the same student group, grade and year. The change on the Key Figures sheet is in percentage points since ${formatSchoolYear(EARLIEST_YEAR)}, as the page's subject cards show it.`,
      `Ranks are among the ${noun.toLowerCase()}s with a result for all students in all tested grades in ${yearText}, highest first, with shares rounded to whole percents (a tie shares a rank, and a share under 10% or over 90% counts as 9% or 91%). The All ${noun}s sheet lists them.`,
    ]),
  ];
};
