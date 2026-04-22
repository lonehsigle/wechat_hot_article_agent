import { describe, it, expect, vi } from 'vitest';

describe('Smoke Test - Testing Infrastructure', () => {
  it('vitest should work', () => {
    expect(true).toBe(true);
  });

  it('mock should work', () => {
    const fn = vi.fn();
    fn('hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('jest-dom matchers should work', () => {
    const div = document.createElement('div');
    div.classList.add('test');
    expect(div).toHaveClass('test');
  });
});
