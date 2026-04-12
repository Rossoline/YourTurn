// Simple in-memory rate limiter for middleware
// Works per-instance; for multi-instance (Vercel serverless) use Upstash Redis
const requests = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // per window

export function rateLimit(ip) {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    requests.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of requests) {
      if (now - entry.start > WINDOW_MS * 2) {
        requests.delete(ip);
      }
    }
  }, WINDOW_MS);
}
