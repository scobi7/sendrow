"use client";

import { useState } from "react";

export function RequestNewLink({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  return state === "sent" ? (
    <p className="mt-4 text-sm font-medium" style={{ color: "var(--primary)" }}>
      ✓ Done - your consultant has been notified and will send you a fresh link.
    </p>
  ) : (
    <div className="mt-6">
      <button
        className="btn btn-primary text-sm"
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending");
          try {
            const res = await fetch("/api/portal/request-new-link", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            setState(res.ok ? "sent" : "error");
          } catch {
            setState("error");
          }
        }}
      >
        {state === "sending" ? "Sending…" : "Request a new link"}
      </button>
      {state === "error" && (
        <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
          Couldn&apos;t send - please contact your consultant directly.
        </p>
      )}
    </div>
  );
}
