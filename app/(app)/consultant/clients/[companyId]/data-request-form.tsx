"use client";

import { useState, useTransition } from "react";
import { createDataRequest } from "@/lib/consultant-actions";

export function DataRequestForm({ companyId, consultantId }: { companyId: string; consultantId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!description.trim()) return;
    startTransition(async () => {
      await createDataRequest(companyId, consultantId, description, dueDate || null);
      setDescription("");
      setDueDate("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button className="btn btn-secondary text-sm" onClick={() => setOpen(true)}>
        + New request
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">What do you need from the client?</label>
        <textarea
          className="input w-full resize-none text-sm"
          rows={2}
          placeholder="e.g. Upload Q3 utility bills for all locations"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Due date (optional)</label>
        <input type="date" className="input text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary text-sm" disabled={isPending || !description.trim()} onClick={submit}>
          {isPending ? "Sending…" : "Send request"}
        </button>
        <button className="btn btn-secondary text-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
