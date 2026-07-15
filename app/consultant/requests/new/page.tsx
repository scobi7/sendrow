import Link from "next/link";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, requestTemplates } from "@/lib/db/schema";
import { BackLink } from "@/components/workflow";
import { NewRequestForm } from "./request-form";

/** New Data Request (#1): the core loop starts here. Template-first - a
 *  saved setup skips every step below the dropdown. */
export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; template?: string }>;
}) {
  const [{ client: preselectedClient, template: preselectedTemplate }, rawUser] = await Promise.all([
    searchParams,
    currentUser(),
  ]);
  const user = rawUser!;

  const links = await db
    .select()
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));
  const ids = links.map((l) => l.companyId);

  const [clients, templates] = await Promise.all([
    ids.length
      ? db
          .select({ id: companies.id, name: companies.name, contactEmail: companies.clientContactEmail })
          .from(companies)
          .where(inArray(companies.id, ids))
      : Promise.resolve([]),
    db.select().from(requestTemplates).where(eq(requestTemplates.consultantId, user.id)),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink />
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>New data request</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          The supplier gets a magic link by email - no account needed to respond.
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="card py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Add a client first - requests are always addressed to one.{" "}
          <Link href="/consultant/clients/new" className="underline" style={{ color: "var(--primary)" }}>
            Add a client
          </Link>
        </div>
      ) : (
        <NewRequestForm
          clients={clients.sort((a, b) => a.name.localeCompare(b.name))}
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            dataTypes: (t.dataTypes as string[]) ?? [],
            periodLabel: t.periodLabel,
            dueInDays: t.dueInDays,
          }))}
          preselectedClient={preselectedClient ?? null}
          preselectedTemplate={preselectedTemplate ?? null}
        />
      )}
    </div>
  );
}
