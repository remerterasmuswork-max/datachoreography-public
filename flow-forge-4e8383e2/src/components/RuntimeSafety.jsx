/**
 * RuntimeSafety: Production-grade reliability utilities
 * Handles timeouts, retries, circuit breaking, and idempotency
 */

// ============================================================================
// TIMEOUT UTILITY
// ============================================================================

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} errorMessage - Custom error message
 * @returns {Promise} - Resolved promise or timeout error
 */
export async function withTimeout(promise, timeoutMs = 30000, errorMessage = 'Operation timed out') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${errorMessage} after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Retryable fetch with exponential backoff
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} baseDelayMs - Base delay for exponential backoff (default: 1000ms)
 * @returns {Promise<Response>} - Fetch response
 */
export async function retryableFetch(url, options = {}, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Success (2xx status)
      if (response.ok) {
        return response;
      }
      
      // Don't retry client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Retry server errors (5xx) and rate limits (429)
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on network errors that won't recover
      if (error.name === 'AbortError') {
        throw error;
      }
    }
    
    // Don't wait after last attempt
    if (attempt < maxRetries - 1) {
      const delay = baseDelayMs * Math.pow(2, attempt); // Exponential backoff
      const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
      await sleep(delay + jitter);
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Generic retry wrapper for any async function
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelayMs - Base delay for exponential backoff
 * @returns {Promise} - Function result
 */
export async function retryable(fn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry fatal errors
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.3 * delay;
        await sleep(delay + jitter);
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

/**
 * Circuit Breaker pattern implementation
 * Prevents cascading failures by "opening" after threshold failures
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered, limited requests
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = null;
    
    // For monitoring
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      lastStateChange: Date.now()
    };
  }
  
  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise} - Function result
   */
  async execute(fn) {
    this.metrics.totalCalls++;
    
    // Check if circuit is OPEN
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker OPEN - service unavailable');
      }
      
      // Time to test if service recovered
      this.state = 'HALF_OPEN';
      this.metrics.lastStateChange = Date.now();
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    this.metrics.totalSuccesses++;
    
    if (this.state === 'HALF_OPEN') {
      // Service recovered, close circuit
      this.state = 'CLOSED';
      this.metrics.lastStateChange = Date.now();
    }
  }
  
  /**
   * Handle failed execution
   */
  onFailure() {
    this.failureCount++;
    this.metrics.totalFailures++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.metrics.lastStateChange = Date.now();
    }
  }
  
  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      metrics: this.metrics,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
  
  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.metrics.lastStateChange = Date.now();
  }
}

// ============================================================================
// IDEMPOTENCY UTILITIES
// ============================================================================

/**
 * Generate idempotency key for workflow run
 * @param {string} workflowId - Workflow ID
 * @param {object} triggerPayload - Trigger data (optional)
 * @returns {string} - Unique idempotency key
 */
export function generateIdempotencyKey(workflowId, triggerPayload = {}) {
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  
  // Include payload hash for content-based deduplication
  const payloadHash = triggerPayload 
    ? simpleHash(JSON.stringify(triggerPayload)).slice(0, 8)
    : 'nopayload';
  
  return `${workflowId}_${timestamp}_${payloadHash}_${random}`;
}

/**
 * Ensure idempotent run creation
 * Checks if run already exists with same idempotency key
 * @param {Entity} RunEntity - Run entity class
 * @param {string} idempotencyKey - Idempotency key
 * @param {object} runData - Run data to create if not exists
 * @returns {Promise<{run, created}>} - Existing or new run + created flag
 */
export async function ensureIdempotentRun(RunEntity, idempotencyKey, runData) {
  // Check if run already exists
  const existing = await RunEntity.filter({ idempotency_key: idempotencyKey });
  
  if (existing.length > 0) {
    return {
      run: existing[0],
      created: false,
      message: 'Run already exists with this idempotency key'
    };
  }
  
  // Create new run
  const run = await RunEntity.create({
    ...runData,
    idempotency_key: idempotencyKey
  });
  
  return {
    run,
    created: true,
    message: 'New run created'
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simple string hash (non-cryptographic)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Timeout
try {
  const result = await withTimeout(
    fetch('https://api.example.com/data'),
    5000,
    'API call timed out'
  );
} catch (error) {
  console.error('Timeout error:', error);
}

// Example 2: Retry
const data = await retryableFetch('https://api.example.com/data', {
  method: 'POST',
  body: JSON.stringify({ foo: 'bar' })
}, 3, 1000);

// Example 3: Circuit Breaker
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
});

try {
  const result = await breaker.execute(async () => {
    return await fetch('https://flaky-api.com/endpoint');
  });
} catch (error) {
  console.error('Circuit breaker error:', error);
  console.log('Breaker status:', breaker.getStatus());
}

// Example 4: Idempotency
const { run, created } = await ensureIdempotentRun(
  Run,
  generateIdempotencyKey('workflow-123', { order_id: '456' }),
  {
    tenant_id: 'tenant-1',
    workflow_id: 'workflow-123',
    status: 'pending'
  }
);

if (!created) {
  console.log('Run already exists, skipping...');
}
*/

export default {
  withTimeout,
  retryableFetch,
  retryable,
  CircuitBreaker,
  generateIdempotencyKey,
  ensureIdempotentRun,
  sleep
};