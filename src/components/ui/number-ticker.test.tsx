import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NumberTicker } from './number-ticker';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('NumberTicker', () => {
  it('viser startværdien med det samme', () => {
    render(<NumberTicker value={7} data-testid="t" />);
    expect(screen.getByTestId('t').textContent).toBe('7');
  });
  it('ender altid på den rigtige værdi, også når animationen ikke får lov at køre (skjult fane)', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', () => 1);   // frames never arrive, as in a background tab
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const { rerender } = render(<NumberTicker value={0} data-testid="t" />);
    rerender(<NumberTicker value={4} data-testid="t" />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('t').textContent).toBe('4');
  });
});
