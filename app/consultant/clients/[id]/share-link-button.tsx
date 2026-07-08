"use client";

import { useState } from "react";

export function ShareLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="text-xs font-medium underline"
      style={{ color: "var(--primary)" }}
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "✓ Copied" : "Copy results link"}
    </button>
  );
}
