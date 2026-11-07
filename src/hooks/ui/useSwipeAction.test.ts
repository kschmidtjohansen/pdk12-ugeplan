import { describe, it, expect } from 'vitest';
import { resolveSwipe } from './useSwipeAction';

describe('resolveSwipe', () => {
  it('swipe til højre over tærsklen = publicér-retning', () => expect(resolveSwipe(120, 10)).toBe('right'));
  it('swipe til venstre over tærsklen = slet-retning', () => expect(resolveSwipe(-120, 5)).toBe('left'));
  it('kort træk udløser intet', () => expect(resolveSwipe(60, 0)).toBeNull());
  it('lodret scroll udløser intet', () => expect(resolveSwipe(110, 150)).toBeNull());
});
