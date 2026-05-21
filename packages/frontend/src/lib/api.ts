import { useAuth } from "@clerk/clerk-react";

export function useAuthedFetch() {
  const { getToken } = useAuth();

  return async function authedFetch(
    input: string,
    init: RequestInit = {}
  ) {
    const token = await getToken();

    const headers = new Headers(init.headers);

    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

    return fetch(`${baseUrl}${input}`, {
      ...init,
      headers,
    });
  };
}