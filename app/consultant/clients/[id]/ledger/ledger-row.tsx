"use client";

import { Pill } from "@/components/workflow";
import { fmtNum3 } from "@/lib/format";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import {
  recategorizeLineItem,
  editLineItemQuantity,
  excludeLineItemAction,
  restoreLineItem,
  addLineItemComment,
  markLineItemActual,
  attachEvidenceToItem,
} from "@/lib/consultant-actions";
import { VENDOR_CONFIRM_OPTIONS } from "@/lib/vendor-mappings";
import type { Trace } from "@/lib/trace";

type Item = {
  id: string;
  sourceRef: string;
  activityDate: string | null;
  scope: number;
  category: string;
  rawValue: string;
  rawUnit: string;
  co2eKg: string;
  status: string;
  period: string | null;
  confidence: string;
  flagReason: string | null;
  locationName?: string | null;
};

type Comment = { id: string; body: string; authorType: string; createdAt: string };

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  mapped: { background: "var(--primary-tint)", color: "var(--primary)" },
  unmapped: { background: "var(--warning-tint)", color: "var(--warning-strong)" },
  excluded: { background: "var(--divider)", color: "var(--text-muted)" },
};

function TraceField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-0.5">
      <dt className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="text-xs" style={{ color: "var(--text)" }}>{children}</dd>
    </div>
  );
}

