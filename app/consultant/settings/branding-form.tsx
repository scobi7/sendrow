"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

type Initial = { brandName: string; accentColor: string; replyTo: string; logoUrl: string | null };

export function BrandingForm({
  action,
  initial,
  fallbackName,
  blobConfigured,
}: {
  action: (formData: FormData) => Promise<void>;
  initial: Initial;
  fallbackName: string;
  blobConfigured: boolean;
}) {
  const [brandName, setBrandName] = useState(initial.brandName);
  const [accent, setAccent] = useState(initial.accentColor);
  const displayName = brandName.trim() || fallbackName;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} className="card h-fit space-y-4">
        <div>
          <label className="label">Display name</label>
          <input
            name="brand_name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="input"
            placeholder="Pacific Sustainability Advisors"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Shown to suppliers in place of your personal name. Leave blank to use your name.
          </p>
        </div>

        <div>
          <label className="label">Accent color</label>
          <div className="flex items-center gap-3">
            <input
              name="accent_color"
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded border-0 p-0"
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Used on supplier-facing pages and emails (buttons, highlights).
            </span>
          </div>
        </div>

        <div>
          <label className="label">Reply-to email</label>
          <input name="reply_to" type="email" defaultValue={initial.replyTo} className="input" placeholder="you@yourfirm.com" />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Supplier replies to portal emails land here.</p>
        </div>

        <div>
          <label className="label">Logo</label>
          {initial.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={initial.logoUrl} alt="Current logo" className="mb-2 h-10 w-auto rounded" />
          )}
          {blobConfigured ? (
            <input name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" className="input" />
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Logo upload needs file storage configured (BLOB_READ_WRITE_TOKEN). Display name is used meanwhile.
            </p>
          )}
        </div>

        <SubmitButton className="btn btn-primary w-full" pendingText="Saving…">Save branding</SubmitButton>
      </form>

      {/* Live preview — the request email as the supplier receives it */}
      <div>
        <p className="eyebrow mb-2">Preview — request email</p>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="rounded-xl bg-white px-6 py-6" style={{ border: "1px solid var(--divider)" }}>
            <div className="flex items-center gap-2.5">
              {initial.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initial.logoUrl} alt="" className="h-7 w-auto" />
              ) : (
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  {displayName[0]?.toUpperCase() ?? "S"}
                </span>
              )}
              <span className="text-sm font-semibold" style={{ color: "#17211C" }}>{displayName}</span>
            </div>
            <div className="mt-5 space-y-3 text-sm" style={{ color: "#374151" }}>
              <p>Hi Priya,</p>
              <p>
                <strong>{displayName}</strong> is requesting your Q1 2026 emissions data. It only takes a few minutes.
              </p>
              <p>
                <span
                  className="inline-block rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{ background: accent }}
                >
                  Answer now →
                </span>
              </p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                No account or password needed — the link is unique to you.
              </p>
            </div>
            <p className="mt-6 border-t pt-3 text-[11px]" style={{ borderColor: "#E5E7EB", color: "#9CA3AF" }}>
              Powered by sendrow — a secure way to share data with your customers
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Name and accent update live; logo appears after saving.
        </p>
      </div>
    </div>
  );
}
