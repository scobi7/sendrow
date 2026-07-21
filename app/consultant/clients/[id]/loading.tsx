/** Client detail + sub-pages (review, ledger, manage, snapshot) are the slowest
 *  loads (BUG-4); this skeleton covers all of them so none flash blank (BUG-3). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Loading">
      <div className="mb-4 h-4 w-24 animate-pulse rounded" style={{ background: "var(--divider)" }} />
      <div className="mb-6 flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-2xl" style={{ background: "var(--divider)" }} />
        <div className="space-y-2">
          <div className="h-6 w-56 animate-pulse rounded" style={{ background: "var(--divider)" }} />
          <div className="h-3 w-72 animate-pulse rounded" style={{ background: "var(--divider)" }} />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }} />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }} />
    </div>
  );
}
