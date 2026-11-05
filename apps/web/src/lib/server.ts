import "server-only";

// Server-side API access for Server Components (public data only — no session).

const DEMO_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.NEXT_PUBLIC_APP_URL;
const API_URL = process.env.API_INTERNAL_URL || (process.env.DEMO_MODE === "true" ? DEMO_URL : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:4000";

export async function fetchPublic<T>(path: string, revalidateSeconds = 60): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: revalidateSeconds } });
    if (!response.ok) return null;
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}
