"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_STATUS_LABEL, type SiteRollup } from "@/lib/locations";

export type SiteView = {
  id: string;
  label: string;
  regionLabel: string;
  contactName: string | null;
  contactEmail: string | null;
  rollup: SiteRollup;
};

/** CFO delegation panel (Plan MO2/MO5): send each site's contact their own
 *  upload link, watch per-site status, see the combined total - all from the
 *  same magic link, no account. */
export function SiteDelegation({ token, sites, totalKg }: { token: string; sites: SiteView[]; totalKg: number }) {
  const router = useRouter();
  const [emails, setEmails] = useState<Record<string, string>>(() =>
    Object.fromEntries(sites.map((s) => [s.id, s.contactEmail ?? ""]))
  );
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});

  async function sendLink(site: SiteView) {
    setBusy(site.id);
    try {
      const res = await fetch("/api/portal/delegate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          locationId: site.id,
          contactEmail: emails[site.id] ?? "",
          message: messages[site.id] ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice((n) => ({ ...n, [site.id]: data.error ?? "Something went wrong - try again" }));
        return;
      }
      setNotice((n) => ({
        ...n,
        [site.id]: data.emailed ? `Link ${data.created ? "sent" : "re-sent"} to your site contact` : "Link created - copy it below and share it with the site",
      }));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <div className="mb-8 rounded-2xl" style={{ background: "var(--card)" }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Your locations</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          You don&apos;t have to gather every site&apos;s data yourself - send each office or plant its own secure upload link.
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
        {sites.map((site) => {
          const r = site.rollup;
          return (
            <div key={site.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                    {site.label}
                    <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{site.regionLabel} grid</span>
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {SITE_STATUS_LABEL[r.status]}
                    {r.itemsTotal > 0 && ` · ${r.itemsReceived}/${r.itemsTotal} items in`}
                    {r.co2eKg > 0 && ` · ${fmt(r.co2eKg / 1000)} tCO2e`}
                  </p>
                </div>
                {r.status === "complete" && (
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                    Done
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Site contact email(s) - comma-separate for more than one"
                  value={emails[site.id] ?? ""}
                  onChange={(e) => setEmails((m) => ({ ...m, [site.id]: e.target.value }))}
                  className="rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ background: "var(--bg)", border: "1px solid var(--divider)", color: "var(--text)", width: "20rem" }}
                />
                <input
                  type="text"
                  placeholder="Add a note for them (optional)"
                  value={messages[site.id] ?? ""}
                  onChange={(e) => setMessages((m) => ({ ...m, [site.id]: e.target.value }))}
                  maxLength={500}
                  className="rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ background: "var(--bg)", border: "1px solid var(--divider)", color: "var(--text)", width: "16rem" }}
                />
                <button
                  onClick={() => sendLink(site)}
                  disabled={busy === site.id || !(emails[site.id] ?? "").includes("@")}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {busy === site.id ? "Sending…" : r.status === "no_link" ? "Send upload link" : "Re-send link"}
                </button>
                {r.token && (
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal/${r.token}`)}
                    className="text-xs underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Copy site link
                  </button>
                )}
              </div>
              {notice[site.id] && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--primary)" }}>{notice[site.id]}</p>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>All locations so far</p>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{fmt(totalKg / 1000)} tCO2e</p>
        </div>
      </div>
    </div>
  );
}
