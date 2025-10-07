/**
 * CredentialVault: Zero-trust credential management
 * 
 * CURRENT STATE: Frontend placeholder with migration contracts
 * FUTURE STATE: Backend HSM/Vault integration
 * 
 * CRITICAL SECURITY NOTE:
 * ========================
 * This is NOT secure in current frontend-only implementation.
 * Credentials stored in browser are ALWAYS vulnerable to XSS.
 * 
 * This component serves THREE purposes:
 * 1. Establish API contract for future backend
 * 2. Provide migration path from current localStorage approach
 * 3. Document security requirements for production
 * 
 * BACKEND REQUIREMENTS (P0 before production):
 * - Server-side credential storage (AWS Secrets Manager / HashiCorp Vault)
 * - HSM for encryption keys
 * - Audit logging for every credential access
 * - Automatic credential rotation
 * - Zero-knowledge architecture (backend never logs plaintext)
 * 
 * MIGRATION PLAN:
 * Phase 1 (Now): Use this as wrapper around localStorage (insecure)
 * Phase 2 (Backend Ready): Point to backend API (secure)
 * Phase 3 (Production): Remove frontend storage completely
 */

import { Connection, Credential } from '@/api/entities';
import { getCurrentTenantId } from './TenantDefense';

class CredentialVault {
  constructor() {
    this.mode = 'FRONTEND_PLACEHOLDER'; // or 'BACKEND_API'
    this.backendURL = '/api/v1/vault'; // Future backend endpoint
  }
  
  // ==========================================================================
  // PUBLIC API (Same for frontend and backend)
  // ==========================================================================
  
  /**
   * Create new connection and store credentials
   * 
   * @param {string} provider - Provider name (shopify, stripe, etc.)
   * @param {object} credentials - Provider-specific credentials
   * @param {object} metadata - Connection metadata (name, description, etc.)
   * @returns {Promise<string>} - Connection ID (opaque reference)
   * 
   * FRONTEND: Encrypts and stores in Credential entity
   * BACKEND: Sends to HSM, returns connection ID
   */
  async createConnection(provider, credentials, metadata = {}) {
    if (this.mode === 'BACKEND_API') {
      return await this._createConnection_Backend(provider, credentials, metadata);
    } else {
      return await this._createConnection_Frontend(provider, credentials, metadata);
    }
  }
  
  /**
   * Execute action using stored credentials
   * 
   * @param {string} connectionId - Connection reference
   * @param {string} action - Action to execute (orders.get, payments.create, etc.)
   * @param {object} params - Action parameters
   * @returns {Promise<object>} - Action result
   * 
   * FRONTEND: Fetches credentials, makes API call (INSECURE)
   * BACKEND: Server fetches credentials, makes API call (SECURE)
   */
  async executeAction(connectionId, action, params) {
    if (this.mode === 'BACKEND_API') {
      return await this._executeAction_Backend(connectionId, action, params);
    } else {
      return await this._executeAction_Frontend(connectionId, action, params);
    }
  }
  
  /**
   * Rotate credentials for connection
   * 
   * @param {string} connectionId - Connection to rotate
   * @returns {Promise<string>} - New connection ID
   * 
   * SECURITY: Old connection ID invalidated immediately
   */
  async rotateCredentials(connectionId) {
    if (this.mode === 'BACKEND_API') {
      return await this._rotateCredentials_Backend(connectionId);
    } else {
      return await this._rotateCredentials_Frontend(connectionId);
    }
  }
  
  /**
   * Delete connection and wipe credentials
   * 
   * @param {string} connectionId - Connection to delete
   * 
   * SECURITY: Crypto-shredding (delete encryption key)
   * Data remains but is permanently unrecoverable
   */
  async deleteConnection(connectionId) {
    if (this.mode === 'BACKEND_API') {
      return await this._deleteConnection_Backend(connectionId);
    } else {
      return await this._deleteConnection_Frontend(connectionId);
    }
  }
  
