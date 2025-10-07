/**
 * AuthProxy: Centralized authentication & session management
 * 
 * PURPOSE:
 * - Single source of truth for authentication state
 * - Session management with automatic refresh
 * - Admin impersonation with audit trail
 * - Secure logout with session cleanup
 * 
 * ARCHITECTURE:
 * - Wraps Base44's User.me() with caching
 * - Stores session in sessionStorage (per-tab)
 * - Validates session age and refreshes automatically
 * - Logs all auth events to ComplianceEvent
 * 
 * BACKEND MIGRATION:
 * - Replace User.me() with JWT validation
 * - Add token refresh endpoint
 * - Move impersonation logic to backend
 * - Keep audit logging
 */

import { User } from '@/api/entities';
import { getCurrentTenantId } from './TenantDefense';

class AuthProxy {
  constructor() {
    this.sessionKey = '__dchor_session';
    this.impersonationKey = '__dchor_impersonate';
    this.currentUser = null;
    this.sessionTTL = 5 * 60 * 1000; // 5 minutes
  }
  
  // ==========================================================================
  // CORE AUTH METHODS
  // ==========================================================================
  
  /**
   * Get current authenticated user
   * Caches result to reduce User.me() calls
   */
  async getCurrentUser() {
    // Check if impersonating
    const impersonation = this.getImpersonation();
    if (impersonation) {
      return impersonation.target_user;
    }
    
    // Check cache
    if (this.currentUser && this.isSessionValid()) {
      return this.currentUser;
    }
    
    try {
      const user = await User.me();
      this.currentUser = user;
      this.saveSession(user);
      return user;
    } catch (error) {
      this.clearSession();
      throw new Error('Authentication required: Please log in');
    }
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if current user is admin
   */
  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user.role === 'admin' || user.role === 'owner';
    } catch {
      return false;
    }
  }
  
  /**
   * Logout current user
   * Clears all session data and redirects
   */
  async logout() {
    try {
      const user = this.currentUser;
      
      // Log logout event
      if (user) {
        await this.logAuthEvent('logout', {
          user_id: user.id,
          email: user.email
        });
      }
      
      // Call Base44 logout
      await User.logout();
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local session regardless of API success
      this.clearSession();
      this.clearImpersonation();
      
      // Redirect to login
      window.location.href = '/login';
    }
  }
  
  /**
   * Force session refresh
   * Clears cache and fetches fresh user data
   */
  async refreshSession() {
    this.currentUser = null;
    this.clearSession();
    return await this.getCurrentUser();
  }
  
  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================
  
  /**
   * Check if current session is valid
   */
  isSessionValid() {
    const session = this.loadSession();
    if (!session) return false;
    
    const age = Date.now() - session.timestamp;
    return age < this.sessionTTL;
  }
  
  /**
   * Save user session to storage
   */
  saveSession(user) {
    try {
      const session = {
        user,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }
  
  /**
   * Load user session from storage
   */
  loadSession() {
    try {
      const data = sessionStorage.getItem(this.sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }
  
  /**
   * Clear user session
   */
  clearSession() {
    this.currentUser = null;
    sessionStorage.removeItem(this.sessionKey);
  }
  
  // ==========================================================================
  // ADMIN IMPERSONATION
  // ==========================================================================
  
  /**
   * Start impersonating another user (admin only)
   * 
   * COMPLIANCE: All impersonation is logged
   * SECURITY: Original admin identity preserved
   * AUDIT: Reason required for SOC2 compliance
   */
  async impersonate(targetUserId, reason) {
    try {
      // Verify admin
      const admin = await this.getCurrentUser();
      if (admin.role !== 'admin' && admin.role !== 'owner') {
        throw new Error('Only admins can impersonate users');
      }
      
      if (!reason || reason.trim().length < 10) {
        throw new Error('Impersonation requires detailed reason (min 10 chars)');
      }
      
      // Fetch target user
      const targetUser = await User.get(targetUserId);
      
      // Log impersonation start
      await this.logAuthEvent('impersonation_started', {
        admin_id: admin.id,
        admin_email: admin.email,
        target_id: targetUser.id,
        target_email: targetUser.email,
        reason,
        severity: 'HIGH'
      });
      
      // Create impersonation session
      const impersonation = {
        original_user: admin,
        target_user: targetUser,
        reason,
        started_at: Date.now()
      };
      
      sessionStorage.setItem(this.impersonationKey, JSON.stringify(impersonation));
      
      // Update current user
      this.currentUser = targetUser;
      this.saveSession(targetUser);
      
      console.warn(`⚠️ Impersonating user: ${targetUser.email}`);
      
      return targetUser;
      
    } catch (error) {
      console.error('Impersonation failed:', error);
      throw error;
    }
  }
  
  /**
   * Stop impersonating and return to admin account
   */
  async stopImpersonation() {
    const impersonation = this.getImpersonation();
    if (!impersonation) {
      throw new Error('Not currently impersonating');
    }
    
    try {
      // Log impersonation end
      await this.logAuthEvent('impersonation_ended', {
        admin_id: impersonation.original_user.id,
        target_id: impersonation.target_user.id,
        duration_ms: Date.now() - impersonation.started_at
      });
      
      // Restore original user
      this.currentUser = impersonation.original_user;
      this.saveSession(impersonation.original_user);
      this.clearImpersonation();
      
      console.log('✅ Stopped impersonation');
      
      return impersonation.original_user;
      
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      throw error;
    }
  }
  
  /**
   * Check if currently impersonating
   */
  isImpersonating() {
    return this.getImpersonation() !== null;
  }
  
  /**
   * Get impersonation details
   */
  getImpersonation() {
    try {
      const data = sessionStorage.getItem(this.impersonationKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Clear impersonation session
   */
  clearImpersonation() {
    sessionStorage.removeItem(this.impersonationKey);
  }
  
  // ==========================================================================
  // AUDIT LOGGING
  // ==========================================================================
  
  /**
   * Log authentication event to compliance trail
   */
  async logAuthEvent(eventType, details) {
    try {
      const { ComplianceEvent } = await import('@/api/entities');
      const tenantId = await getCurrentTenantId();
      
      await ComplianceEvent.create({
        tenant_id: tenantId,
        category: 'user_action',
        event_type: `auth_${eventType}`,
        actor: details.email || details.admin_email || 'system',
        payload: {
          ...details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        ts: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't throw - logging failure shouldn't break auth
    }
  }
  
  /**
   * Get client IP address (best-effort)
   */
  async getClientIP() {
    try {
      // In production, this would come from server headers
      // For now, return placeholder
      return 'client-ip-unknown';
    } catch {
      return 'client-ip-error';
    }
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  /**
   * Require authentication
   * Throws error if not authenticated
   */
  async requireAuth() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      throw new Error('Authentication required');
    }
  }
  
  /**
   * Require admin role
   * Throws error if not admin
   */
  async requireAdmin() {
    await this.requireAuth();
    
    const isAdminUser = await this.isAdmin();
    if (!isAdminUser) {
      throw new Error('Admin privileges required');
    }
  }
  
  /**
   * Check if user has permission
   * Future: implement fine-grained RBAC
   */
  async hasPermission(permission) {
    try {
      const user = await this.getCurrentUser();
      
      // For now, simple role-based check
      if (user.role === 'admin' || user.role === 'owner') {
        return true;
      }
      
      // Future: check user.permissions array
      return false;
      
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const auth = new AuthProxy();
export default AuthProxy;