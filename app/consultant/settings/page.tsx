import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantProfiles } from "@/lib/db/schema";
import { saveBrandProfile } from "@/lib/consultant-actions";
import { BrandingForm } from "./branding-form";

/** Settings - White Label (#22): one-time setup. The live preview shows the
 *  request email exactly as a supplier receives it. */
export default async function ConsultantSettingsPage() {
  const user = await currentUser();
  const profile = await db.query.consultantProfiles.findFirst({
    where: eq(consultantProfiles.consultantId, user!.id),
  });
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Branding</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your brand is what suppliers see on portals, shared results, and emails - never ours.
        </p>
      </div>
      <BrandingForm
        action={saveBrandProfile}
        initial={{
          brandName: profile?.brandName ?? "",
          accentColor: profile?.accentColor ?? "#178B5A",
          replyTo: profile?.replyTo ?? "",
          logoUrl: profile?.logoUrl ?? null,
        }}
        fallbackName={user!.name}
        blobConfigured={blobConfigured}
      />
    </div>
  );
}
