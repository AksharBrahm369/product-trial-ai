const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function parseJsonResponse(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 404) {
      throw new Error(
        "API not found. Set OPENAI_API_KEY in your host (Vercel/Netlify) environment variables and redeploy."
      );
    }
    const preview = text.replace(/\s+/g, " ").slice(0, 100);
    throw new Error(
      `Server returned an invalid response (${res.status}). ${preview}`
    );
  }
}
