import { describe, it, expect } from 'vitest';
import { unwrapApiResponse, unwrapApiArray, apiResponse, HttpStatus } from '@/lib/utils/api-helper';

describe('api-helper', () => {
  describe('unwrapApiResponse', () => {
    it('returns data when success is true', () => {
      expect(unwrapApiResponse({ success: true, data: 42 }, 0)).toBe(42);
    });

    it('returns fallback when success is false', () => {
      expect(unwrapApiResponse({ success: false, error: 'fail' }, 0)).toBe(0);
    });

    it('returns fallback for null/undefined', () => {
      expect(unwrapApiResponse(null as any, 'fallback')).toBe('fallback');
    });

    it('casts plain object when success is undefined', () => {
      const plain = { foo: 'bar' };
      expect(unwrapApiResponse(plain as any, {})).toEqual(plain);
    });
  });

  describe('unwrapApiArray', () => {
    it('returns array directly', () => {
      expect(unwrapApiArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('unwraps success response with array data', () => {
      expect(unwrapApiArray({ success: true, data: [1, 2] })).toEqual([1, 2]);
    });

    it('returns empty array for non-array and invalid response', () => {
      expect(unwrapApiArray({ success: true, data: 'not-array' })).toEqual([]);
      expect(unwrapApiArray(null)).toEqual([]);
    });
  });

  describe('apiResponse', () => {
    it('success returns correct shape', () => {
      const res = apiResponse.success({ id: 1 });
      expect(res).toEqual({ success: true, data: { id: 1 } });
    });

    it('error returns correct shape with optional code', () => {
      expect(apiResponse.error('bad')).toEqual({ success: false, error: 'bad' });
      expect(apiResponse.error('bad', 400)).toEqual({ success: false, error: 'bad', code: 400 });
    });

    it('paginated returns pagination metadata', () => {
      const res = apiResponse.paginated([1, 2], 10, 1, 5);
      expect(res.success).toBe(true);
      expect(res.data).toEqual([1, 2]);
      expect(res.pagination.total).toBe(10);
      expect(res.pagination.totalPages).toBe(2);
    });
  });

  describe('HttpStatus', () => {
    it('has expected status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.INTERNAL_ERROR).toBe(500);
    });
  });
});