export function LedgerRow({
  companyId,
  item,
  evidenceId,
  uploadName,
  uploadHref,
  comments = [],
  extraEvidence = [],
  trace,
}: {
  companyId: string;
  item: Item;
  evidenceId: string | null;
  uploadName: string | null;
  uploadHref: string | null;
  comments?: Comment[];
  extraEvidence?: string[];
  trace: Trace;
}) {
  const [editing, setEditing] = useState<"category" | "quantity" | "comment" | "actual" | "evidence" | "trace" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Optimistic copies of the server state. When a transition ends, React drops
  // these and falls back to the `item` prop, so a failed action rolls back.
  const [optimisticExcluded, setOptimisticExcluded] = useOptimistic(item.status === "excluded");
  const [optimisticCategory, setOptimisticCategory] = useOptimistic({ scope: item.scope, category: item.category });
  const excluded = optimisticExcluded;
  const restoring = !optimisticExcluded && item.status === "excluded";
  const displayStatus = excluded ? "excluded" : restoring ? "restoring…" : item.status;

  // Runs one small ledger change: apply the optimistic state, then the server action.
  const runChange = (apply: () => void, action: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      apply();
      try {
        await action();
      } catch {
        setError("Not saved. The row has been reverted - try again.");
      }
    });
  };

  return (
    <>
      <tr style={{ borderBottom: "1px solid var(--divider)", opacity: excluded ? 0.45 : 1 }}>
        <td className="px-4 py-2.5">
          <p className="font-medium" style={{ color: "var(--text)" }}>{item.sourceRef || " - "}</p>
          {item.locationName && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.locationName}</p>
          )}
          {item.flagReason && item.status === "unmapped" && (
            <p className="text-xs" style={{ color: "var(--warning-strong)" }}>Flagged: {item.flagReason}</p>
          )}
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs" style={{ color: "var(--text)" }}>
            S{optimisticCategory.scope} · {optimisticCategory.category.replace(/_/g, " ")}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right font-data text-xs" style={{ color: "var(--text)" }}>
          {fmtNum3(Number(item.rawValue))} {item.rawUnit}
        </td>
        <td className="px-4 py-2.5 text-right font-data" style={{ color: "var(--text)" }}>
          {item.status === "mapped" ? fmtNum3(Number(item.co2eKg) / 1000) : " - "}
        </td>
        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {item.activityDate ?? item.period ?? " - "}
        </td>
        <td className="px-4 py-2.5 text-xs">
          {uploadName ? (
            <span className="inline-flex items-center gap-1.5">
              {uploadHref ? (
                <a href={uploadHref} className="underline" style={{ color: "var(--text-muted)" }}>{uploadName}</a>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>{uploadName}</span>
              )}
              {evidenceId && (
                <a
                  href={`/api/evidence/${evidenceId}`}
                  className="underline"
                  style={{ color: "var(--primary)" }}
                  title="Download source file"
                  aria-label="Download source file"
                >
                  file
                </a>
              )}
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>manual</span>
          )}
        </td>
        <td className="px-4 py-2.5">
          <Pill style={STATUS_STYLE[displayStatus] ?? STATUS_STYLE.excluded}>
            {displayStatus}
          </Pill>
          {item.status === "mapped" && (
            <span
              className="ml-1 rounded px-1.5 py-0.5 text-xs"
              title={item.confidence === "actual" || item.confidence === "measured" ? "Actual / measured value" : "Estimated value - replace with the real number when it arrives"}
              style={
                item.confidence === "actual" || item.confidence === "measured"
                  ? { background: "var(--primary-tint)", color: "var(--primary)" }
                  : { background: "var(--warning-tint)", color: "var(--warning-strong)" }
              }
            >
              {item.confidence === "actual" || item.confidence === "measured" ? "A" : "E"}
            </span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              disabled={pending}
              onClick={() => setEditing(editing === "trace" ? null : "trace")}
              className="underline"
              style={{ color: "var(--primary)" }}
            >
              How calculated
            </button>
            {excluded ? (
              <button
                disabled={pending}
                onClick={() => runChange(() => setOptimisticExcluded(false), () => restoreLineItem(companyId, item.id))}
                className="underline"
                style={{ color: "var(--primary)" }}
              >
                Restore
              </button>
            ) : (
              <>
                <button
                  disabled={pending}
                  onClick={() => setEditing(editing === "category" ? null : "category")}
                  className="underline"
                  style={{ color: "var(--primary)" }}
                >
                  Category
                </button>
                {item.status === "mapped" && (
                  <button
                    disabled={pending}
                    onClick={() => setEditing(editing === "quantity" ? null : "quantity")}
                    className="underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Qty
                  </button>
                )}
                {item.status === "mapped" && item.confidence !== "actual" && item.confidence !== "measured" && (
                  <button
                    disabled={pending}
                    onClick={() => setEditing(editing === "actual" ? null : "actual")}
                    className="underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Mark actual
                  </button>
                )}
                <button
                  disabled={pending}
                  onClick={() => setEditing(editing === "comment" ? null : "comment")}
                  className="underline"
                  style={{ color: comments.length > 0 ? "var(--primary)" : "var(--text-muted)" }}
                >
                  notes{comments.length > 0 ? ` (${comments.length})` : ""}
                </button>
                <button
                  disabled={pending}
                  onClick={() => setEditing(editing === "evidence" ? null : "evidence")}
                  className="underline"
                  style={{ color: "var(--text-muted)" }}
                  title="Attach a source document to this row"
                >
                  attach{extraEvidence.length > 0 ? ` (${extraEvidence.length})` : ""}
                </button>
                <button
                  disabled={pending}
                  onClick={() => runChange(() => setOptimisticExcluded(true), () => excludeLineItemAction(companyId, item.id))}
                  className="underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  Exclude
                </button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-1 text-right text-xs" style={{ color: "var(--warning-strong)" }}>
              {error}
            </p>
          )}
        </td>
      </tr>
      {editing && (
        <tr style={{ borderBottom: "1px solid var(--divider)", background: "var(--bg)" }}>
          <td colSpan={8} className="px-4 py-3">
            {editing === "trace" ? (
              <div>
                <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <TraceField label="Activity">{trace.activity}</TraceField>
                  <TraceField label="Factor">
                    {trace.factorName ?? "Not recorded"}
                    <span className="block font-data" style={{ color: "var(--text-muted)" }}>
                      ID {trace.factorId ?? "Not recorded"}
                    </span>
                  </TraceField>
                  <TraceField label="Factor value">
                    <span className="font-data">
                      {trace.factorValue ?? "Not recorded"}
                      {trace.factorUnit ? ` ${trace.factorUnit}` : ""}
                    </span>
                  </TraceField>
                  <TraceField label="Factor year">{trace.factorYear ?? "Not recorded"}</TraceField>
                  <TraceField label="Source">
                    {trace.sourceUrl ? (
                      <a
                        href={trace.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "var(--primary)" }}
                      >
                        {trace.source ?? trace.sourceUrl}
                      </a>
                    ) : (
                      trace.source ?? "Not recorded"
                    )}
                  </TraceField>
                  <TraceField label="Method">{trace.method}</TraceField>
                  <TraceField label="Formula">
                    <span className="font-data">{trace.formula ?? "Not recorded"}</span>
                  </TraceField>
                  <TraceField label="Calculated at">
                    {trace.computedAt ? new Date(trace.computedAt).toLocaleString() : "Not recorded"}
                  </TraceField>
                </dl>
                <div className="mt-3">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Assumptions</p>
                  {trace.assumptions.length > 0 ? (
                    <ul className="mt-1 list-disc pl-4 text-xs" style={{ color: "var(--text)" }}>
                      {trace.assumptions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: "var(--text)" }}>Not recorded</p>
                  )}
                </div>
              </div>
            ) : editing === "category" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Recategorize as:</span>
                <select
                  className="input flex-1 text-xs"
                  style={{ maxWidth: "22rem" }}
                  defaultValue=""
                  disabled={pending}
                  onChange={(e) => {
                    const key = e.target.value;
                    const option = VENDOR_CONFIRM_OPTIONS.find((o) => o.key === key);
                    if (!option) return;
                    runChange(
                      () => setOptimisticCategory({ scope: option.scope, category: option.category }),
                      async () => {
                        await recategorizeLineItem(companyId, item.id, key);
                        setEditing(null);
                      }
                    );
                  }}
                >
                  <option value="" disabled>Pick a category…</option>
                  {VENDOR_CONFIRM_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Recomputes emissions with the matching factor; the correction is logged.
                </span>
              </div>
            ) : editing === "comment" ? (
              <div>
                {comments.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {comments.map((c) => (
                      <p key={c.id} className="text-xs" style={{ color: "var(--text)" }}>
                        <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
                          {c.authorType === "consultant" ? "You" : "Client"} · {new Date(c.createdAt).toLocaleDateString()}:
                        </span>{" "}
                        {c.body}
                      </p>
                    ))}
                  </div>
                )}
                <form
                  className="flex flex-wrap items-center gap-2"
                  action={(fd) =>
                    startTransition(async () => {
                      await addLineItemComment(companyId, item.id, fd);
                      setEditing(null);
                    })
                  }
                >
                  <input name="body" className="input flex-1 text-xs" placeholder="e.g. Does this figure include the delivery trucks?" autoFocus />
                  <button disabled={pending} className="btn btn-secondary px-3 py-1 text-xs">
                    {pending ? "Sending…" : "Comment (emails client)"}
                  </button>
                </form>
              </div>
            ) : editing === "actual" ? (
              <form
                className="flex flex-wrap items-center gap-2"
                action={(fd) =>
                  startTransition(async () => {
                    await markLineItemActual(companyId, item.id, fd);
                    setEditing(null);
                  })
                }
              >
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Replace estimate with the actual value ({item.rawUnit}) - leave blank to keep the number and just re-label:
                </span>
                <input name="quantity" type="number" step="any" min="0" placeholder={item.rawValue} className="input text-xs" style={{ maxWidth: "10rem" }} autoFocus />
                <button disabled={pending} className="btn btn-secondary px-3 py-1 text-xs">
                  {pending ? "Saving…" : "Mark actual"}
                </button>
              </form>
            ) : editing === "evidence" ? (
              <div>
                {extraEvidence.length > 0 && (
                  <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    Attached:{" "}
                    {extraEvidence.map((ev, i) => (
                      <a key={ev} href={`/api/evidence/${ev}`} className="underline" style={{ color: "var(--primary)" }}>
                        file {i + 1}{i < extraEvidence.length - 1 ? ", " : ""}
                      </a>
                    ))}
                  </p>
                )}
                <form
                  className="flex flex-wrap items-center gap-2"
                  action={(fd) =>
                    startTransition(async () => {
                      await attachEvidenceToItem(companyId, item.id, fd);
                      setEditing(null);
                    })
                  }
                >
                  <input name="file" type="file" className="input flex-1 text-xs" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" />
                  <button disabled={pending} className="btn btn-secondary px-3 py-1 text-xs">
                    {pending ? "Uploading…" : "Attach"}
                  </button>
                </form>
              </div>
            ) : (
              <form
                className="flex flex-wrap items-center gap-2"
                action={(fd) =>
                  startTransition(async () => {
                    await editLineItemQuantity(companyId, item.id, fd);
                    setEditing(null);
                  })
                }
              >
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Correct quantity ({item.rawUnit}):
                </span>
                <input
                  name="quantity"
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={Number(item.rawValue)}
                  className="input text-xs"
                  style={{ maxWidth: "10rem" }}
                  autoFocus
                />
                <button disabled={pending} className="btn btn-secondary px-3 py-1 text-xs">
                  {pending ? "Saving…" : "Save"}
                </button>
              </form>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
