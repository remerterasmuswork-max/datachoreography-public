/**
 * TenantRouter: Subdomain-based tenant isolation
 * 
 * SECURITY MODEL:
 * - Each tenant gets unique subdomain: tenant1.datachoreography.com
 * - Browser-level isolation: separate cookies, storage, cache
 * - No cross-subdomain access possible without explicit auth
 * 
 * ARCHITECTURE:
 * - Main app domain: app.datachoreography.com (login/onboarding only)
 * - Tenant subdomains: {tenant_id}.datachoreography.com
 * - After login, redirect to tenant subdomain
 * 
 * BACKEND REQUIREMENTS (Future):
 * - DNS wildcard: *.datachoreography.com → same server
 * - TLS cert for wildcard domain
 * - Subdomain routing in reverse proxy
 * 
 * LIMITATIONS:
 * - Requires DNS setup (not possible on localhost)
 * - Requires wildcard TLS cert
 * - Cookie sharing between subdomains must be explicitly blocked
 */

import { User } from '@/api/entities';

class TenantRouter {
  constructor() {
    this.mainDomain = 'datachoreography.com';
    this.isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('base44.app');
  }
  
  /**
   * Get sanitized subdomain for tenant
   * Rules: lowercase alphanumeric only, max 63 chars (DNS limit)
   */
  getTenantSubdomain(tenantId) {
    const sanitized = tenantId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63);
    
    if (!sanitized) {
      throw new Error(`Invalid tenant ID: ${tenantId}`);
    }
    
    return `${sanitized}.${this.mainDomain}`;
  }
  
  /**
   * Check if currently on tenant subdomain
   */
  isOnTenantSubdomain() {
    if (this.isDevelopment) return false;
    
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // tenant.datachoreography.com = 3 parts
    // app.datachoreography.com = 3 parts (but "app" is reserved)
    return parts.length === 3 && parts[0] !== 'app' && parts[0] !== 'www';
  }
  
  /**
   * Extract tenant ID from current subdomain
   */
  getCurrentTenantFromSubdomain() {
    if (!this.isOnTenantSubdomain()) {
      return null;
    }
    
    const hostname = window.location.hostname;
    return hostname.split('.')[0];
  }
  
  /**
   * Redirect user to their tenant subdomain
   * Call this after login
   */
  async redirectToTenantSubdomain() {
    if (this.isDevelopment) {
      console.warn('⚠️ Subdomain routing disabled in development');
      return;
    }
    
    try {
      // Get user's tenant
      const user = await User.me();
      const tenantId = user.tenant_id || user.email.split('@')[1] || user.id;
      
      // Get tenant subdomain
      const tenantSubdomain = this.getTenantSubdomain(tenantId);
      const currentHostname = window.location.hostname;
      
      // Already on correct subdomain?
      if (currentHostname === tenantSubdomain) {
        return;
      }
      
      // Redirect to tenant subdomain
      const protocol = window.location.protocol;
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      
      const destination = `${protocol}//${tenantSubdomain}${path}${search}${hash}`;
      
      console.log(`🔀 Redirecting to tenant subdomain: ${destination}`);
      window.location.href = destination;
      
    } catch (error) {
      console.error('Failed to redirect to tenant subdomain:', error);
      throw error;
    }
  }
  
  /**
   * Validate user is on correct subdomain
   * Call this on every page load
   */
  async validateSubdomainAccess() {
    if (this.isDevelopment) {
      return true; // Skip in development
    }
    
    try {
      const user = await User.me();
      const expectedTenantId = user.tenant_id || user.email.split('@')[1] || user.id;
      const currentTenantId = this.getCurrentTenantFromSubdomain();
      
      if (!currentTenantId) {
        // On main domain (app.datachoreography.com)
        // This is OK for login/onboarding
        const allowedPaths = ['/login', '/signup', '/onboarding', '/'];
        if (!allowedPaths.some(p => window.location.pathname.startsWith(p))) {
          throw new Error('Must access app from tenant subdomain');
        }
        return true;
      }
      
      // Normalize tenant IDs for comparison
      const normalizedExpected = this.getTenantSubdomain(expectedTenantId).split('.')[0];
      const normalizedCurrent = currentTenantId;
      
      if (normalizedExpected !== normalizedCurrent) {
        throw new Error(
          `SECURITY: Wrong subdomain. Expected ${normalizedExpected}, got ${normalizedCurrent}`
        );
      }
      
      return true;
      
    } catch (error) {
      console.error('Subdomain validation failed:', error);
      
      // Log security event
      await this.logSecurityViolation('wrong_subdomain', {
        expected: await this.getExpectedSubdomain(),
        actual: window.location.hostname,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  /**
   * Log security violation
   */
  async logSecurityViolation(type, details) {
    try {
      const { ComplianceEvent } = await import('@/api/entities');
      
      await ComplianceEvent.create({
        category: 'user_action',
        event_type: 'security_violation',
        ref_type: type,
        ref_id: window.location.href,
        actor: 'system',
        payload: {
          violation_type: type,
          ...details
        },
        ts: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security violation:', error);
    }
  }
  
  async getExpectedSubdomain() {
    try {
      const user = await User.me();
      const tenantId = user.tenant_id || user.email.split('@')[1] || user.id;
      return this.getTenantSubdomain(tenantId);
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Generate tenant-specific session cookie
   * Cookies are isolated per subdomain automatically by browser
   */
  setTenantCookie(key, value, options = {}) {
    const defaults = {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 // 24 hours
    };
    
    const config = { ...defaults, ...options };
    
    let cookieString = `${key}=${encodeURIComponent(value)}`;
    cookieString += `; path=${config.path}`;
    cookieString += `; max-age=${config.maxAge}`;
    cookieString += `; samesite=${config.sameSite}`;
    
    if (config.secure) {
      cookieString += '; secure';
    }
    
    // HttpOnly can't be set from JavaScript (server-side only)
    // But we document this for backend implementation
    
    document.cookie = cookieString;
  }
  
  /**
   * Clear all tenant-specific cookies
   */
  clearTenantCookies() {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}

export const tenantRouter = new TenantRouter();
export default TenantRouter;