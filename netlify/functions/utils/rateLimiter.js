// Simple in-memory rate limiter for Netlify Functions
// In production, consider using Redis or a distributed solution

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per minute

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.firstRequest > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, WINDOW_MS);

const rateLimiter = {
  check: (identifier) => {
    const now = Date.now();
    const userKey = identifier || 'anonymous';
    
    if (!requestCounts.has(userKey)) {
      requestCounts.set(userKey, {
        count: 1,
        firstRequest: now
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }
    
    const userData = requestCounts.get(userKey);
    
    // Reset if window has passed
    if (now - userData.firstRequest > WINDOW_MS) {
      requestCounts.set(userKey, {
        count: 1,
        firstRequest: now
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }
    
    // Check if limit exceeded
    if (userData.count >= MAX_REQUESTS) {
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: WINDOW_MS - (now - userData.firstRequest)
      };
    }
    
    // Increment counter
    userData.count++;
    return { allowed: true, remaining: MAX_REQUESTS - userData.count };
  }
};

module.exports = { rateLimiter, WINDOW_MS, MAX_REQUESTS };