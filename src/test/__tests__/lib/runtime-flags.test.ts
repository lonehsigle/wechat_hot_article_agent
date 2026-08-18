import { afterEach, describe, expect, it } from 'vitest';
import { isDemoDataAllowed } from '@/lib/runtime-flags';

const originalNodeEnv = process.env.NODE_ENV;
const originalAllowDemoData = process.env.ALLOW_DEMO_DATA;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalAllowDemoData === undefined) delete process.env.ALLOW_DEMO_DATA;
  else process.env.ALLOW_DEMO_DATA = originalAllowDemoData;
});

describe('runtime flags', () => {
  it('never enables demo data in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEMO_DATA = 'true';
    expect(isDemoDataAllowed()).toBe(false);
  });

  it('allows explicit demo data in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEMO_DATA = 'true';
    expect(isDemoDataAllowed()).toBe(true);
  });
});
