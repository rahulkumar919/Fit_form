/** JSON request to an admin API route; throws with the server's message on failure. */
export async function adminSend<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message ?? "Something went wrong. Please try again.");
  return json.data as T;
}
