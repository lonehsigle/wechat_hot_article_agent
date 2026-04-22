import { vi } from 'vitest';

export function createMockDb() {
  const mockData: Record<string, unknown[]> = {};

  return {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => {
        let tableName: string;
        try {
          const { getTableName } = require('drizzle-orm');
          tableName = getTableName(table as Record<string, unknown>);
        } catch {
          tableName = (table as { name?: string }).name || 'default';
        }
        const data = mockData[tableName] || [];
        function createQuery(d: unknown[]) {
          const q: {
            limit: (n: number) => unknown[];
            orderBy: () => typeof q;
            then: (resolve: (v: unknown[]) => unknown) => unknown;
          } = {
            limit: (n: number) => d.slice(0, n),
            orderBy: () => q,
            then: (resolve: (v: unknown[]) => unknown) => resolve(d),
          };
          return q;
        }
        const query = createQuery(data);
        return {
          where: vi.fn(() => query),
          limit: vi.fn((n: number) => data.slice(0, n)),
          orderBy: vi.fn(() => query),
        };
      }),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((values: unknown) => ({
        returning: vi.fn(() => {
          const tableName = getTableNameSafe(table);
          const records = Array.isArray(values) ? values : [values];
          const inserted = records.map((r, i) => ({ id: i + 1, ...r }));
          mockData[tableName] = [...(mockData[tableName] || []), ...inserted];
          return inserted;
        }),
      })),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: unknown) => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => {
            const tableName = getTableNameSafe(table);
            const data = mockData[tableName] || [];
            if (data.length > 0) {
              const updated = { ...(data[0] as Record<string, unknown>), ...(values as Record<string, unknown>) };
              mockData[tableName] = [updated, ...data.slice(1)];
              return [updated];
            }
            return [];
          }),
        })),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(() => {
        const tableName = getTableNameSafe(table);
        mockData[tableName] = [];
        return Promise.resolve();
      }),
    })),
    _getData: (tableName: string) => mockData[tableName] || [],
    _setData: (tableName: string, data: unknown[]) => {
      mockData[tableName] = data;
    },
    _reset: () => {
      Object.keys(mockData).forEach((k) => delete mockData[k]);
    },
  };
}

function getTableNameSafe(table: unknown): string {
  try {
    const { getTableName } = require('drizzle-orm');
    return getTableName(table as Record<string, unknown>);
  } catch {
    return (table as { name?: string }).name || 'default';
  }
}

export function createApiRequest(url: string, init?: RequestInit): Request {
  const req = new Request(url, init);
  Object.defineProperty(req, 'nextUrl', {
    value: new URL(url),
    writable: true,
  });
  return req;
}

export const mockDb = createMockDb();
