import React, { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fixtureFor } from './stateApiFixtures';
import StateOverview from '../pages/StateOverview';
import StateAcademics from '../pages/StateAcademics';
import StateOutcomes from '../pages/StateOutcomes';
import StateFinancials from '../pages/StateFinancials';
import StateStaff from '../pages/StateStaff';
import StateEnrollment from '../pages/StateEnrollment';
import StateSafety from '../pages/StateSafety';
import StateEfa from '../pages/StateEfa';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api/utils/apiUtils')>();
  return { ...actual, fetchData: vi.fn() };
});

// Every request is answered from the fixtures; a request with no fixture fails the page loudly.
// Set before each test because the Vitest config resets mocks.
beforeEach(() => {
  vi.mocked(fetchData).mockImplementation(async (url: string) => {
    const fixture = fixtureFor(url);
    if (fixture === undefined) throw new Error(`No fixture for ${url}`);
    return structuredClone(fixture);
  });
});

const renderPage = (page: React.ReactElement) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Suspense fallback={null}>{page}</Suspense>
      </MemoryRouter>
    </Provider>
  );

const TIMEOUT = { timeout: 3000 };

describe('State pages', () => {
  it('overview summarizes the state in plain language', async () => {
    renderPage(<StateOverview />);

    const brief = await screen.findByText('In brief', undefined, TIMEOUT);
    const summary = within(brief.parentElement as HTMLElement);
    expect(summary.getByText('149,403 students attended New Hampshire public schools in 2024-25, down 9% from 2014-15.')).toBeInTheDocument();
    expect(summary.getByText(/^Schools spent \$21,000 per student in 2024-25, up 50% from 2014-15 \(up \d+% after inflation\)\.$/)).toBeInTheDocument();
    expect(summary.getByText('44% of students tested proficient in math and 55% in reading in 2025-26.')).toBeInTheDocument();
    expect(summary.getByText('87.5% of the class of 2025 graduated in four years, and 67% of graduates planned to go to college.')).toBeInTheDocument();
    expect(summary.getByText('12,500 students have Education Freedom Accounts for 2026-27.')).toBeInTheDocument();

    // Tiles link to the detail pages
    expect(screen.getByText('Proficient in math').closest('a')).toHaveAttribute('href', '/state/academic');
    expect(screen.getByText('10.7 students per teacher in 2024-25')).toBeInTheDocument();
    expect(screen.getByText('About $52 million in estimated state aid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Education Freedom Accounts' })).toHaveAttribute('href', '/state/efa');
  });

  it('academics lists proficiency by student group and grade', async () => {
    renderPage(<StateAcademics />);

    expect(await screen.findByText('Percent Proficient by Student Group, 2025-26', undefined, TIMEOUT)).toBeInTheDocument();
    const iepRow = screen.getByText('IEP/SWD').closest('tr')!;
    expect(within(iepRow).getByText('13%')).toBeInTheDocument();
    expect(within(iepRow).getByText('17%')).toBeInTheDocument();

    expect(screen.getByText('Percent Proficient by Grade, 2025-26')).toBeInTheDocument();
    expect(within(screen.getByText('Grade 3').closest('tr')!).getByText('54%')).toBeInTheDocument();
  });

  it('graduation lists the latest class plans', async () => {
    renderPage(<StateOutcomes />);
    expect(await screen.findByText('Plans of the Class of 2025', undefined, TIMEOUT)).toBeInTheDocument();
    const row = screen.getByText('Entering Four Year Colleges & Universities').closest('tr')!;
    expect(within(row).getByText('50.0%')).toBeInTheDocument();
  });

  it('financials split revenue by source', async () => {
    renderPage(<StateFinancials />);
    expect(await screen.findByText('Revenue by Source, 2024-25', undefined, TIMEOUT)).toBeInTheDocument();
    expect(within(screen.getByText('Local').closest('tr')!).getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('Total: $4,000')).toBeInTheDocument();
  });

  it('staff lists staff by type', async () => {
    renderPage(<StateStaff />);
    expect(await screen.findByText('Staff by Type, 2024-25', undefined, TIMEOUT)).toBeInTheDocument();
    expect(within(screen.getByText('Teacher').closest('tr')!).getByText('-7%')).toBeInTheDocument();
  });

  it('enrollment compares grades with five years earlier', async () => {
    renderPage(<StateEnrollment />);
    expect(await screen.findByText('Enrollment by Grade, 2025-26', undefined, TIMEOUT)).toBeInTheDocument();
    expect(within(screen.getByText('Kindergarten', { selector: 'td' }).closest('tr')!).getByText('+6%')).toBeInTheDocument();
  });

  it('safety lists serious incidents', async () => {
    renderPage(<StateSafety />);
    expect(await screen.findByText('Serious Safety Incidents by Year', undefined, TIMEOUT)).toBeInTheDocument();
    expect(within(screen.getByText('2024-25').closest('tr')!).getByText('3')).toBeInTheDocument();
  });

  it('EFA estimates aid by category', async () => {
    renderPage(<StateEfa />);
    expect(await screen.findByText('Aid by Category, 2026-27', undefined, TIMEOUT)).toBeInTheDocument();
    const baseAid = screen.getByText('Base Aid').closest('tr')!;
    expect(within(baseAid).getByText('$50,000,000')).toBeInTheDocument();
  });
});
