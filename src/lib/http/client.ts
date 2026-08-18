export async function fetchApi(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) return response;

  const payload = await response.clone().json().catch(() => null) as { error?: unknown } | null;
  const message = typeof payload?.error === 'string' && payload.error.trim()
    ? payload.error
    : `请求失败 (${response.status})`;
  throw new Error(message);
}
