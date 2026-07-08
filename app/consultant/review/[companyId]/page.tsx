import { redirect } from "next/navigation";

/** The per-client review workspace merged into /consultant/clients/[id] (Plan N2).
 *  This route survives so older email links keep working. */
export default async function LegacyReviewRedirect({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  redirect(`/consultant/clients/${companyId}`);
}
