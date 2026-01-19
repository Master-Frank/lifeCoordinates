export async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = typeof json?.message === "string" ? json.message : `HTTP_${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = typeof json?.message === "string" ? json.message : `HTTP_${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

