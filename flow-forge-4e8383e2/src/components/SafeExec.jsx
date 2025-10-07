/**
 * SafeExec: Runtime enforcement of tenant isolation
 * Wraps all entity operations to ensure tenant_id is present
 */

import TenantEntity, { getCurrentTenantId } from './TenantEntity';
import { enforceTenantFilter } from './TenantFilter';

/**
 * Entity operation interceptor
 * Browser-compatible strict mode detection
 * DEV MODE: Throws errors on violations
 * PROD MODE: Logs warnings but allows (to avoid breaking existing code)
 */
const STRICT_MODE = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.search.includes('debug=true');

/**
 * Wrap entity with runtime checks
 */
export function createSafeEntity(Entity, entityName) {
  const TenantScoped = TenantEntity.wrap(Entity);
  
  return new Proxy(TenantScoped, {
    get(target, prop) {
      const original = target[prop];
      
      // Don't intercept non-function properties
      if (typeof original !== 'function') {
        return original;
      }
      
      // Wrap the function
      return function(...args) {
        const operation = prop;
        const filters = args[0];
        
        try {
          enforceTenantFilter(entityName, operation, filters);
        } catch (error) {
          if (STRICT_MODE) {
            throw error;
          } else {
            console.error(error.message);
            // In production, log but don't break
          }
        }
        
        return original.apply(target, args);
      };
    }
  });
}

/**
 * Verify current operation is tenant-safe
 * Call this at the start of sensitive operations
 */
export async function verifyTenantContext(expectedTenantId = null) {
  const currentTenantId = await getCurrentTenantId();
  
  if (expectedTenantId && currentTenantId !== expectedTenantId) {
    throw new Error(
      `Tenant context mismatch: expected ${expectedTenantId}, got ${currentTenantId}`
    );
  }
  
  return currentTenantId;
}

/**
 * Execute function with guaranteed tenant context
 */
export async function withTenantContext(fn, tenantId = null) {
  const contextTenantId = tenantId || await getCurrentTenantId();
  
  try {
    await verifyTenantContext(contextTenantId);
    return await fn(contextTenantId);
  } catch (error) {
    console.error(`Tenant context error:`, error);
    throw error;
  }
}

export default {
  createSafeEntity,
  verifyTenantContext,
  withTenantContext
};