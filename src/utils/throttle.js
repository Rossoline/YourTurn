// Returns a throttled version of an async function
// Prevents rapid repeated calls within `delay` ms
export function createThrottle(delay = 1000) {
  let lastCall = 0;
  let pending = false;

  return async function throttled(fn) {
    const now = Date.now();

    if (pending || now - lastCall < delay) {
      return false;
    }

    pending = true;
    lastCall = now;

    try {
      await fn();
    } finally {
      pending = false;
    }

    return true;
  };
}