  /**
   * Test connection health
   * 
   * @param {string} connectionId - Connection to test
   * @returns {Promise<object>} - {healthy: boolean, error: string}
   */
  async testConnection(connectionId) {
    if (this.mode === 'BACKEND_API') {
      return await this._testConnection_Backend(connectionId);
    } else {
      return await this._testConnection_Frontend(connectionId);
    }
  }
  
  // ==========================================================================
  // FRONTEND IMPLEMENTATION (Temporary, Insecure)
  // ==========================================================================
  
  async _createConnection_Frontend(provider, credentials, metadata) {
    console.warn('⚠️ SECURITY: Storing credentials in frontend (development only)');
    
    try {
      const tenantId = await getCurrentTenantId();
      
      // Create connection record
      const connection = await Connection.create({
        tenant_id: tenantId,
        provider,
        name: metadata.name || `${provider} Connection`,
        status: 'inactive',
        config: metadata
      });
      
      // "Encrypt" credentials (base64 is NOT encryption!)
      const credentialString = JSON.stringify(credentials);
      const encodedCredentials = btoa(credentialString);
      
      // Store credential reference
      await Credential.create({
        tenant_id: tenantId,
        connection_id: connection.id,
        encrypted_value: encodedCredentials,
        credential_type: this._inferCredentialType(provider),
        rotation_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      });
      
      // Update connection status
      await Connection.update(connection.id, { status: 'active' });
      
      return connection.id;
      
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }
  
  async _executeAction_Frontend(connectionId, action, params) {
    console.warn('⚠️ SECURITY: Executing action from frontend (credentials exposed)');
    
    try {
      // Fetch credentials
      const credentials = await this._getCredentials_Frontend(connectionId);
      
      // Log action execution
      await this._logVaultAccess(connectionId, action, 'execute');
      
      // Execute via MCP tools (placeholder)
      // In real implementation, this would call MCP server
      console.log(`Executing ${action} with connection ${connectionId}`, params);
      
      return {
        success: true,
        result: { message: 'Action executed (placeholder)' }
      };
      
    } catch (error) {
      console.error('Failed to execute action:', error);
      throw error;
    }
  }
  
  async _getCredentials_Frontend(connectionId) {
    try {
      const tenantId = await getCurrentTenantId();
      
      // Fetch credential record
      const credentials = await Credential.filter({
        tenant_id: tenantId,
        connection_id: connectionId
      });
      
      if (credentials.length === 0) {
        throw new Error(`No credentials found for connection ${connectionId}`);
      }
      
      const credential = credentials[0];
      
      // "Decrypt" (base64 decode)
      const decoded = atob(credential.encrypted_value);
      return JSON.parse(decoded);
      
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw error;
    }
  }
  
  async _rotateCredentials_Frontend(connectionId) {
    console.warn('⚠️ Credential rotation not implemented in frontend mode');
    throw new Error('Credential rotation requires backend implementation');
  }
  
  async _deleteConnection_Frontend(connectionId) {
    try {
      const tenantId = await getCurrentTenantId();
      
      // Delete credentials
      const credentials = await Credential.filter({
        tenant_id: tenantId,
        connection_id: connectionId
      });
      
      for (const cred of credentials) {
        await Credential.delete(cred.id);
      }
      
      // Delete connection
      await Connection.delete(connectionId);
      
      // Log deletion
      await this._logVaultAccess(connectionId, 'delete', 'delete');
      
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    }
  }
  
  async _testConnection_Frontend(connectionId) {
    try {
      const credentials = await this._getCredentials_Frontend(connectionId);
      
      // Placeholder health check
      return {
        healthy: true,
        last_tested: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  // ==========================================================================
  // BACKEND IMPLEMENTATION (Future)
  // ==========================================================================
  
  async _createConnection_Backend(provider, credentials, metadata) {
    const response = await fetch(`${this.backendURL}/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this._getAuthToken()}`
      },
      body: JSON.stringify({
        provider,
        credentials,
        metadata
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vault API error: ${response.statusText}`);
    }
    
    const { connection_id } = await response.json();
    return connection_id;
  }
  
  async _executeAction_Backend(connectionId, action, params) {
    const response = await fetch(`${this.backendURL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this._getAuthToken()}`
      },
      body: JSON.stringify({
        connection_id: connectionId,
        action,
        params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vault API error: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async _rotateCredentials_Backend(connectionId) {
    const response = await fetch(`${this.backendURL}/connections/${connectionId}/rotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this._getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Vault API error: ${response.statusText}`);
    }
    
    const { new_connection_id } = await response.json();
    return new_connection_id;
  }
  
  async _deleteConnection_Backend(connectionId) {
    const response = await fetch(`${this.backendURL}/connections/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this._getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Vault API error: ${response.statusText}`);
    }
  }
  
  async _testConnection_Backend(connectionId) {
    const response = await fetch(`${this.backendURL}/connections/${connectionId}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this._getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Vault API error: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  async _getAuthToken() {
    // In backend mode, return JWT token
    // For now, placeholder
    return 'frontend-placeholder-token';
  }
  
  async _logVaultAccess(connectionId, action, operation) {
    try {
      const { ComplianceEvent } = await import('@/api/entities');
      const tenantId = await getCurrentTenantId();
      
      await ComplianceEvent.create({
        tenant_id: tenantId,
        category: 'data_access',
        event_type: 'vault_access',
        ref_type: 'connection',
        ref_id: connectionId,
        actor: 'system',
        payload: {
          action,
          operation,
          timestamp: new Date().toISOString()
        },
        ts: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log vault access:', error);
    }
  }
  
  _inferCredentialType(provider) {
    const types = {
      shopify: 'api_key',
      stripe: 'api_key',
      xero: 'oauth_token',
      gmail: 'oauth_token',
      msgraph: 'oauth_token',
      slack: 'oauth_token'
    };
    
    return types[provider] || 'api_key';
  }
  
  /**
   * Switch to backend mode
   * Call this once backend is deployed
   */
  enableBackendMode() {
    console.log('✅ Switching CredentialVault to backend mode');
    this.mode = 'BACKEND_API';
  }
  
  /**
   * Check current mode
   */
  getMode() {
    return this.mode;
  }
}

// Export singleton
export const credentialVault = new CredentialVault();
export default CredentialVault;

/**
 * BACKEND IMPLEMENTATION GUIDE
 * ============================
 * 
 * When building the backend vault service, implement these endpoints:
 * 
 * POST /api/v1/vault/connections
 * - Extract tenant_id from JWT
 * - Validate credentials format per provider
 * - Encrypt with HSM (AWS KMS / HashiCorp Vault)
 * - Store in Credential entity
 * - Return connection_id
 * 
 * POST /api/v1/vault/execute
 * - Extract tenant_id from JWT
 * - Validate connection belongs to tenant
 * - Fetch credentials from HSM
 * - Execute action via MCP server
 * - Return result (never log credentials)
 * 
 * POST /api/v1/vault/connections/:id/rotate
 * - Generate new credentials via OAuth refresh / API
 * - Store new credentials
 * - Invalidate old connection_id
 * - Return new_connection_id
 * 
 * DELETE /api/v1/vault/connections/:id
 * - Crypto-shred: delete encryption key from HSM
 * - Keep encrypted blob for audit (unrecoverable without key)
 * - Mark connection as deleted
 * 
 * POST /api/v1/vault/connections/:id/test
 * - Fetch credentials
 * - Make test API call to provider
 * - Return health status
 * 
 * SECURITY REQUIREMENTS:
 * - All endpoints require JWT with tenant_id
 * - Row-level security on Credential entity
 * - Audit log every credential access
 * - Rotate encryption keys quarterly
 * - Never log plaintext credentials
 * - Use HSM for key storage (not database)
 */