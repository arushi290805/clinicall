const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function apiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data && (data.message || data.error)) || `Request failed (${response.status})`
    );
  }
  return data as T;
}
