"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function CheckoutSuccessPage() {
  const { session } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const redirectTo = searchParams.get("redirect") ?? "/dashboard";

    async function verify() {
      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Verification failed");
        await session?.reload();
        setStatus("success");
        router.push(redirectTo);
      } catch {
        setStatus("error");
      }
    }

    if (sessionId) verify();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
            <p style={{ color: "var(--text-muted)" }}>Confirming your payment…</p>
          </>
        )}
        {status === "success" && (
          <p style={{ color: "var(--text-muted)" }}>Payment confirmed! Redirecting…</p>
        )}
        {status === "error" && (
          <>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Something went wrong</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Your payment was received but we couldn&apos;t confirm it automatically.
              Please contact <a href="mailto:contact@sendrow.app" style={{ color: "var(--primary)" }}>contact@sendrow.app</a> and we&apos;ll fix it within the hour.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
