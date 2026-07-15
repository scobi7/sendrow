"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { approveFreezeAndGo, requestChanges } from "@/lib/workflow-actions";
import { SubmitButton } from "@/components/submit-button";

/** The wireframe's two verbs: Request changes / Approve, freeze & go to
 *  snapshot - plus the "1 item is still flagged" warning modal (popup, not a
 *  page) when approving over open flags. */
export function ApproveBar({
  companyId,
  openFlags,
  flagSummary,
  hasData,
}: {
  companyId: string;
  openFlags: number;
  flagSummary: string;
  hasData: boolean;
}) {
  const [showChanges, setShowChanges] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const year = new Date().getFullYear();

  return (
    <>
      <div className="card">
        {showChanges ? (
          <form
            action={async (fd) => {
              await requestChanges(companyId, fd);
              setShowChanges(false);
            }}
            className="space-y-3"
          >
            <label className="label">What needs to change?</label>
            <textarea
              name="note"
              rows={2}
              required
              className="input w-full resize-none text-sm"
              placeholder="e.g. March electricity looks like a partial month - can you re-upload the full bill?"
            />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              The supplier is emailed and can reply from their inbox or the same magic link - no account required.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowChanges(false)} className="btn btn-secondary text-sm">
                Cancel
              </button>
              <SubmitButton className="btn btn-primary text-sm" pendingText="Sending…">Send back</SubmitButton>
            </div>
          </form>
        ) : (
          <>
            <form ref={formRef} action={approveFreezeAndGo.bind(null, companyId)} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="open_flags" value={openFlags} />
              <div className="min-w-48 flex-1">
                <label className="label text-xs">Snapshot label</label>
                <input name="label" placeholder={`FY${year} footprint`} className="input text-sm" />
              </div>
              <button type="button" onClick={() => setShowChanges(true)} className="btn btn-secondary">
                Request changes
              </button>
              <ApproveButton
                disabled={!hasData}
                needsWarning={openFlags > 0}
                onWarn={() => setShowWarning(true)}
              />
            </form>
            {!hasData && (
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Nothing mapped yet - approve is enabled once at least one line item carries emissions.
              </p>
            )}
          </>
        )}
      </div>

      {showWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(18, 39, 28, 0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowWarning(false)}
        >
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-bold"
                style={{ background: "var(--warning-tint)", color: "var(--warning-strong)", border: "1px solid var(--warning-border)" }}
              >
                !
              </span>
              <div>
                <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>
                  {openFlags} item{openFlags !== 1 ? "s are" : " is"} still flagged
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {flagSummary}. You can still approve and freeze this snapshot with the flag{openFlags !== 1 ? "s" : ""} open -                   they stay visible on the record.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowWarning(false)} className="btn btn-secondary text-sm">
                Go back
              </button>
              <button
                onClick={() => {
                  setShowWarning(false);
                  formRef.current?.requestSubmit();
                }}
                className="btn btn-primary text-sm"
              >
                Approve with flag{openFlags !== 1 ? "s" : ""} open
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Submits directly when clean; opens the warning modal first when flags are open. */
function ApproveButton({ disabled, needsWarning, onWarn }: { disabled: boolean; needsWarning: boolean; onWarn: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type={needsWarning ? "button" : "submit"}
      disabled={disabled || pending}
      onClick={needsWarning ? onWarn : undefined}
      className="btn btn-primary"
      style={{ opacity: disabled || pending ? 0.6 : 1, cursor: pending ? "wait" : undefined }}
    >
      {pending ? "Freezing…" : "Approve, freeze & go to snapshot"}
    </button>
  );
}
