/**
 * TenantEntity: Tenant-scoped Entity wrapper (FIXED - uses React Context)
 */

import { User } from '@/api/entities';
import { useTenant } from './TenantContext';
import { getCurrentTenantId as getTenantIdFromDefense, validateTenantOwnership } from './TenantDefense';

// ============================================================================
// TENANT CONTEXT MANAGEMENT
// ============================================================================

/**
 * Get current tenant ID (server-side safe fallback)
 * This function fetches the tenant ID directly from the authenticated user
 * and does not use client-side caching or React Context.
 * It is suitable for server-side operations or contexts where React hooks are not available.
 * @returns {Promise<string>} - Tenant ID
 */
export async function getCurrentTenantId() {
  try {
    const user = await User.me();
    // Derive tenant ID from user
    // Option 1: Direct tenant_id field (if exists)
    // Option 2: Derive from email domain
    // Option 3: Use user ID as tenant ID (single-user tenants)
    return user.tenant_id || user.email.split('@')[1] || user.id;
  } catch (error) {
    console.error('Failed to get tenant ID:', error);
    throw new Error('Authentication required: Please log in');
  }
}

/**
 * Hook to get tenant ID from context (preferred in React components)
 * This hook leverages React Context for tenant ID, providing a cached value
 * and making it compatible with React Suspense for data loading states.
 * @returns {string} - Tenant ID
 */
export function useTenantId() {
  const { tenantId, loading, error } = useTenant();
  
  if (loading) {
    // If tenant ID is still loading, throw a promise to trigger Suspense fallback
    throw new Promise(() => {}); 
  }
  
  if (error) {
    // If there was an error fetching tenant ID, re-throw it
    throw error;
  }
  
  // Return the tenant ID from context
  return tenantId;
}

// ============================================================================
// TENANT-SCOPED ENTITY WRAPPER (ENHANCED WITH VALIDATION)
// ============================================================================

/**
 * Wrap an Entity with tenant-scoped methods
 * Usage: const TenantRun = TenantEntity.wrap(Run);
 * Then: await TenantRun.list()
 * 
 * All operations automatically filter by tenant_id, using getTenantIdFromDefense()
 * as the source for the tenant ID.
 */
const TenantEntity = {
  /**
   * Wrap Entity class with tenant isolation
   * @param {Entity} Entity - Entity class to wrap
   * @returns {object} - Wrapped entity with tenant-scoped methods
   */
  wrap(Entity) {
    return {
      /**
       * List all records for current tenant
       * @param {string} sort - Sort field (optional, e.g., '-created_date')
       * @param {number} limit - Max records to return
       * @returns {Promise<Array>} - Array of records
       */
      async list(sort, limit) {
        const tenantId = await getTenantIdFromDefense();
        const result = await Entity.filter({ tenant_id: tenantId }, sort, limit);
        
        // LAYER 3: Validate response
        return await validateTenantOwnership(Entity.name, 'list', result);
      },

      /**
       * Filter records for current tenant
       * @param {object} filters - Filter criteria
       * @param {string} sort - Sort field (optional)
       * @param {number} limit - Max records to return
       * @returns {Promise<Array>} - Array of records
       */
      async filter(filters, sort, limit) {
        const tenantId = await getTenantIdFromDefense();
        const result = await Entity.filter({ ...filters, tenant_id: tenantId }, sort, limit);
        
        // LAYER 3: Validate response
        return await validateTenantOwnership(Entity.name, 'filter', result);
      },

      /**
       * Create record with tenant_id
       * @param {object} data - Record data
       * @returns {Promise<object>} - Created record
       */
      async create(data) {
        const tenantId = await getTenantIdFromDefense();
        const result = await Entity.create({ ...data, tenant_id: tenantId });
        
        // LAYER 3: Validate created record
        return await validateTenantOwnership(Entity.name, 'create', result);
      },

      /**
       * Update record after verifying tenant ownership
       * @param {string} id - Record ID
       * @param {object} data - Update data
       * @returns {Promise<object>} - Updated record
       */
      async update(id, data) {
        await getTenantIdFromDefense();
        
        // First verify ownership using the enhanced 'get' method of the wrapper.
        await this.get(id); 
        
        const result = await Entity.update(id, data);
        
        // Validate updated record
        return await validateTenantOwnership(Entity.name, 'update', result);
      },

      /**
       * Delete record after verifying tenant ownership
       * @param {string} id - Record ID
       * @returns {Promise<void>}
       */
      async delete(id) {
        await getTenantIdFromDefense();
        
        // Verify ownership before delete
        await this.get(id); 
        
        return await Entity.delete(id);
      },

      /**
       * Get single record after verifying tenant ownership
       * @param {string} id - Record ID
       * @returns {Promise<object>} - Record
       */
      async get(id) {
        await getTenantIdFromDefense();
        const result = await Entity.get(id);
        
        // LAYER 3: Validate ownership
        return await validateTenantOwnership(Entity.name, 'get', result);
      },

      /**
       * Bulk create records with tenant_id
       * @param {Array<object>} records - Array of record data
       * @returns {Promise<Array>} - Created records
       */
      async bulkCreate(records) {
        const tenantId = await getTenantIdFromDefense();
        const result = await Entity.bulkCreate(
          records.map(r => ({ ...r, tenant_id: tenantId }))
        );
        
        // Validate all created records
        return await validateTenantOwnership(Entity.name, 'bulkCreate', result);
      },

      /**
       * Get entity schema (non-tenant-specific)
       */
      schema() {
        return Entity.schema ? Entity.schema() : null;
      },

      /**
       * Access underlying Entity (for advanced use cases)
       * ⚠️ WARNING: Bypasses tenant isolation - use with caution
       */
      _unsafe: Entity
    };
  }
};

// ============================================================================
// TENANT ISOLATION VERIFICATION
// ============================================================================

/**
 * Verify that a query result only contains records from current tenant
 * Used in testing and auditing
 * 
 * @param {Array} records - Query results
 * @param {string} expectedTenantId - Expected tenant ID
 * @returns {object} - Verification result
 */
function verifyTenantIsolation(records, expectedTenantId) {
  if (!Array.isArray(records)) {
    return {
      valid: true,
      message: 'Not an array of records'
    };
  }
  
  const violations = records.filter(r => r.tenant_id && r.tenant_id !== expectedTenantId);
  
  return {
    valid: violations.length === 0,
    violations: violations.length,
    violation_ids: violations.map(v => v.id),
    message: violations.length > 0 
      ? `Found ${violations.length} records from other tenants`
      : 'All records belong to correct tenant'
  };
}

export default TenantEntity;
export { verifyTenantIsolation };