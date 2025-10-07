/**
 * RateLimiter: Per-tenant rate limiting
 * Prevents runaway queries from DOS'ing system
 */

class TenantRateLimiter {
  constructor() {
    this.limits = {
      queries_per_minute: 10,
      runs_per_day: 100,
      bulk_create_max: 100
    };
    
    this.counters = new Map(); // tenantId -> { queries: [], runs: [] }
  }
  
  async checkQueryLimit(tenantId) {
    const now = Date.now();
    const counters = this.getCounters(tenantId);
    
    // Remove old entries (older than 1 minute)
    counters.queries = counters.queries.filter(t => now - t < 60000);
    
    if (counters.queries.length >= this.limits.queries_per_minute) {
      throw new Error('Rate limit exceeded: Too many queries. Please wait 1 minute.');
    }
    
    counters.queries.push(now);
    this.saveCounters(tenantId, counters);
  }
  
  async checkRunLimit(tenantId) {
    const now = Date.now();
    const counters = this.getCounters(tenantId);
    
    // Remove old entries (older than 24 hours)
    counters.runs = counters.runs.filter(t => now - t < 86400000);
    
    if (counters.runs.length >= this.limits.runs_per_day) {
      throw new Error('Rate limit exceeded: Daily run limit reached. Try again tomorrow.');
    }
    
    counters.runs.push(now);
    this.saveCounters(tenantId, counters);
  }
  
  getCounters(tenantId) {
    if (!this.counters.has(tenantId)) {
      this.counters.set(tenantId, { queries: [], runs: [] });
    }
    return this.counters.get(tenantId);
  }
  
  saveCounters(tenantId, counters) {
    this.counters.set(tenantId, counters);
    
    // Persist to localStorage
    try {
      localStorage.setItem(
        `dchor_rate_limit_${tenantId}`,
        JSON.stringify(counters)
      );
    } catch (e) {}
  }
}

export const rateLimiter = new TenantRateLimiter();