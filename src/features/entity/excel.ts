// Excel downloads for the district and school pages, on the State pages' pattern: one workbook per
// page, a sheet per chart or table, with New Hampshire's figures beside the district's or school's
// where the page compares them, then notes
import { districtTitle } from '@/features/district/utils/labels';
import { EntityKind } from './entity';

/** "Concord School District", or the school's own name, as the page titles say */
export const entityTitle = (kind: EntityKind, name: string): string => (kind === 'district' ? districtTitle(name) : name);

/** "concord-school-district-graduation.xlsx" */
export const entityFileName = (kind: EntityKind, name: string, page: string): string =>
  `${`${entityTitle(kind, name)} ${page}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.xlsx`;

/** A New Hampshire column's header beside the district's or school's: "NH Graduated (%)" */
export const nh = (header: string): string => `NH ${header}`;
