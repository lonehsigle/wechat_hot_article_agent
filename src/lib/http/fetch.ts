const DEFAULT_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort(init.signal?.reason);

  if (init.signal?.aborted) abortFromCaller();
  else init.signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function readResponseBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = response.headers?.get?.('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new Error(`响应内容超过 ${maxBytes} 字节限制`);
  }

  if (!response.body) {
    const bytes = typeof response.arrayBuffer === 'function'
      ? new Uint8Array(await response.arrayBuffer())
      : new TextEncoder().encode(await response.text());
    if (bytes.byteLength > maxBytes) throw new Error(`响应内容超过 ${maxBytes} 字节限制`);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`响应内容超过 ${maxBytes} 字节限制`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readResponseText(response: Response, maxBytes: number): Promise<string> {
  return new TextDecoder().decode(await readResponseBytes(response, maxBytes));
}

export async function readJsonResponse<T = Record<string, any>>(
  response: Response,
  maxBytes: number = 10 * 1024 * 1024
): Promise<T> {
  if (!response.ok) {
    throw new Error(`上游服务请求失败: ${response.status}`);
  }

  const text = await readResponseText(response, maxBytes);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('上游服务返回了无效 JSON');
  }
}
