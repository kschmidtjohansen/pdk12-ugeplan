import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NumberTicker } from './number-ticker';

describe('NumberTicker', () => {
  it('viser startværdien med det samme', () => {
    render(<NumberTicker value={7} data-testid="t" />);
    expect(screen.getByTestId('t').textContent).toBe('7');
  });
});
