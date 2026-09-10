"use client";

const SESSION_KEY = "sendrow_anon_session";

function getSessionId(): string | null {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null; // private browsing / storage blocked - track anonymously without one
  }
}

/** Fire-and-forget homepage engagement beacon. Never blocks navigation and
 *  never throws - a dropped analytics event is not a user-facing failure. */
export function track(eventName: string): void {
  try {
    const body = JSON.stringify({
      eventName,
      path: window.location.pathname,
      sessionId: getSessionId(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // best-effort only
  }
}
