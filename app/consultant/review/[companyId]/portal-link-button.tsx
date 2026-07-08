"use client";

import { useState } from "react";

export function PortalLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="text-xs font-medium underline"
      style={{ color: "var(--primary)" }}
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "✓ Copied" : "Copy portal link"}
    </button>
  );
}
