// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import Home from './page';

it('renders New York as an opening screen rather than an airport selection form', () => {
  render(<Home />);

  expect(screen.getByRole('heading', { name: 'Chefs Help Chefs' })).not.toBeNull();
  expect(screen.getByText('Smarter plans. More stars.')).not.toBeNull();
  expect(screen.getByRole('heading', { name: '纽约' })).not.toBeNull();
  expect(screen.getByRole('link', { name: '点击进入 →' }).getAttribute('href')).toBe('/new-york');
  expect(screen.getByText('更多城市即将开放')).not.toBeNull();
  expect(screen.queryByRole('heading', { name: '选择机场' })).toBeNull();
});
