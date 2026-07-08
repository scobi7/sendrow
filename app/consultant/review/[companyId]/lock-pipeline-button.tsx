"use client";

import { useState, useTransition } from "react";
import { lockPipeline } from "@/lib/consultant-actions";

export function LockPipelineButton({ companyId }: { companyId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button className="btn btn-secondary text-sm" onClick={() => setConfirm(true)}>
        Lock pipeline
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        className="input text-sm w-56"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn btn-primary text-sm"
          disabled={isPending}
          onClick={() => startTransition(() => lockPipeline(companyId, notes))}
        >
          {isPending ? "Locking…" : "Confirm lock"}
        </button>
        <button className="btn btn-secondary text-sm" onClick={() => setConfirm(false)}>Cancel</button>
      </div>
    </div>
  );
}
