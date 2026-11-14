"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { unarchiveClient } from "@/lib/actions";

const UNDO_WINDOW_MS = 8000;
const MOTION_MS = 200;

/** Shown after archiving a client. Archive is reversible, so it has no confirm
 *  dialog; this toast offers Undo for a few seconds instead. */
export function UndoToast({ companyId, name }: { companyId: string; name: string }) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [gone, setGone] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Fade out, then clear the ?archived= param so a refresh does not show it again.
  const dismiss = () => {
    clearTimer();
    setEntered(false);
    timer.current = setTimeout(() => {
      setGone(true);
      router.replace("/consultant");
    }, MOTION_MS);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    timer.current = setTimeout(dismiss, UNDO_WINDOW_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimer();
    };
  }, []);

  async function undo() {
    clearTimer();
    setPending(true);
    try {
      await unarchiveClient(companyId);
      router.refresh();
      setGone(true);
      router.replace("/consultant");
    } catch {
      // Say so instead of vanishing: the client is still archived.
      setPending(false);
      setFailed(true);
      timer.current = setTimeout(dismiss, UNDO_WINDOW_MS);
    }
  }

  if (gone) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto card flex items-center gap-3 px-4 py-3 text-sm transition duration-200 ease-out ${
          entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        style={{ color: "var(--text)", boxShadow: "var(--shadow-raised)" }}
      >
        <span>{failed ? `Undo failed. ${name} is still archived.` : `Archived ${name}.`}</span>
        {!failed && (
        <button
          type="button"
          onClick={undo}
          disabled={pending}
          className="btn btn-secondary px-3 py-1 text-xs"
        >
          Undo
        </button>
        )}
      </div>
    </div>
  );
}
