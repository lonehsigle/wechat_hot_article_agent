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

/**
 * 标准 API 响应模板
 * 统一所有 API 路由的返回格式
 */
export const apiResponse = {
  /**
   * 成功响应
   */
  success: <T>(data: T): { success: true; data: T } => ({
    success: true as const,
    data,
  }),

  /**
   * 错误响应
   */
  error: (message: string, code?: number): { success: false; error: string; code?: number } => ({
    success: false as const,
    error: message,
    ...(code !== undefined ? { code } : {}),
  }),

  /**
   * 分页响应
   */
  paginated: <T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ): {
    success: true;
    data: T[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  } => ({
    success: true as const,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }),

  /**
   * 创建 NextResponse 的辅助方法
   */
  json: <T>(body: T, init?: ResponseInit) => {
    // 仅服务端可用，实际在 API 路由中配合 NextResponse.json 使用
    return { body, init };
  },
};

/**
 * HTTP 状态码常量
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
