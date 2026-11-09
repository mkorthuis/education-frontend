import { District, School, Town } from '@/store/slices/locationSlice';
import { documentTitle, subjectOf } from '../usePageTracking';

const concord = { id: 111, name: 'Concord' } as District;
const rundlett = { id: 5, name: 'Rundlett Middle School', town_id: 9, city: 'CONCORD' } as School;
const towns: Town[] = [{ id: 9, name: 'Concord' } as Town];

describe('page titles', () => {
  it('name the district or school once it has loaded', () => {
    expect(documentTitle('/district/111/financials', subjectOf('/district/111/financials', concord, null, []))).toBe(
      'Financials – Concord School District | NH Education Facts'
    );
    expect(documentTitle('/district/111', subjectOf('/district/111', concord, null, []))).toBe('Concord School District | NH Education Facts');
    expect(documentTitle('/school/5/academic/math', subjectOf('/school/5/academic/math', concord, rundlett, towns))).toBe(
      'Academic Performance – Rundlett Middle School, Concord | NH Education Facts'
    );
    // The school's city when its town isn't among the district's towns
    expect(subjectOf('/school/5', concord, rundlett, [])).toBe('Rundlett Middle School, Concord');
  });

  it('leave the name out until the right district or school is loaded', () => {
    expect(subjectOf('/district/23', concord, null, [])).toBeUndefined();
    expect(documentTitle('/district/23/staff', undefined)).toBe('Staff | NH Education Facts');
  });

  it('keep general and statewide titles, and the site name elsewhere', () => {
    expect(documentTitle('/', undefined)).toBe('NH Education Facts');
    expect(documentTitle('/about', undefined)).toBe('About Us | NH Education Facts');
    expect(documentTitle('/state/academic/math', undefined)).toBe('Academic Performance – New Hampshire | NH Education Facts');
    expect(documentTitle('/no/such/page', undefined)).toBe('NH Education Facts');
  });
});
