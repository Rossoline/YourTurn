// Per-user rate limit for AI requests (stricter than general middleware).
// In-memory only — for multi-instance deploys use Upstash Redis or similar.

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

const buckets = new Map();

export function checkAiRateLimit(userId) {
  if (!userId) return { allowed: false, retryAfter: WINDOW_MS };

  const now = Date.now();
  const entry = buckets.get(userId);

  if (!entry || now - entry.start > WINDOW_MS) {
    buckets.set(userId, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = WINDOW_MS - (now - entry.start);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of buckets) {
      if (now - entry.start > WINDOW_MS * 2) buckets.delete(id);
    }
  }, WINDOW_MS);
}
