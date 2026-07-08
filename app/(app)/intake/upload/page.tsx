import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scope3Screening } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import UploadForm from "./upload-form";

export default async function UploadPage() {
  const user = await currentUser();
  const companyId = user!.companyId;

  const screening = await db
    .select({ id: scope3Screening.id })
    .from(scope3Screening)
    .where(eq(scope3Screening.companyId, companyId))
    .limit(1);

  if (screening.length === 0) redirect("/scope3-screening?from=intake");

  return <UploadForm />;
}
