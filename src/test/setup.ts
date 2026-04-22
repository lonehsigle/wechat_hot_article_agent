import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mutable router mock so tests can spy on push
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock DOMPurify for server-side
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const cookieStore: Record<string, string> = {};
      return {
        status: init?.status || 200,
        body,
        init,
        json: async () => body,
        text: async () => JSON.stringify(body),
        cookies: {
          get: vi.fn((name: string) => (cookieStore[name] ? { value: cookieStore[name] } : undefined)),
          set: vi.fn((name: string, value: string) => { cookieStore[name] = value; }),
          delete: vi.fn((name: string) => { delete cookieStore[name]; }),
        },
      };
    },
  },
}));

// Global fetch mock fallback
global.fetch = vi.fn();
