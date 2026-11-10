import {
  BaseBullyingClassificationData,
  BaseBullyingData,
  BaseBullyingImpactData,
  BaseDisciplineCountData,
  BaseDisciplineIncidentData,
  BaseEnrollmentData,
  BaseHarassmentData,
  BaseRestraintData,
  BaseSeclusionData,
  BaseTruancyData,
} from '@/store/slices/safetySlice';
import { getDisplayName } from '@/components/ui/safety/DisciplineIncidentTable';
import { IN_SCHOOL_SUSPENSION_TYPE, OUT_OF_SCHOOL_SUSPENSION_TYPE } from '@/utils/safetyCalculations';
import { COUNT, ExcelColumn, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '../entity';
import { entityTitle, nh } from '../excel';

/** The datasets the Safety page compares with New Hampshire's */
export interface SafetyRows {
  truancy: BaseTruancyData[];
  bullying: BaseBullyingData[];
  harassment: BaseHarassmentData[];
  restraint: BaseRestraintData[];
  seclusion: BaseSeclusionData[];
  disciplineCount: BaseDisciplineCountData[];
  disciplineIncident: BaseDisciplineIncidentData[];
  enrollment: BaseEnrollmentData[];
}

/** A serious safety incident type a school reported in a year; `school` names it on a district's page */
export interface SeriousIncident {
  school?: string;
  year: number;
  type: string;
  count: number;
}

export interface SafetyData {
  kind: EntityKind;
  name: string;
  displayName: string;
  entity: SafetyRows & {
    bullyingClassification: BaseBullyingClassificationData[];
    bullyingImpact: BaseBullyingImpactData[];
  };
  state: SafetyRows;
  serious: SeriousIncident[];
}

const PER_100 = '0.00';

// The bullying types schools report, in plain words
const BULLYING_LABELS: Record<string, string> = {
  'Bullying (of any kind)': 'Bullying of Any Kind',
  'Cyber-bullying': 'Cyber-Bullying',
};

// Discipline counts, by the start of the count type's name the page looks for
const DISCIPLINE_COUNTS = {
  inSchool: IN_SCHOOL_SUSPENSION_TYPE,
  outOfSchool: OUT_OF_SCHOOL_SUSPENSION_TYPE,
  expelled: 'Expelled',
};

const years = (...sets: { year: number }[][]) => [...new Set(sets.flat().map(row => row.year))].sort((a, b) => a - b);

const sum = <T>(rows: T[], value: (row: T) => number | null | undefined) =>
  rows.reduce((total, row) => total + (value(row) ?? 0), 0);

/** Each type's name by id, in id order: the order the page's tables list them */
const typesOf = <T>(rows: T[], type: (row: T) => { id: number; name: string }) => {
  const byId = new Map<number, string>();
  rows.forEach(row => byId.set(type(row).id, type(row).name));
  return [...byId.entries()].sort(([a], [b]) => a - b).map(([id, name]) => ({ id, name }));
};

/** A year's enrollment, and counts per 100 students in it */
const perStudent = (enrollment: BaseEnrollmentData[]) => {
  const byYear = new Map(enrollment.map(row => [row.year, row.total_enrollment]));
  const enrolled = (year: number): ExcelValue => byYear.get(year) || null;
  const per100 = (count: number | null | undefined, year: number): ExcelValue => {
    const students = byYear.get(year);
    return typeof count === 'number' && students ? (count / students) * 100 : null;
  };
  const share = (count: number | null | undefined, year: number): ExcelValue => {
    const students = byYear.get(year);
    return typeof count === 'number' && students ? count / students : null;
  };
  return { enrolled, per100, share };
};

const yearColumn: ExcelColumn = { header: 'School Year', width: 12 };
const enrollmentColumn: ExcelColumn = { header: 'Enrollment', width: 12, format: COUNT };
const per100Columns = (header: string): ExcelColumn[] => [
  { header: `${header} per 100 Students`, width: 18, format: PER_100 },
  { header: nh(`${header} per 100 Students`), width: 18, format: PER_100 },
];

/** Rows down the side, years across, entity only, as the page's year-picker tables show them */
const typeByYearSheet = <T extends { year: number; count: number }>(
  name: string, title: string, subtitle: string, firstHeader: string, rows: T[], type: (row: T) => { id: number; name: string }
): ExcelSheet => {
  const sheetYears = years(rows);
  const count = (typeId: number | null, year: number) =>
    sum(rows.filter(row => row.year === year && (typeId === null || type(row).id === typeId)), row => row.count);
  return {
    name,
    title,
    subtitle,
    columns: [{ header: firstHeader, width: 40 }, ...sheetYears.map(year => ({ header: formatSchoolYear(year), width: 10, format: COUNT }))],
    rows: typesOf(rows, type).map(entry => [entry.name, ...sheetYears.map(year => count(entry.id, year))]),
    totalRow: sheetYears.length ? ['Total', ...sheetYears.map(year => count(null, year))] : undefined,
  };
};

/**
 * The Safety page as one workbook: a sheet per chart or table across all six categories and every
 * year, not just the category or year chosen on the page, with New Hampshire's rate per 100
 * students beside the district's or school's wherever the page compares them.
 */
export const safetyWorkbook = (data: SafetyData): ExcelSheet[] => {
  const title = entityTitle(data.kind, data.name);
  const { entity, state } = data;
  const own = perStudent(entity.enrollment);
  const nhRates = perStudent(state.enrollment);
  const byYear = <T extends { year: number }>(rows: T[]) => (year: number) => rows.filter(row => row.year === year);

  // Truancy
  const stateTruancy = new Map(state.truancy.map(row => [row.year, row.count]));

  // Bullying, by type: the page's All Types line adds the two together; here they're kept apart
  const bullyingTypes = typesOf([...entity.bullying, ...state.bullying], row => row.bullying_type);
  const bullyingIn = byYear(entity.bullying);
  const stateBullyingIn = byYear(state.bullying);
  const bullyingCount = (rows: BaseBullyingData[], typeId: number, value: (row: BaseBullyingData) => number) =>
    sum(rows.filter(row => row.bullying_type.id === typeId), value);

  // Harassment
  const harassmentTypes = typesOf(entity.harassment, row => row.classification);
  const harassmentIn = byYear(entity.harassment);
  const stateHarassmentIn = byYear(state.harassment);
  const harassmentMeasures: [string, (row: BaseHarassmentData) => number][] = [
    ['Incidents', row => row.incident_count],
    ['Students Impacted', row => row.student_impact_count],
    ['Students Disciplined', row => row.student_engaged_count],
  ];
  const harassmentRows: ExcelValue[][] = [];
  const harassmentTotals: number[] = [];
  years(entity.harassment).forEach(year => {
    const rows = harassmentIn(year);
    harassmentTypes.forEach(type => {
      const ofType = rows.filter(row => row.classification.id === type.id);
      harassmentRows.push([formatSchoolYear(year), type.name, ...harassmentMeasures.map(([, value]) => sum(ofType, value))]);
    });
    harassmentTotals.push(harassmentRows.length);
    harassmentRows.push([formatSchoolYear(year), 'All Types', ...harassmentMeasures.map(([, value]) => sum(rows, value))]);
  });

  // Restraint and seclusion
  const stateRestraint = new Map(state.restraint.map(row => [row.year, row.generated]));
  const stateSeclusion = new Map(state.seclusion.map(row => [row.year, row.generated]));

  // Suspensions and expulsions: students disciplined, by the count types the page reads
  const countOf = (rows: BaseDisciplineCountData[], year: number, typeName: string): number | null => {
    const matches = rows.filter(row => row.year === year && row.count_type.name.includes(typeName));
    return matches.length ? sum(matches, row => row.count) : null;
  };
  const suspensions = (rows: BaseDisciplineCountData[], year: number) => {
    const inSchool = countOf(rows, year, DISCIPLINE_COUNTS.inSchool);
    const outOfSchool = countOf(rows, year, DISCIPLINE_COUNTS.outOfSchool);
    return { inSchool, outOfSchool, all: inSchool === null && outOfSchool === null ? null : (inSchool ?? 0) + (outOfSchool ?? 0) };
  };

  // Incidents resulting in suspension, grouped as the page's table groups them
  const incidentGroups = new Map<string, number>();
  typesOf([...entity.disciplineIncident, ...state.disciplineIncident], row => row.incident_type).forEach(type => {
    const group = getDisplayName(type.name);
    if (!incidentGroups.has(group)) incidentGroups.set(group, type.id);
  });
  const groupOf = (row: BaseDisciplineIncidentData) => getDisplayName(row.incident_type.name);
  const incidentRows: ExcelValue[][] = [];
  const incidentTotals: number[] = [];
  years(entity.disciplineIncident).forEach(year => {
    const rows = entity.disciplineIncident.filter(row => row.year === year);
    const stateRows = state.disciplineIncident.filter(row => row.year === year);
    const line = (label: string, ofGroup: (row: BaseDisciplineIncidentData) => boolean) => {
      const count = sum(rows.filter(ofGroup), row => row.count);
      const stateCount = stateRows.length ? sum(stateRows.filter(ofGroup), row => row.count) : null;
      return [formatSchoolYear(year), label, count, own.per100(count, year), stateCount, nhRates.per100(stateCount, year)];
    };
    [...incidentGroups.keys()].forEach(group => incidentRows.push(line(group, row => groupOf(row) === group)));
    incidentTotals.push(incidentRows.length);
    incidentRows.push(line('All Incidents', () => true));
  });

  const seriousColumns: ExcelColumn[] = [
    ...(data.kind === 'district' ? [{ header: 'School', width: 30 }] : []),
    yearColumn,
    { header: 'Incident', width: 44 },
    { header: 'Incidents', format: COUNT },
  ];
  const serious = data.serious
    .filter(incident => incident.count > 0)
    .sort((a, b) => (a.school ?? '').localeCompare(b.school ?? '') || a.year - b.year || a.type.localeCompare(b.type));

  return [
    {
      name: 'Truancy',
      title: 'Share of Students Who Were Truant',
      subtitle: 'Students with 10 or more half-days of unexcused absence, as a percentage of enrollment',
      columns: [
        yearColumn,
        { header: 'Truant Students', width: 14, format: COUNT },
        enrollmentColumn,
        { header: '% Truant', width: 12, format: PERCENT },
        { header: nh('% Truant'), width: 12, format: PERCENT },
      ],
      rows: [...entity.truancy].sort((a, b) => a.year - b.year).map(row => [
        formatSchoolYear(row.year), row.count, own.enrolled(row.year), own.share(row.count, row.year), nhRates.share(stateTruancy.get(row.year), row.year),
      ]),
    },
    {
      name: 'Bullying By Year',
      title: 'Bullying Incidents By Year',
      subtitle: 'Reported, and confirmed by investigation; rates are confirmed incidents per 100 students',
      columns: [
        yearColumn,
        enrollmentColumn,
        ...bullyingTypes.flatMap(type => {
          const label = BULLYING_LABELS[type.name] ?? type.name;
          return [
            { header: `${label}: Reported`, width: 16, format: COUNT },
            { header: `${label}: Confirmed`, width: 16, format: COUNT },
            ...per100Columns(`${label}: Confirmed`),
          ];
        }),
      ],
      rows: years(entity.bullying).map(year => {
        const rows = bullyingIn(year);
        const stateRows = stateBullyingIn(year);
        return [
          formatSchoolYear(year),
          own.enrolled(year),
          ...bullyingTypes.flatMap(type => [
            bullyingCount(rows, type.id, row => row.reported),
            bullyingCount(rows, type.id, row => row.investigated_actual),
            own.per100(bullyingCount(rows, type.id, row => row.investigated_actual), year),
            stateRows.length ? nhRates.per100(bullyingCount(stateRows, type.id, row => row.investigated_actual), year) : null,
          ]),
        ];
      }),
    },
    typeByYearSheet('Bullying Classifications', 'Bullying Incidents Based On', 'Confirmed incidents by what the bullying was based on, each school year', 'Based On', entity.bullyingClassification, row => row.classification_type),
    typeByYearSheet('Bullying Impacts', 'Bullying Incidents That', 'Confirmed incidents by what they involved, each school year', 'Incidents That', entity.bullyingImpact, row => row.impact_type),
    {
      name: 'Harassment By Type',
      title: 'Harassment Incidents By Type',
      subtitle: 'Each school year, by what the harassment was based on',
      columns: [
        yearColumn,
        { header: 'Harassment Type', width: 40 },
        ...harassmentMeasures.map(([header]) => ({ header, width: 14, format: COUNT })),
      ],
      rows: harassmentRows,
      subtotalRows: harassmentTotals,
    },
    {
      name: 'Harassment By Year',
      title: 'Harassment By Year',
      subtitle: 'All types of harassment; rates per 100 students',
      columns: [
        yearColumn,
        enrollmentColumn,
        ...harassmentMeasures.flatMap(([header]) => [{ header, width: 14, format: COUNT }, ...per100Columns(header)]),
      ],
      rows: years(entity.harassment).map(year => {
        const rows = harassmentIn(year);
        const stateRows = stateHarassmentIn(year);
        return [
          formatSchoolYear(year),
          own.enrolled(year),
          ...harassmentMeasures.flatMap(([, value]) => [
            sum(rows, value), own.per100(sum(rows, value), year), stateRows.length ? nhRates.per100(sum(stateRows, value), year) : null,
          ]),
        ];
      }),
    },
    {
      name: 'Restraints',
      subtitle: 'Times school staff physically held a student to prevent harm',
      columns: [
        yearColumn,
        enrollmentColumn,
        { header: 'Restraints', format: COUNT },
        ...per100Columns('Restraints'),
        { header: 'Resulting in Bodily Injury', width: 16, format: COUNT },
        { header: 'Resulting in Serious Injury or Death', width: 18, format: COUNT },
        { header: 'Active Investigations', width: 14, format: COUNT },
        { header: 'Closed Investigations', width: 14, format: COUNT },
      ],
      rows: [...entity.restraint].sort((a, b) => a.year - b.year).map(row => [
        formatSchoolYear(row.year), own.enrolled(row.year), row.generated, own.per100(row.generated, row.year), nhRates.per100(stateRestraint.get(row.year), row.year),
        row.bodily_injury, row.serious_injury, row.active_investigation, row.closed_investigation,
      ]),
    },
    {
      name: 'Seclusions',
      subtitle: 'Times a student was placed alone in a room or area they couldn\'t leave',
      columns: [
        yearColumn,
        enrollmentColumn,
        { header: 'Seclusions', format: COUNT },
        ...per100Columns('Seclusions'),
        { header: 'Active Investigations', width: 14, format: COUNT },
        { header: 'Closed Investigations', width: 14, format: COUNT },
      ],
      rows: [...entity.seclusion].sort((a, b) => a.year - b.year).map(row => [
        formatSchoolYear(row.year), own.enrolled(row.year), row.generated, own.per100(row.generated, row.year), nhRates.per100(stateSeclusion.get(row.year), row.year),
        row.active_investigation, row.closed_investigation,
      ]),
    },
    {
      name: 'Suspensions By Year',
      title: 'Suspensions and Expulsions By Year',
      subtitle: 'Students who received each, with suspensions per 100 students',
      columns: [
        yearColumn,
        enrollmentColumn,
        { header: 'In-School Suspensions', width: 14, format: COUNT },
        { header: 'Out-of-School Suspensions', width: 16, format: COUNT },
        { header: 'All Suspensions', width: 14, format: COUNT },
        ...per100Columns('Suspensions'),
        ...per100Columns('In-School Suspensions'),
        ...per100Columns('Out-of-School Suspensions'),
        { header: 'Expelled', format: COUNT },
        { header: nh('Expelled'), format: COUNT },
      ],
      rows: years(entity.disciplineCount).map(year => {
        const suspended = suspensions(entity.disciplineCount, year);
        const nhSuspended = suspensions(state.disciplineCount, year);
        return [
          formatSchoolYear(year), own.enrolled(year), suspended.inSchool, suspended.outOfSchool, suspended.all,
          own.per100(suspended.all, year), nhRates.per100(nhSuspended.all, year),
          own.per100(suspended.inSchool, year), nhRates.per100(nhSuspended.inSchool, year),
          own.per100(suspended.outOfSchool, year), nhRates.per100(nhSuspended.outOfSchool, year),
          countOf(entity.disciplineCount, year, DISCIPLINE_COUNTS.expelled), countOf(state.disciplineCount, year, DISCIPLINE_COUNTS.expelled),
        ];
      }),
    },
    {
      name: 'Suspension Incidents',
      title: 'Incidents Resulting in Suspension',
      subtitle: 'Each school year, grouped as the page groups them, with New Hampshire\'s',
      columns: [
        yearColumn,
        { header: 'Incident Type', width: 44 },
        { header: 'Number', format: COUNT },
        { header: 'Per 100 Students', width: 14, format: PER_100 },
        { header: nh('Number'), format: COUNT },
        { header: nh('Per 100 Students'), width: 14, format: PER_100 },
      ],
      rows: incidentRows,
      subtotalRows: incidentTotals,
    },
    {
      name: 'Serious Incidents',
      title: 'Serious Safety Incidents',
      subtitle: data.kind === 'district'
        ? 'Firearms, assaults and other serious incidents each of the district\'s schools reported; types with none are left out'
        : 'Firearms, assaults and other serious incidents the school reported; types with none are left out',
      columns: seriousColumns,
      rows: serious.length
        ? serious.map(incident => [
          ...(data.kind === 'district' ? [incident.school ?? null] : []),
          formatSchoolYear(incident.year), incident.type, incident.count,
        ])
        : [['None reported']],
    },
    notesSheet(`${data.displayName} for ${title}`, [
      'Source: NH Department of Education, School Safety Data Collection and truancy reports, which schools file at the end of each school year.',
      'Truant students had 10 or more half-days of unexcused absence; the share is of enrollment. Truancy counts only unexcused absences, not chronic absenteeism.',
      'Rates per 100 students use the enrollment the state reports with its safety data. Columns starting "NH" are New Hampshire\'s figures for the same school year.',
      'Schools report bullying of any kind and cyber-bullying in separate columns. The page\'s All Types line adds the two together; this workbook keeps them apart.',
      'Suspension and expulsion counts are students who received each, not the number of suspensions. Incidents resulting in suspension are grouped as the page groups them.',
      'State law allows restraint and seclusion only when a student\'s behavior poses a substantial and imminent risk of serious bodily harm.',
      'Many schools were remote or hybrid in 2020-21, so that year\'s counts are low.',
      data.kind === 'district'
        ? 'Serious incidents are listed by school, as on the page. They are firearms incidents (handguns, rifles or shotguns, more than one type, possession or sale, and other) and other serious incidents (homicide, first-degree assault, arson, aggravated felonious sexual assault and robbery).'
        : 'Serious incidents are firearms incidents (handguns, rifles or shotguns, more than one type, possession or sale, and other) and other serious incidents (homicide, first-degree assault, arson, aggravated felonious sexual assault and robbery).',
    ]),
  ];
};
