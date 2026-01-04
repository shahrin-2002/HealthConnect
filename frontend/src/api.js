const BASE = "http://localhost:9358";

export async function api(path, method, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    throw new Error("Request failed");
  }

  return res.json();
}
