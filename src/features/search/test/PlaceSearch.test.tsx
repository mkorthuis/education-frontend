import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { locationApi } from '@/services/api/endpoints/locations';
import PlaceSearch from '../PlaceSearch';

vi.mock('@/services/api/endpoints/locations', () => ({
  locationApi: { getDistricts: vi.fn(), getSchools: vi.fn(), getTowns: vi.fn() },
}));

// Set before each test because the Vitest config resets mocks
beforeEach(() => {
  vi.mocked(locationApi.getDistricts).mockResolvedValue([{ id: 223, name: 'Hampton', grades: [] }]);
  vi.mocked(locationApi.getSchools).mockResolvedValue([{ id: 5, name: 'Marston School', district_id: 223, city: 'HAMPTON', grades: [] }]);
});

const CurrentPath = () => <p>At {useLocation().pathname}</p>;

describe('Place search in the header', () => {
  it('finds districts and schools, not towns, and after a pick clears itself and says so', async () => {
    const onSelect = vi.fn();
    render(
      <MemoryRouter initialEntries={['/district/111']}>
        <PlaceSearch id="header-place-search" compact onSelect={onSelect} />
        <Routes><Route path="*" element={<CurrentPath />} /></Routes>
      </MemoryRouter>
    );
    // No visible label in the header; screen readers still get one
    const box = await screen.findByLabelText('District or school');
    expect(box).toHaveAttribute('placeholder', 'Search districts and schools');
    expect(locationApi.getTowns).not.toHaveBeenCalled();

    await userEvent.type(box, 'hampton');
    const results = await screen.findAllByRole('option');
    // The district, then a school in the town (found by its town), each with what it is
    expect(results.map(result => result.textContent)).toEqual(['HamptonDistrict', 'Marston SchoolHamptonSchool']);

    await userEvent.click(results[0]);
    expect(screen.getByText('At /district/223')).toBeInTheDocument();
    expect(box).toHaveValue('');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
