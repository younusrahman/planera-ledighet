// Define your .NET API URL here
// Usually https://localhost:7xxx (check your .NET project launchSettings.json)
const BASE_URL = "https://localhost:7040/api";

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Prepend the BASE_URL to the relative path (e.g., /api/leaves)
  const fullUrl = url.startsWith("http")
    ? url
    : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    // Attempt to get error message from your .NET Controller (like the Collision check)
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${res.status}`);
  }

  // Handle empty responses (NoContent / 204)
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}
