const g = globalThis as unknown as {
  __gtRateLimit?: Map<string, { count: number; resetAt: number }>;
};

function store() {
  if (!g.__gtRateLimit) g.__gtRateLimit = new Map();
  return g.__gtRateLimit;
}

export function checkRateLimit(key: string, max = 10, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const map = store();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function resetRateLimit(key: string) {
  store().delete(key);
}
