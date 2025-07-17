// src/utils/rateLimiter.js
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    canMakeRequest(userId, action, limit = 10, windowMs = 60000) {
        const key = `${userId}-${action}`;
        const now = Date.now();

        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const requests = this.requests.get(key);

        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

        if (validRequests.length >= limit) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(key, validRequests);

        return true;
    }
}

export const rateLimiter = new RateLimiter();