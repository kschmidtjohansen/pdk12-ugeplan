import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './button';
afterEach(cleanup);
describe('Fælles knapkontrakt', () => {
  it('blokerer handlingen mens den indlæser', () => {
    const click = vi.fn();
    render(<Button loading onClick={click}>Gem</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  it('bevarer asChild-link og normale klik', () => {
    const click = vi.fn();
    render(<Button asChild onClick={click}><a href="/planner">Ugeplan</a></Button>);
    fireEvent.click(screen.getByRole('link'));
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/planner');
  });
});