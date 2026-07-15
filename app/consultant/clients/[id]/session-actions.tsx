"use client";

import { useState, useTransition } from "react";
import { approveSession, flagSession, rejectSession } from "@/lib/consultant-actions";

export function SessionActions({ sessionId, companyId }: { sessionId: string; companyId: string }) {
  const [mode, setMode] = useState<"idle" | "flag">("idle");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (mode === "flag") {
    return (
      <div className="mt-3 space-y-2">
        <textarea
          className="input w-full resize-none text-sm"
          rows={2}
          placeholder="What does the client need to fix or provide?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="btn btn-primary text-xs px-3 py-1.5"
            disabled={isPending || !notes.trim()}
            onClick={() => startTransition(() => flagSession(sessionId, companyId, notes))}
          >
            Send
          </button>
          <button className="btn btn-secondary text-xs px-3 py-1.5" onClick={() => setMode("idle")}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        className="btn btn-primary text-xs px-3 py-1.5"
        disabled={isPending}
        onClick={() => startTransition(() => approveSession(sessionId, companyId))}
      >
        Approve
      </button>
      <button
        className="btn btn-secondary text-xs px-3 py-1.5"
        onClick={() => setMode("flag")}
      >
        Flag - needs info
      </button>
      <button
        className="btn btn-secondary text-xs px-3 py-1.5"
        disabled={isPending}
        onClick={() => startTransition(() => rejectSession(sessionId, companyId))}
        style={{ color: "var(--danger, var(--danger))" }}
      >
        Reject
      </button>
    </div>
  );
}
