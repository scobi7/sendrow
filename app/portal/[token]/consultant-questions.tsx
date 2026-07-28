"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type QuestionThread = {
  lineItemId: string;
  figure: string; // e.g. "PG&E acct 8823 - 4,450 kWh (2025-07)"
  messages: { authorType: string; body: string; createdAt: string }[];
};

/** "Questions from your consultant" (Z2): consultant comments on specific figures
 *  surfaced on the portal so the supplier can see + answer them without an account. */
export function ConsultantQuestions({ token, threads }: { token: string; threads: QuestionThread[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<string[]>([]);

  async function reply(lineItemId: string) {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/line-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lineItemId, message: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not send");
      }
      setSentIds((s) => [...s, lineItemId]);
      setOpenId(null);
      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send - please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (threads.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl p-5" style={{ background: "var(--warning-tint)", border: "1px solid var(--warning-border, var(--divider))" }}>
      <p className="text-sm font-bold" style={{ color: "var(--warning-strong)" }}>
        Questions from your consultant
      </p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
        Your consultant has a question about specific numbers you sent. A quick answer keeps things moving.
      </p>
      <div className="mt-4 space-y-3">
        {threads.map((t) => (
          <div key={t.lineItemId} className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{t.figure}</p>
            <div className="mt-2 space-y-1.5">
              {t.messages.map((m, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                  <span className="font-semibold" style={{ color: m.authorType === "supplier" ? "var(--text-muted)" : "var(--primary)" }}>
                    {m.authorType === "supplier" ? "You" : "Your consultant"}:
                  </span>{" "}
                  {m.body}
                  <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>· {m.createdAt.slice(0, 10)}</span>
                </p>
              ))}
            </div>
            {sentIds.includes(t.lineItemId) ? (
              <p className="mt-2 text-xs" style={{ color: "var(--primary)" }}>✓ Reply sent.</p>
            ) : openId === t.lineItemId ? (
              <div className="mt-2">
                <textarea
                  className="input w-full text-xs"
                  rows={2}
                  placeholder="Answer your consultant..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
                <div className="mt-1.5 flex items-center gap-3">
                  <button className="btn btn-primary px-3 py-1 text-xs" disabled={busy || !text.trim()} onClick={() => reply(t.lineItemId)}>
                    {busy ? "Sending…" : "Send reply"}
                  </button>
                  <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => { setOpenId(null); setText(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="mt-2 text-xs font-semibold underline" style={{ color: "var(--primary)" }} onClick={() => { setOpenId(t.lineItemId); setText(""); }}>
                Reply
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
