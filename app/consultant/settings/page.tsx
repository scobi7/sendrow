import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantProfiles } from "@/lib/db/schema";
import { saveBrandProfile } from "@/lib/consultant-actions";
import { PageHeader } from "@/components/ui";

export default async function ConsultantSettingsPage() {
  const user = await currentUser();
  const profile = await db.query.consultantProfiles.findFirst({
    where: eq(consultantProfiles.consultantId, user!.id),
  });
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Practice Settings"
        subtitle="Your brand is what clients see on portals, shared results, and emails — never ours."
      />

      <form action={saveBrandProfile} className="card space-y-4">
        <div>
          <label className="label">Brand name</label>
          <input
            name="brand_name"
            defaultValue={profile?.brandName ?? ""}
            className="input"
            placeholder="Meridian Climate Advisory"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Shown to clients in place of your personal name. Leave blank to use your name.
          </p>
        </div>

        <div>
          <label className="label">Accent color</label>
          <div className="flex items-center gap-3">
            <input
              name="accent_color"
              type="color"
              defaultValue={profile?.accentColor ?? "#3F6B4F"}
              className="h-9 w-16 cursor-pointer rounded border-0 p-0"
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Used on client-facing pages (buttons, highlights).
            </span>
          </div>
        </div>

        <div>
          <label className="label">Reply-to email</label>
          <input
            name="reply_to"
            type="email"
            defaultValue={profile?.replyTo ?? ""}
            className="input"
            placeholder="you@yourfirm.com"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Client replies to portal emails land here.
          </p>
        </div>

        <div>
          <label className="label">Logo</label>
          {profile?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoUrl} alt="Current logo" className="mb-2 h-10 w-auto rounded" />
          )}
          {blobConfigured ? (
            <input name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" className="input" />
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Logo upload needs file storage configured (BLOB_READ_WRITE_TOKEN). Brand name is used meanwhile.
            </p>
          )}
        </div>

        <button className="btn btn-primary w-full">Save brand</button>
      </form>
    </div>
  );
}
