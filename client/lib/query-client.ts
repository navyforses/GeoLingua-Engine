import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";

/**
 * Gets the base URL for the Express API server (e.g., "https://your-replit-domain.replit.dev")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Try to get from Expo Constants extra (set in app.config.js)
  const extra = Constants.expoConfig?.extra;

  // Priority 1: Check app.config.js extra
  if (extra?.apiDomain) {
    return `https://${extra.apiDomain}/`;
  }

  // Priority 2: Check environment variable directly
  let host = process.env.EXPO_PUBLIC_DOMAIN || extra?.EXPO_PUBLIC_DOMAIN;
  if (host) {
    // Remove port suffix if present (Replit proxies port 5000 through main domain)
    host = host.replace(/:5000$/, "");
    return `https://${host}/`;
  }

  // Priority 3: For development with Metro bundler on same network
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const devHost = debuggerHost.split(":")[0];
    return `http://${devHost}:5000/`;
  }

  // Last resort fallback
  return "http://localhost:5000/";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
