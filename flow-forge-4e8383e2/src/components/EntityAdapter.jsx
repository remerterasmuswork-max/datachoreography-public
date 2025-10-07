/**
 * EntityAdapter: Abstraction layer for future backend migration
 * 
 * VERSION 1 (Today): Client-side tenant filtering
 * VERSION 2 (Future): Backend API calls with tenant validation
 */

import TenantEntity from './TenantEntity';

// Entity registry - maps entity names to their wrapped instances
const entityRegistry = new Map();

class EntityAdapter {
  constructor(entityName, mode = 'CLIENT_SIDE') {
    this.entityName = entityName;
    this.mode = mode;
    
    // Load appropriate implementation
    if (mode === 'CLIENT_SIDE') {
      this.impl = this.getClientSideImpl();
    } else if (mode === 'BACKEND_API') {
      this.impl = this.getBackendApiImpl();
    }
  }
  
  getClientSideImpl() {
    // Return tenant-wrapped entity from registry
    // Entity registration happens in entities/all.js
    if (!entityRegistry.has(this.entityName)) {
      throw new Error(`Entity ${this.entityName} not registered. Import from @/api/entities.js`);
    }
    return entityRegistry.get(this.entityName);
  }
  
  getBackendApiImpl() {
    // Future implementation: Call backend API
    return {
      async list(sort, limit) {
        const response = await fetch(`/api/v2/${this.entityName}/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort, limit })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async filter(filters, sort, limit) {
        const response = await fetch(`/api/v2/${this.entityName}/filter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, sort, limit })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async get(id) {
        const response = await fetch(`/api/v2/${this.entityName}/get/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async create(data) {
        const response = await fetch(`/api/v2/${this.entityName}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async update(id, data) {
        const response = await fetch(`/api/v2/${this.entityName}/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async delete(id) {
        const response = await fetch(`/api/v2/${this.entityName}/delete/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      },
      
      async bulkCreate(records) {
        const response = await fetch(`/api/v2/${this.entityName}/bulkCreate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
      }
    };
  }
  
  // Proxy all methods to implementation
  async list(...args) { return await this.impl.list(...args); }
  async filter(...args) { return await this.impl.filter(...args); }
  async get(...args) { return await this.impl.get(...args); }
  async create(...args) { return await this.impl.create(...args); }
  async update(...args) { return await this.impl.update(...args); }
  async delete(...args) { return await this.impl.delete(...args); }
  async bulkCreate(...args) { return await this.impl.bulkCreate(...args); }
  schema() { return this.impl.schema ? this.impl.schema() : null; }
}

/**
 * Register an entity in the adapter registry
 * Called by entities/all.js during initialization
 */
export function registerEntity(entityName, entityImpl) {
  entityRegistry.set(entityName, entityImpl);
}

/**
 * Factory function to get entity adapter
 * Mode can be set via: localStorage.setItem('dchor_entity_mode', 'BACKEND_API')
 */
export function getEntity(entityName) {
  const mode = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('dchor_entity_mode') || 'CLIENT_SIDE'
    : 'CLIENT_SIDE';
  
  return new EntityAdapter(entityName, mode);
}

export default EntityAdapter;