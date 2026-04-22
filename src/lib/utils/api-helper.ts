interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export function unwrapApiResponse<T>(response: ApiResponse<T>, fallback: T): T {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  if (response && response.success === undefined && response.data === undefined) {
    return response as unknown as T;
  }
  return fallback;
}

export function unwrapApiArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    const apiResp = response as { success: boolean; data: unknown };
    if (apiResp.success && Array.isArray(apiResp.data)) return apiResp.data as T[];
  }
  return [];
}
