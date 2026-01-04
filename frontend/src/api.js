const API_BASE = "http://127.0.0.1:9358";

export async function api(path, method = "GET", body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
