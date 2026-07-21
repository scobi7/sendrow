import Link from "next/link";
import { CompletenessMeter } from "./workflow";
import { PIPELINE_ORDER, STAGE_META, type PipelineStage } from "@/lib/client-status";

export type BoardCard = {
  id: string;
  name: string;
  contact: string | null;
  completeness: number;
  due: string | null;
  overdue: boolean;
  flags: number;
  stage: PipelineStage;
  sharedWith: string | null;
  next: { label: string; href: string };
};

const STAGE_ACCENT: Record<PipelineStage, string> = {
  new: "var(--text-muted)",
  requested: "var(--warning-strong)",
  responding: "var(--warning-strong)",
  review: "var(--primary)",
  approved: "var(--emerald)",
};

function fmtDue(d: string | null): string {
  if (!d) return "no due date";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Card({ card }: { card: BoardCard }) {
  const accent = STAGE_ACCENT[card.stage];
  return (
    <Link
      href={card.next.href}
      className="block rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: "var(--card)",
        border: "1px solid var(--divider)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{card.name}</p>
        {card.flags > 0 && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 font-data text-[10px] font-bold"
            style={{ background: "var(--danger-tint)", color: "var(--danger)" }}
          >
            {card.flags} flag{card.flags === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
        {card.contact ?? "no contact set"}
      </p>

      <div className="mt-3">
        <CompletenessMeter percent={card.completeness} compact />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: "var(--divider)" }}>
        {card.sharedWith ? (
          <span className="truncate font-data text-[11px]" style={{ color: "var(--emerald)" }}>
            shared to {card.sharedWith}
          </span>
        ) : (
          <span
            className="font-data text-[11px]"
            style={{ color: card.overdue ? "var(--danger)" : "var(--text-muted)" }}
          >
            {card.overdue ? "overdue " : "due "}{fmtDue(card.due)}
          </span>
        )}
        <span className="shrink-0 text-[11px] font-semibold" style={{ color: accent }}>
          {card.next.label} &rarr;
        </span>
      </div>
    </Link>
  );
}

export function PipelineBoard({ cards }: { cards: BoardCard[] }) {
  const byStage = (stage: PipelineStage) => cards.filter((c) => c.stage === stage);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {PIPELINE_ORDER.map((stage) => {
        const meta = STAGE_META[stage];
        const col = byStage(stage);
        return (
          <div key={stage} className="flex min-w-[232px] flex-1 flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full" style={{ background: STAGE_ACCENT[stage] }} />
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text)" }}>
                {meta.label}
              </span>
              <span className="font-data text-xs" style={{ color: "var(--text-muted)" }}>{col.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {col.length === 0 ? (
                <div
                  className="rounded-xl px-3 py-6 text-center text-xs"
                  style={{ border: "1px dashed var(--divider)", color: "var(--text-muted)" }}
                >
                  None
                </div>
              ) : (
                col.map((card) => <Card key={card.id} card={card} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
