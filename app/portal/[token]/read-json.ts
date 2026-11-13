/** Reads a response body as JSON without ever throwing "Unexpected end of
 *  JSON input" at the supplier - non-JSON failures (413s, crashes, timeouts)
 *  become actionable messages instead. When `fallbackError` is given, every
 *  non-JSON body maps to that message instead (for surfaces with their own copy). */
export async function readJson(res: Response, fallbackError?: string): Promise<{ error?: string; [k: string]: unknown }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (fallbackError) return { error: fallbackError };
    if (res.status === 413) {
      return { error: "That file is too large to send (about 4 MB max). Export a smaller date range, or type the numbers in instead." };
    }
    return { error: "The upload didn't go through - please try again. If it keeps failing, use “Type it in” and we'll take it from there." };
  }
}
