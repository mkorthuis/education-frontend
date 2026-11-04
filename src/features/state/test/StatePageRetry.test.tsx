import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fixtureFor } from './stateApiFixtures';
import StateEfa from '../pages/StateEfa';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api/utils/apiUtils')>();
  return { ...actual, fetchData: vi.fn() };
});

const FAILING_PATH = 'education-freedom-account/state-entry';
let failuresLeft = 0;

beforeEach(() => {
  vi.mocked(fetchData).mockImplementation(async (url: string) => {
    if (url.includes(FAILING_PATH) && failuresLeft > 0) {
      failuresLeft -= 1;
      throw new Error('Network Error');
    }
    return structuredClone(fixtureFor(url));
  });
});

describe('State page load errors', () => {
  it('shows an error with Retry, and Retry loads the page', async () => {
    failuresLeft = 1;
    render(
      <Provider store={store}>
        <MemoryRouter>
          <StateEfa />
        </MemoryRouter>
      </Provider>
    );

    expect(await screen.findByText('Statewide Education Freedom Account data could not be loaded.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Aid by category, 2026-27 (preliminary)')).toBeInTheDocument();
    expect(screen.queryByText('Statewide Education Freedom Account data could not be loaded.')).not.toBeInTheDocument();
  });
});
