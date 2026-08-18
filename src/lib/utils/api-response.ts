import { NextResponse } from 'next/server';

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 500) {
  const publicMessage = status === 500 && process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : message;
  return NextResponse.json({ success: false, error: publicMessage }, { status });
}

export function withErrorHandler<TArgs extends unknown[], TResult>(
  handler: (request: Request, ...args: TArgs) => TResult | Promise<TResult>
) {
  return async function(request: Request, ...args: TArgs) {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse('服务器内部错误', 500);
    }
  };
}
