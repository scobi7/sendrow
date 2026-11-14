/** Shown while any /consultant page fetches (BUG-3): prevents the blank-screen
 *  "is it frozen?" gap on cold loads. Generic enough for board, lists, forms. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] delayed-reveal" aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-8 w-56 rounded" style={{ background: "var(--divider)" }} />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl"
            style={{ background: "var(--card)", border: "1px solid var(--divider)", animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
