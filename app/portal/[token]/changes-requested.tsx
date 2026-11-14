/** Uploads the consultant sent back with a note (intake status needs_info).
 *  Shown above the checklist so the supplier sees what to fix first. */
export function ChangesRequested({ items }: { items: { id: string; filename: string; note: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8 rounded p-5" style={{ background: "var(--card)", borderLeft: "3px solid var(--warning)" }}>
      <h2 className="text-base font-bold font-display" style={{ color: "var(--text)" }}>
        Your consultant asked for changes
      </h2>
      <ul className="mt-3 space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.filename}</p>
            {item.note && (
              <p className="mt-1 whitespace-pre-line text-sm" style={{ color: "var(--text-muted)" }}>{item.note}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Upload a corrected file in the checklist below. No account needed.
      </p>
    </section>
  );
}
