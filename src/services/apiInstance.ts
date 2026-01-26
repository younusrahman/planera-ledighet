// Define your .NET API URL here
export const BASE_URL = "https://localhost:7040/api";

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Prepend the BASE_URL to the relative path (e.g., /api/leaves)
  const fullUrl = url.startsWith("http")
    ? url
    : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  // --- START OF FIX ---
  const headers: Record<string, string> = {};

  // If the body is NOT FormData, we want to use JSON.
  // If the body IS FormData (file upload), we leave Content-Type empty
  // so the browser can automatically set it with the correct "boundary".
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  // --- END OF FIX ---

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!res.ok) {
    // Attempt to get error message from your .NET Controller
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${res.status}`);
  }

  // Handle empty responses (NoContent / 204)
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}
