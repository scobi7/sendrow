"use client";

import { useState } from "react";
import { submitWaitlist, WaitlistSource } from "@/lib/waitlist";
import { isValidEmail } from "@/lib/waitlist-validation";

export function WaitlistForm({
  source,
  wantsDesignPartner,
  buttonLabel,
  placeholder = "Work email",
  buttonVariant = "primary",
  successMessage,
  helperText,
  className,
}: {
  source: WaitlistSource;
  wantsDesignPartner: boolean;
  buttonLabel: string;
  placeholder?: string;
  buttonVariant?: "primary" | "secondary";
  successMessage: string;
  helperText?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Enter a valid email address.");
      return;
    }
    setStatus("loading");
    const result = await submitWaitlist(email, source, wantsDesignPartner);
    if (result.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  if (status === "done") {
    return (
      <p className={className} style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
        {successMessage}
      </p>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="field"
          style={{ flex: 1, minWidth: 180 }}
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          aria-label={placeholder}
        />
        <button
          className={`btn ${buttonVariant === "primary" ? "btn-primary" : "btn-secondary"}`}
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending…" : buttonLabel}
        </button>
      </form>
      {status === "error" && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--danger)" }}>{error}</p>
      )}
      {status !== "error" && helperText && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{helperText}</p>
      )}
    </div>
  );
}
