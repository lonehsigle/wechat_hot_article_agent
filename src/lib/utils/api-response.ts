import { NextResponse } from 'next/server';

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function withErrorHandler(handler: Function) {
  return async function(request: Request, ...args: unknown[]) {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      const message = error instanceof Error ? error.message : '服务器内部错误';
      return errorResponse(message, 500);
    }
  };
}
