import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Zap, 
  FileText, 
  Key,
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function BackendAPIContract() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Backend API Contract Specification</h1>
          <p className="text-gray-600 mt-2">
            Production-grade API specification for backend enforcement layer
          </p>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-green-100 text-green-800">SOC2 Ready</Badge>
            <Badge className="bg-blue-100 text-blue-800">GDPR Compliant</Badge>
            <Badge className="bg-purple-100 text-purple-800">HSM Compatible</Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Critical Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                All endpoints require JWT authentication with tenant_id claim
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                PostgreSQL Row-Level Security (RLS) enforced on all queries
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                All sensitive operations logged to compliance_events table
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                Idempotency keys required for all write operations
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                Rate limiting: 100 req/min per tenant, 10 req/sec per user
              </li>
            </ul>
          </CardContent>
        </Card>

        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth">Auth API</TabsTrigger>
            <TabsTrigger value="tenant">Tenant API</TabsTrigger>
            <TabsTrigger value="vault">Vault API</TabsTrigger>
            <TabsTrigger value="workflow">Workflow API</TabsTrigger>
            <TabsTrigger value="compliance">Compliance API</TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* AUTHENTICATION & SECURITY API */}
          {/* ============================================================ */}
          
          <TabsContent value="auth">
            <div className="space-y-6">
              <SectionHeader
                icon={Key}
                title="Authentication & Security API"
                description="JWT-based authentication with tenant scoping"
              />

              {/* POST /api/v1/auth/login */}
              <Endpoint
                method="POST"
                path="/api/v1/auth/login"
                title="User Login"
                description="Authenticate user and issue JWT with tenant scope"
                headers={[
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  email: 'string (required)',
                  password: 'string (required)',
                  mfa_code: 'string (optional, if MFA enabled)'
                }}
                responseBody={{
                  access_token: 'string (JWT, 1 hour expiry)',
                  refresh_token: 'string (30 days expiry)',
                  user: {
                    id: 'string (UUID)',
                    email: 'string',
                    full_name: 'string',
                    role: 'enum: admin | owner | user',
                    tenant_id: 'string (tenant identifier)',
                    permissions: 'array<string> (granular permissions)'
                  }
                }}
                securityNotes={[
                  'Password must be bcrypt hashed with cost factor 12',
                  'Rate limit: 5 failed attempts → 15 min lockout',
                  'Log all login attempts to compliance_events',
                  'JWT payload includes: user_id, tenant_id, role, permissions, exp, iat',
                  'Rotate JWT secret quarterly, support multi-key validation during rotation'
                ]}
                backendLogic={`
1. Validate email/password against users table
2. Check tenant membership: user.tenant_id = tenant.id
3. Verify tenant status = 'active' (not suspended)
4. Generate JWT with claims:
   {
     sub: user.id,
     email: user.email,
     tenant_id: user.tenant_id,
     role: user.role,
     permissions: user.permissions,
     iat: now(),
     exp: now() + 1h
   }
5. Generate refresh token (random 256-bit, store hash in DB)
6. Log successful login to compliance_events
7. Return tokens + user object
                `}
                scalingNotes={[
                  'Cache JWT public key in Redis (TTL: 1 hour)',
                  'Use Redis for rate limiting (sliding window)',
                  'Consider AWS Cognito or Auth0 for production'
                ]}
              />

              {/* POST /api/v1/auth/refresh */}
              <Endpoint
                method="POST"
                path="/api/v1/auth/refresh"
                title="Refresh Access Token"
                description="Exchange refresh token for new access token"
                headers={[
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  refresh_token: 'string (required)'
                }}
                responseBody={{
                  access_token: 'string (new JWT)',
                  refresh_token: 'string (rotated)',
                  expires_in: 'integer (seconds until expiry)'
                }}
                securityNotes={[
                  'Refresh token rotation: issue new token, invalidate old one',
                  'Detect token reuse: if old token used again → revoke all user sessions',
                  'Store refresh token hash in database, never plaintext',
                  'Limit refresh tokens per user: max 5 active devices'
                ]}
                backendLogic={`
1. Hash incoming refresh_token
2. Look up token in refresh_tokens table
3. Verify: not expired, not revoked, user/tenant still active
4. Generate new JWT (same process as login)
5. Generate new refresh token
6. Invalidate old refresh token (set revoked_at timestamp)
7. Log token refresh to compliance_events
8. Return new tokens
                `}
              />

              {/* POST /api/v1/auth/impersonate */}
              <Endpoint
                method="POST"
                path="/api/v1/auth/impersonate"
                title="Admin Impersonation"
                description="Allow admin to impersonate another user for support"
                headers={[
                  { name: 'Authorization', value: 'Bearer <admin_jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  target_user_id: 'string (UUID of user to impersonate)',
                  reason: 'string (required, min 20 chars)',
                  duration_minutes: 'integer (max 60, default 30)'
                }}
                responseBody={{
                  impersonation_token: 'string (special JWT)',
                  target_user: {
                    id: 'string',
                    email: 'string',
                    full_name: 'string',
                    tenant_id: 'string'
                  },
                  expires_at: 'string (ISO 8601 timestamp)'
                }}
                securityNotes={[
                  'CRITICAL: Only admin/owner roles can impersonate',
                  'Impersonation JWT includes: original_user_id, impersonated_user_id, impersonation_session_id',
                  'All actions logged with both user IDs',
                  'Impersonation sessions expire after duration_minutes (cannot be refreshed)',
                  'High-risk actions (delete, payment) blocked during impersonation'
                ]}
                backendLogic={`
1. Verify caller JWT: role = 'admin' OR role = 'owner'
2. Validate reason length >= 20 chars
3. Verify target_user exists and is in same or child tenant
4. Create impersonation_sessions record:
   {
     id: uuid(),
     admin_user_id: caller.user_id,
     target_user_id: target_user_id,
     reason: reason,
     started_at: now(),
     expires_at: now() + duration_minutes,
     ended_at: null
   }
5. Generate special JWT with additional claims:
   {
     sub: target_user_id,
     impersonating: true,
     impersonation_session_id: session.id,
     original_user_id: caller.user_id,
     tenant_id: target_user.tenant_id,
     exp: now() + duration_minutes
   }
6. Log HIGH_SEVERITY event to compliance_events
7. Send alert email to security team
8. Return impersonation token
                `}
                scalingNotes={[
                  'Store active impersonation sessions in Redis for fast lookup',
                  'Alert on suspicious patterns: multiple rapid impersonations, same user impersonated >3x/day'
                ]}
              />

              {/* POST /api/v1/auth/validate */}
              <Endpoint
                method="POST"
                path="/api/v1/auth/validate"
                title="Validate JWT Token"
                description="Verify JWT is valid and not revoked"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                responseBody={{
                  valid: 'boolean',
                  user_id: 'string',
                  tenant_id: 'string',
                  role: 'string',
                  expires_at: 'string (ISO 8601)',
                  impersonating: 'boolean (true if admin impersonation)',
                  original_user_id: 'string (if impersonating)'
                }}
                securityNotes={[
                  'Check JWT signature with current + previous public keys (rotation support)',
                  'Verify exp claim not passed',
                  'Check revocation list in Redis (revoked_tokens:<user_id>)',
                  'Validate tenant is active (not suspended)',
                  'For impersonation tokens: verify session not ended'
                ]}
                backendLogic={`
1. Decode JWT without verification first
2. Fetch public key for kid (key ID) from JWT header
3. Verify signature with public key
4. Validate claims: exp > now(), iat <= now()
5. Check Redis: not in revoked_tokens:<user_id> set
6. Query database: user still exists, tenant active
7. If impersonating: verify impersonation_session not ended
8. Return validation result + extracted claims
                `}
              />

              {/* POST /api/v1/auth/logout */}
              <Endpoint
                method="POST"
                path="/api/v1/auth/logout"
                title="User Logout"
                description="Revoke current access token and refresh token"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  revoke_all_devices: 'boolean (default: false, if true revoke all refresh tokens)'
                }}
                responseBody={{
                  success: 'boolean',
                  message: 'string'
                }}
                securityNotes={[
                  'Add JWT ID (jti) to Redis revocation list until expiry',
                  'Revoke refresh token(s) in database',
                  'Log logout event',
                  'If impersonating: end impersonation session'
                ]}
                backendLogic={`
1. Extract user_id and jti from JWT
2. Add jti to Redis set: revoked_tokens:<user_id> (TTL: token expiry time)
3. If revoke_all_devices:
     UPDATE refresh_tokens 
     SET revoked_at = now() 
     WHERE user_id = ? AND revoked_at IS NULL
   Else:
     Revoke only current refresh token (from session)
4. If impersonating:
     UPDATE impersonation_sessions 
     SET ended_at = now() 
     WHERE id = impersonation_session_id
5. Log logout to compliance_events
6. Return success
                `}
              />
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TENANT ISOLATION API */}
          {/* ============================================================ */}
          
          <TabsContent value="tenant">
            <div className="space-y-6">
              <SectionHeader
                icon={Shield}
                title="Tenant Isolation API"
                description="Server-side tenant filtering with RLS enforcement"
              />

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-yellow-900 mb-2">PostgreSQL Row-Level Security Setup</h4>
                  <pre className="bg-yellow-100 p-4 rounded text-xs overflow-x-auto">
{`-- Enable RLS on all tenant-scoped tables
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
-- ... (all tenant-scoped tables)

-- Create RLS policy for SELECT
CREATE POLICY tenant_isolation_select ON runs
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- Create RLS policy for INSERT
CREATE POLICY tenant_isolation_insert ON runs
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- Create RLS policy for UPDATE
CREATE POLICY tenant_isolation_update ON runs
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- Create RLS policy for DELETE
CREATE POLICY tenant_isolation_delete ON runs
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- Set tenant context in middleware (before every query):
SET LOCAL app.current_tenant_id = '<tenant_id_from_jwt>';`}
                  </pre>
                </CardContent>
              </Card>

              {/* Middleware Setup */}
              <Card>
                <CardHeader>
                  <CardTitle>Express Middleware - Tenant Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// middleware/tenantContext.js
const jwt = require('jsonwebtoken');

async function setTenantContext(req, res, next) {
  try {
    // Extract JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract tenant_id from JWT claims
    const tenantId = decoded.tenant_id;
    if (!tenantId) {
      return res.status(403).json({ error: 'JWT missing tenant_id claim' });
    }
    
    // Store in request for easy access
    req.userId = decoded.sub;
    req.tenantId = tenantId;
    req.userRole = decoded.role;
    req.userPermissions = decoded.permissions || [];
    
    // Set PostgreSQL session variable (RLS enforcement)
    await req.db.query(\`SET LOCAL app.current_tenant_id = $1\`, [tenantId]);
    
    // CRITICAL: Also set user_id for audit logging
    await req.db.query(\`SET LOCAL app.current_user_id = $1\`, [decoded.sub]);
    
    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Apply to all /api/* routes
app.use('/api/*', setTenantContext);`}
                  </pre>
                </CardContent>
              </Card>

              {/* POST /api/v1/entities/:entity_name/list */}
              <Endpoint
                method="POST"
                path="/api/v1/entities/:entity_name/list"
                title="List Entity Records"
                description="Query entity records with automatic tenant filtering"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  sort: 'string (optional, e.g. "-created_date" for desc)',
                  limit: 'integer (optional, default: 100, max: 1000)',
                  offset: 'integer (optional, for pagination)'
                }}
                responseBody={{
                  data: 'array<object> (entity records)',
                  total_count: 'integer (total matching records)',
                  has_more: 'boolean (true if more pages exist)',
                  next_offset: 'integer (offset for next page)'
                }}
                securityNotes={[
                  'RLS automatically filters by tenant_id',
                  'No way to access other tenants data',
                  'Sort/limit params sanitized to prevent SQL injection',
                  'Max limit enforced server-side'
                ]}
                backendLogic={`
1. Middleware already set: app.current_tenant_id = req.tenantId
2. Validate entity_name against whitelist (prevent SQL injection)
3. Sanitize sort parameter (only allow alphanumeric + underscore)
4. Build query:
   SELECT * FROM :entity_name
   ORDER BY :sort
   LIMIT :limit OFFSET :offset
5. PostgreSQL RLS adds: WHERE tenant_id = current_setting('app.current_tenant_id')
6. Execute query
7. Get total count (with RLS filter applied)
8. Return paginated results
                `}
              />

              {/* POST /api/v1/entities/:entity_name/filter */}
              <Endpoint
                method="POST"
                path="/api/v1/entities/:entity_name/filter"
                title="Filter Entity Records"
                description="Advanced filtering with tenant isolation"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  filters: {
                    status: 'string (optional, exact match)',
                    created_date_gte: 'string (optional, >= date)',
                    created_date_lte: 'string (optional, <= date)',
                    search: 'string (optional, full-text search)',
                    // Additional field filters based on entity schema
                  },
                  sort: 'string (optional)',
                  limit: 'integer (optional)',
                  offset: 'integer (optional)'
                }}
                responseBody={{
                  data: 'array<object>',
                  total_count: 'integer',
                  has_more: 'boolean',
                  next_offset: 'integer',
                  applied_filters: 'object (echo back filters for debugging)'
                }}
                securityNotes={[
                  'Validate all filter keys against entity schema',
                  'Parameterized queries to prevent SQL injection',
                  'RLS ensures tenant isolation regardless of filters',
                  'Reject filters on tenant_id (redundant and suspicious)'
                ]}
                backendLogic={`
1. Middleware: tenant context already set
2. Validate filters object:
   - Only allow keys that exist in entity schema
   - Reject: tenant_id, id (use /get endpoint for ID)
   - Validate data types
3. Build WHERE clause from filters:
   WHERE status = $1 
     AND created_date >= $2 
     AND created_date <= $3
     AND (search_field ILIKE $4 OR other_field ILIKE $4)
4. PostgreSQL RLS adds: AND tenant_id = current_setting('app.current_tenant_id')
5. Execute query with parameters
6. Return results
                `}
              />

              {/* GET /api/v1/entities/:entity_name/:id */}
              <Endpoint
                method="GET"
                path="/api/v1/entities/:entity_name/:id"
                title="Get Single Record"
                description="Retrieve single entity record by ID"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                responseBody={{
                  data: 'object (entity record)',
                  _metadata: {
                    accessed_at: 'string (ISO 8601)',
                    accessed_by: 'string (user email)'
                  }
                }}
                securityNotes={[
                  'RLS verifies record belongs to current tenant',
                  'Returns 404 if not found OR wrong tenant (dont leak existence)',
                  'Log data access event to compliance_events'
                ]}
                backendLogic={`
1. Middleware: tenant context set
2. Query: SELECT * FROM :entity_name WHERE id = $1
3. RLS adds: AND tenant_id = current_setting('app.current_tenant_id')
4. If no rows: return 404 (ambiguous - dont reveal if wrong tenant or DNE)
5. Log to compliance_events:
   {
     category: 'data_access',
     event_type: 'entity_read',
     ref_type: entity_name,
     ref_id: id,
     actor: req.userId
   }
6. Return record
                `}
              />

              {/* POST /api/v1/entities/:entity_name */}
              <Endpoint
                method="POST"
                path="/api/v1/entities/:entity_name"
                title="Create Record"
                description="Create new entity record with tenant_id auto-injected"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  // Entity-specific fields (validated against schema)
                  // Example for Run:
                  workflow_id: 'string (UUID)',
                  trigger_type: 'enum',
                  trigger_payload: 'object',
                  // ... other fields
                }}
                responseBody={{
                  data: 'object (created record with generated ID)',
                  idempotency_key: 'string (echo back for confirmation)'
                }}
                securityNotes={[
                  'CRITICAL: Idempotency key required for all writes',
                  'Store (tenant_id, entity_name, idempotency_key) in Redis/DB for 24h',
                  'If duplicate key: return cached response (dont re-create)',
                  'Automatically inject tenant_id from JWT',
                  'Reject if request includes tenant_id field (suspicious)'
                ]}
                backendLogic={`
1. Extract idempotency_key from header
2. Check Redis: idempotency:{tenant_id}:{entity_name}:{key}
3. If exists: return cached response (status 200, not 201)
4. Validate request body against entity JSON schema
5. Reject if body contains: tenant_id, id, created_date, created_by
6. Inject server-controlled fields:
   {
     ...request_body,
     tenant_id: req.tenantId,
     id: uuid(),
     created_date: now(),
     created_by: req.userId
   }
7. INSERT INTO :entity_name (...) VALUES (...)
8. RLS INSERT policy verifies tenant_id matches current_setting
9. Store response in Redis: SET idempotency:{tenant_id}:{entity_name}:{key} = response (TTL: 24h)
10. Log creation to compliance_events
11. Return created record (status 201)
                `}
                scalingNotes={[
                  'Use Redis for idempotency cache (fast, auto-expire)',
                  'Consider DynamoDB for idempotency store (global)',
                  'Idempotency window: 24 hours (configurable per tenant)'
                ]}
              />

              {/* PUT /api/v1/entities/:entity_name/:id */}
              <Endpoint
                method="PUT"
                path="/api/v1/entities/:entity_name/:id"
                title="Update Record"
                description="Update existing entity record with ownership verification"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  // Only fields to update (partial update supported)
                  status: 'string',
                  // ... other updateable fields
                }}
                responseBody={{
                  data: 'object (updated record)',
                  previous_version: 'object (previous state, for audit)',
                  idempotency_key: 'string'
                }}
                securityNotes={[
                  'Fetch record first to verify tenant ownership via RLS',
                  'Return 404 if not found (ambiguous)',
                  'Reject updates to: tenant_id, id, created_date, created_by',
                  'Automatically set: updated_date, updated_by',
                  'Store previous version for audit trail'
                ]}
                backendLogic={`
1. Check idempotency (same as create)
2. Fetch existing record:
   SELECT * FROM :entity_name WHERE id = $1
   (RLS adds: AND tenant_id = current_setting('app.current_tenant_id'))
3. If no rows: return 404
4. Store previous_version = JSON.stringify(existing_record)
5. Validate updates against schema
6. Reject updates to: tenant_id, id, created_*
7. Build UPDATE query:
   UPDATE :entity_name 
   SET field1 = $1, field2 = $2, updated_date = now(), updated_by = $3
   WHERE id = $4
8. RLS UPDATE policy verifies tenant_id
9. Log update to compliance_events with previous_version
10. Cache response in Redis (idempotency)
11. Return updated record
                `}
              />

              {/* DELETE /api/v1/entities/:entity_name/:id */}
              <Endpoint
                method="DELETE"
                path="/api/v1/entities/:entity_name/:id"
                title="Delete Record"
                description="Soft delete (set deleted_at) or hard delete based on entity config"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={null}
                responseBody={{
                  success: 'boolean',
                  deleted_record: 'object (snapshot of deleted record)',
                  deletion_type: 'enum: soft | hard'
                }}
                securityNotes={[
                  'CRITICAL: Store snapshot before deletion (GDPR audit)',
                  'Some entities must soft-delete (compliance_events, runs)',
                  'Hard delete only allowed for non-audit entities',
                  'Cascade rules: block delete if dependencies exist'
                ]}
                backendLogic={`
1. Check idempotency
2. Fetch record (RLS verification)
3. If not found: return 404
4. Store snapshot: deleted_record = JSON.stringify(record)
5. Check entity deletion policy:
   - Audit tables (compliance_events, runs): SOFT DELETE ONLY
   - Other tables: soft or hard based on config
6. If soft delete:
   UPDATE :entity_name 
   SET deleted_at = now(), deleted_by = req.userId 
   WHERE id = $1
7. If hard delete:
   DELETE FROM :entity_name WHERE id = $1
8. Log to compliance_events (include snapshot)
9. Return success + snapshot
                `}
              />
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* CREDENTIAL VAULT API */}
          {/* ============================================================ */}
          
          <TabsContent value="vault">
            <div className="space-y-6">
              <SectionHeader
                icon={Lock}
                title="Credential Vault API"
                description="HSM-backed credential storage with zero-knowledge architecture"
              />

              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Security Requirements
                  </h4>
                  <ul className="space-y-2 text-sm text-red-900">
                    <li>✅ Use AWS Secrets Manager or HashiCorp Vault (never store plaintext)</li>
                    <li>✅ Credentials NEVER logged (not even in error messages)</li>
                    <li>✅ Backend fetches credentials, makes API calls (frontend never sees them)</li>
                    <li>✅ Encryption keys stored in HSM (AWS KMS)</li>
                    <li>✅ Automatic credential rotation every 90 days</li>
                    <li>✅ Every credential access logged (SOC2 requirement)</li>
                  </ul>
                </CardContent>
              </Card>

              {/* POST /api/v1/vault/connections */}
              <Endpoint
                method="POST"
                path="/api/v1/vault/connections"
                title="Store Connection Credentials"
                description="Securely store API credentials in HSM"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  provider: 'enum: shopify | stripe | xero | gmail | msgraph | slack',
                  name: 'string (friendly name)',
                  credentials: {
                    // Provider-specific structure
                    // Shopify:
                    api_key: 'string',
                    api_secret: 'string',
                    shop_domain: 'string',
                    // Stripe:
                    secret_key: 'string',
                    webhook_secret: 'string',
                    // OAuth providers:
                    access_token: 'string',
                    refresh_token: 'string',
                    expires_at: 'string (ISO 8601)'
                  },
                  metadata: {
                    environment: 'enum: production | sandbox',
                    description: 'string (optional)'
                  }
                }}
                responseBody={{
                  connection_id: 'string (UUID, opaque reference)',
                  provider: 'string',
                  name: 'string',
                  status: 'enum: active | pending_verification',
                  created_at: 'string (ISO 8601)',
                  // NOTE: credentials NOT returned
                }}
                securityNotes={[
                  'CRITICAL: Validate credentials format per provider',
                  'Immediately encrypt with HSM (AWS Secrets Manager)',
                  'Never store plaintext in database',
                  'Test credentials before storing (make test API call)',
                  'Log HIGH_SEVERITY event: credential_stored'
                ]}
                backendLogic={`
1. Check idempotency
2. Validate credentials structure for provider
3. Test credentials (make non-mutating API call):
   - Shopify: GET /admin/api/shop.json
   - Stripe: GET /v1/balance
   - Xero: GET /api.xro/2.0/Organisation
4. If test fails: return 400 with error
5. Generate connection_id = uuid()
6. Store in AWS Secrets Manager:
   SecretName: datachor/{tenant_id}/{connection_id}
   SecretString: JSON.stringify(credentials)
   Tags: [
     {Key: 'tenant_id', Value: tenant_id},
     {Key: 'provider', Value: provider},
     {Key: 'environment', Value: environment}
   ]
7. Store metadata in database:
   INSERT INTO connections (
     id, tenant_id, provider, name, 
     secret_arn, status, created_by, created_date
   ) VALUES (
     connection_id, tenant_id, provider, name,
     secretArn, 'active', user_id, now()
   )
8. Log to compliance_events:
   {
     category: 'data_access',
     event_type: 'credential_stored',
     severity: 'HIGH',
     ref_type: 'connection',
     ref_id: connection_id,
     actor: user_id,
     payload: {
       provider: provider,
       credential_type: determine_type(credentials)
     }
   }
9. Return connection_id (NOT credentials)
                `}
                scalingNotes={[
                  'AWS Secrets Manager: $0.40/secret/month + $0.05/10k API calls',
                  'Alternative: HashiCorp Vault (self-hosted)',
                  'Enable automatic rotation: AWS Lambda function triggered every 90 days'
                ]}
              />

              {/* POST /api/v1/vault/execute */}
              <Endpoint
                method="POST"
                path="/api/v1/vault/execute"
                title="Execute Action with Stored Credentials"
                description="Backend fetches credentials and makes API call"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  connection_id: 'string (UUID)',
                  action: 'string (e.g. orders.get, invoices.create)',
                  params: {
                    // Action-specific parameters
                    order_id: 'string',
                    amount: 'number',
                    // ... etc
                  },
                  timeout_ms: 'integer (optional, default: 30000, max: 60000)'
                }}
                responseBody={{
                  success: 'boolean',
                  result: 'object (API response from provider)',
                  duration_ms: 'integer',
                  action_id: 'string (UUID for tracking)'
                }}
                securityNotes={[
                  'CRITICAL: Credentials NEVER sent to frontend',
                  'Backend makes API call on behalf of user',
                  'Validate connection belongs to current tenant',
                  'Rate limit: 10 req/sec per connection',
                  'Log every API call (PII redacted)'
                ]}
                backendLogic={`
1. Check idempotency
2. Verify connection ownership:
   SELECT * FROM connections 
   WHERE id = connection_id 
     AND tenant_id = req.tenantId
     AND status = 'active'
3. If not found: return 404
4. Fetch credentials from AWS Secrets Manager:
   credentials = await secretsManager.getSecretValue({
     SecretId: connection.secret_arn
   })
5. Parse credentials JSON
6. Route to appropriate MCP tool implementation:
   if (provider === 'shopify') {
     result = await shopifyClient.execute(action, params, credentials)
   }
   // ... other providers
7. Measure duration
8. Log to compliance_events:
   {
     category: 'provider_call',
     event_type: \`\${provider}_\${action}\`,
     ref_type: 'connection',
     ref_id: connection_id,
     actor: user_id,
     payload: {
       action: action,
       params: redactPII(params),
       duration_ms: duration,
       success: success
     }
   }
9. Return result (never log credentials)
                `}
                scalingNotes={[
                  'Cache credentials in Redis (TTL: 5 min) to reduce AWS API calls',
                  'Use connection pooling for provider API clients',
                  'Implement circuit breaker per provider (stop after 5 failures)',
                  'Queue long-running actions in SQS'
                ]}
              />

              {/* POST /api/v1/vault/connections/:id/test */}
              <Endpoint
                method="POST"
                path="/api/v1/vault/connections/:id/test"
                title="Test Connection Health"
                description="Verify stored credentials still valid"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                responseBody={{
                  healthy: 'boolean',
                  last_tested: 'string (ISO 8601)',
                  error_message: 'string (if unhealthy)',
                  next_rotation_date: 'string (ISO 8601, if rotation enabled)'
                }}
                securityNotes={[
                  'Make non-mutating test call to provider',
                  'Update connection.last_health_check timestamp',
                  'If failed: set status = error, store error_message'
                ]}
                backendLogic={`
1. Verify ownership (same as execute)
2. Fetch credentials from Secrets Manager
3. Make test API call:
   - Shopify: GET /admin/api/shop.json
   - Stripe: GET /v1/balance
   - Xero: GET /api.xro/2.0/Organisation
4. If success:
   UPDATE connections 
   SET status = 'active', 
       last_health_check = now(),
       error_message = NULL
   WHERE id = connection_id
5. If failure:
   UPDATE connections 
   SET status = 'error',
       last_health_check = now(),
       error_message = error.message
   WHERE id = connection_id
6. Log health check result
7. Return status
                `}
              />

              {/* POST /api/v1/vault/connections/:id/rotate */}
              <Endpoint
                method="POST"
                path="/api/v1/vault/connections/:id/rotate"
                title="Rotate Connection Credentials"
                description="Generate new credentials (for OAuth refresh or API key rotation)"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  rotation_type: 'enum: automatic | manual',
                  new_credentials: 'object (if manual rotation, provide new creds)'
                }}
                responseBody={{
                  new_connection_id: 'string (UUID, new opaque reference)',
                  rotation_date: 'string (ISO 8601)',
                  old_connection_id: 'string (immediately invalidated)'
                }}
                securityNotes={[
                  'For OAuth: use refresh_token to get new access_token',
                  'For API keys: prompt user to generate new key in provider UI',
                  'Old credentials invalidated immediately',
                  'Update all workflow_steps using old connection_id'
                ]}
                backendLogic={`
1. Verify ownership
2. If rotation_type = 'automatic':
   if (provider supports OAuth):
     Use refresh_token to request new access_token
   else:
     return 400 "Manual rotation required for this provider"
3. If rotation_type = 'manual':
   Validate new_credentials format
4. Test new credentials
5. Create new secret in Secrets Manager:
   new_connection_id = uuid()
   SecretName: datachor/{tenant_id}/{new_connection_id}
   SecretString: JSON.stringify(new_credentials)
6. Create new connection record (copy metadata from old)
7. Invalidate old connection:
   UPDATE connections 
   SET status = 'rotated',
       rotated_at = now(),
       replacement_connection_id = new_connection_id
   WHERE id = old_connection_id
8. Update workflow_steps:
   UPDATE workflow_steps 
   SET connection_id = new_connection_id 
   WHERE connection_id = old_connection_id
9. Schedule old secret deletion (7 days grace period)
10. Log rotation event (HIGH_SEVERITY)
11. Return new_connection_id
                `}
              />

              {/* DELETE /api/v1/vault/connections/:id */}
              <Endpoint
                method="DELETE"
                path="/api/v1/vault/connections/:id"
                title="Delete Connection (Crypto-Shredding)"
                description="Permanently delete credentials from HSM"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  confirmation: 'string (must equal "DELETE_PERMANENTLY")'
                }}
                responseBody={{
                  success: 'boolean',
                  deleted_at: 'string (ISO 8601)',
                  crypto_shredded: 'boolean (true if secret deleted from HSM)'
                }}
                securityNotes={[
                  'CRITICAL: Check for dependencies (workflow_steps using this connection)',
                  'Require explicit confirmation string',
                  'Delete from HSM (crypto-shredding)',
                  'Keep connection metadata for audit (but no credentials)'
                ]}
                backendLogic={`
1. Check idempotency
2. Verify ownership
3. Validate confirmation = "DELETE_PERMANENTLY"
4. Check dependencies:
   SELECT COUNT(*) FROM workflow_steps 
   WHERE connection_id = connection_id
5. If count > 0:
   return 409 Conflict "Connection used in X workflow steps"
6. Delete from AWS Secrets Manager:
   await secretsManager.deleteSecret({
     SecretId: connection.secret_arn,
     ForceDeleteWithoutRecovery: true
   })
7. Update connection record (soft delete for audit):
   UPDATE connections 
   SET status = 'deleted',
       deleted_at = now(),
       deleted_by = user_id,
       secret_arn = NULL  -- Scrub ARN
   WHERE id = connection_id
8. Log CRITICAL event:
   {
     category: 'data_access',
     event_type: 'credential_deleted',
     severity: 'CRITICAL',
     ref_type: 'connection',
     ref_id: connection_id,
     actor: user_id
   }
9. Return success
                `}
              />
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* WORKFLOW & IDEMPOTENCY API */}
          {/* ============================================================ */}
          
          <TabsContent value="workflow">
            <div className="space-y-6">
              <SectionHeader
                icon={Zap}
                title="Workflow & Idempotency API"
                description="Distributed workflow execution with write-conflict prevention"
              />

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Architecture: Background Worker Model</h4>
                  <pre className="bg-blue-100 p-4 rounded text-xs overflow-x-auto">
{`// Worker process (runs separately from API server)
class WorkflowEngine {
  async start() {
    while (true) {
      const runs = await this.fetchPendingRuns();
      
      for (const run of runs) {
        // Process in parallel (with limit)
        this.executeRun(run).catch(err => {
          this.handleRunError(run, err);
        });
      }
      
      await sleep(1000); // Poll every 1 second
    }
  }
  
  async fetchPendingRuns() {
    // Use PostgreSQL row-level locking
    return await db.query(\`
      SELECT * FROM runs 
      WHERE status = 'pending' 
      ORDER BY started_at ASC 
      LIMIT 10 
      FOR UPDATE SKIP LOCKED
    \`);
  }
}

// Multiple workers can run concurrently
// FOR UPDATE SKIP LOCKED ensures no duplicate processing`}
                  </pre>
                </CardContent>
              </Card>

              {/* POST /api/v1/workflows/:workflow_id/trigger */}
              <Endpoint
                method="POST"
                path="/api/v1/workflows/:workflow_id/trigger"
                title="Trigger Workflow Execution"
                description="Create new workflow run (idempotent)"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  trigger_type: 'enum: webhook | schedule | manual',
                  trigger_payload: {
                    // Event data from webhook or manual input
                    order_id: 'string',
                    // ... event-specific data
                  },
                  options: {
                    priority: 'enum: low | normal | high (default: normal)',
                    max_retries: 'integer (default: 3)',
                    simulation_mode: 'boolean (default: false)'
                  }
                }}
                responseBody={{
                  run_id: 'string (UUID)',
                  status: 'enum: pending | running',
                  correlation_id: 'string (UUID for distributed tracing)',
                  estimated_duration_ms: 'integer (based on historical data)',
                  created_at: 'string (ISO 8601)'
                }}
                securityNotes={[
                  'Idempotency: same key + same workflow = return existing run',
                  'Verify workflow enabled and belongs to tenant',
                  'Generate correlation_id for distributed tracing',
                  'Validate trigger_payload against workflow schema'
                ]}
                backendLogic={`
1. Check idempotency:
   key = idempotency:{tenant_id}:workflow:{workflow_id}:{idempotency_key}
   existing_run_id = await redis.get(key)
   if (existing_run_id):
     return existing run (fetch from DB)
2. Verify workflow:
   SELECT * FROM workflows 
   WHERE id = workflow_id 
     AND tenant_id = req.tenantId 
     AND enabled = true
3. If not found: return 404
4. Generate IDs:
   run_id = uuid()
   correlation_id = uuid()
5. Create run record:
   INSERT INTO runs (
     id, tenant_id, workflow_id, 
     idempotency_key, correlation_id,
     trigger_type, trigger_payload,
     status, started_at, 
     current_step_order, context
   ) VALUES (
     run_id, tenant_id, workflow_id,
     idempotency_key, correlation_id,
     trigger_type, trigger_payload,
     'pending', now(),
     0, '{}'
   )
6. Cache run_id in Redis:
   redis.setex(key, 86400, run_id)  // 24h TTL
7. Notify workflow engine (Redis pub/sub):
   redis.publish('workflow:runs:new', run_id)
8. Log workflow trigger event
9. Return run_id + metadata
                `}
                scalingNotes={[
                  'Use Redis pub/sub to notify workers (real-time)',
                  'Alternatively: Workers poll database every 1 second',
                  'For high throughput: SQS queue for pending runs',
                  'Horizontal scaling: Multiple worker processes'
                ]}
              />

              {/* GET /api/v1/runs/:run_id */}
              <Endpoint
                method="GET"
                path="/api/v1/runs/:run_id"
                title="Get Run Status"
                description="Retrieve workflow run status and progress"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                responseBody={{
                  id: 'string (UUID)',
                  workflow_id: 'string (UUID)',
                  status: 'enum: pending | running | awaiting_approval | completed | failed | cancelled',
                  current_step_order: 'integer',
                  total_steps: 'integer',
                  progress_percent: 'integer (0-100)',
                  started_at: 'string (ISO 8601)',
                  finished_at: 'string (ISO 8601, if completed)',
                  duration_ms: 'integer (if completed)',
                  context: {
                    // Step outputs (PII redacted)
                    step_0_output: 'object',
                    step_1_output: 'object',
                    // ...
                  },
                  error_message: 'string (if failed)',
                  logs: 'array<object> (recent logs, full logs via /runs/:id/logs)'
                }}
                securityNotes={[
                  'Verify run belongs to tenant via RLS',
                  'Redact PII from context before returning',
                  'Dont expose credentials in step outputs'
                ]}
                backendLogic={`
1. Query with RLS:
   SELECT r.*, w.display_name as workflow_name,
     (SELECT COUNT(*) FROM workflow_steps WHERE workflow_id = r.workflow_id) as total_steps
   FROM runs r
   JOIN workflows w ON r.workflow_id = w.id
   WHERE r.id = run_id
2. If not found: return 404
3. Calculate progress:
   progress_percent = (current_step_order / total_steps) * 100
4. Redact PII from context:
   context = redactPII(run.context)
5. Fetch recent logs:
   SELECT * FROM run_logs 
   WHERE run_id = run_id 
   ORDER BY timestamp DESC 
   LIMIT 50
6. Return run status + metadata
                `}
              />

              {/* POST /api/v1/runs/:run_id/cancel */}
              <Endpoint
                method="POST"
                path="/api/v1/runs/:run_id/cancel"
                title="Cancel Running Workflow"
                description="Gracefully stop workflow execution"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  reason: 'string (required)',
                  rollback: 'boolean (default: false, if true attempt to rollback completed steps)'
                }}
                responseBody={{
                  success: 'boolean',
                  cancelled_at: 'string (ISO 8601)',
                  rollback_attempted: 'boolean',
                  rollback_results: 'array<object> (if rollback attempted)'
                }}
                securityNotes={[
                  'Only allow if status = running | awaiting_approval',
                  'Log cancellation reason',
                  'Notify workflow engine to stop processing',
                  'If rollback: execute rollback_action for completed steps (reverse order)'
                ]}
                backendLogic={`
1. Verify ownership via RLS
2. Check current status:
   if (status IN ['completed', 'failed', 'cancelled']):
     return 409 Conflict "Run already finished"
3. Update status:
   UPDATE runs 
   SET status = 'cancelled',
       finished_at = now(),
       error_message = 'Cancelled by user: ' || reason
   WHERE id = run_id
4. Notify workflow engine (Redis):
   redis.publish('workflow:runs:cancel', run_id)
5. If rollback = true:
   Fetch completed steps in reverse order
   For each step with rollback_action:
     Execute rollback_action
     Log rollback result
6. Log cancellation event (with reason)
7. Return success
                `}
              />

              {/* POST /api/v1/runs/:run_id/retry */}
              <Endpoint
                method="POST"
                path="/api/v1/runs/:run_id/retry"
                title="Retry Failed Workflow Run"
                description="Retry from failed step or from beginning"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true },
                  { name: 'Idempotency-Key', value: 'string (UUID)', required: true }
                ]}
                requestBody={{
                  retry_mode: 'enum: from_failure | from_beginning',
                  reset_context: 'boolean (default: false)'
                }}
                responseBody={{
                  new_run_id: 'string (UUID)',
                  parent_run_id: 'string (original run_id)',
                  status: 'enum: pending',
                  retry_count: 'integer'
                }}
                securityNotes={[
                  'Only allow if original run status = failed',
                  'Preserve correlation_id for tracing',
                  'Copy context from original run (unless reset_context)',
                  'Track retry_count (max: 5)'
                ]}
                backendLogic={`
1. Check idempotency
2. Verify original run:
   SELECT * FROM runs WHERE id = run_id
3. If status != 'failed': return 409 "Run not failed"
4. Count previous retries:
   SELECT COUNT(*) FROM runs 
   WHERE workflow_id = workflow_id 
     AND trigger_payload->>'original_run_id' = run_id
5. If retry_count >= 5: return 429 "Max retries exceeded"
6. Create new run:
   new_run_id = uuid()
   INSERT INTO runs (
     id, tenant_id, workflow_id,
     idempotency_key, correlation_id,  -- Copy correlation_id
     trigger_type, trigger_payload,
     status, started_at,
     current_step_order, context
   ) VALUES (
     new_run_id, tenant_id, workflow_id,
     new_idempotency_key, original_run.correlation_id,
     'manual', {...trigger_payload, original_run_id: run_id, retry_count: retry_count + 1},
     'pending', now(),
     (retry_mode = 'from_failure' ? original_run.current_step_order : 0),
     (reset_context ? '{}' : original_run.context)
   )
7. Notify workflow engine
8. Return new_run_id
                `}
              />

              {/* Distributed Locking Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle>Distributed Locking with PostgreSQL</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`-- Workflow Engine Polling Query
-- Ensures no duplicate processing across multiple workers

-- Worker 1 and Worker 2 execute simultaneously:
BEGIN;

-- This query locks rows for this transaction
SELECT * FROM runs 
WHERE status = 'pending' 
  AND tenant_id = current_setting('app.current_tenant_id')
ORDER BY started_at ASC 
LIMIT 10 
FOR UPDATE SKIP LOCKED;

-- Worker 1 gets rows 1-10
-- Worker 2 skips those (SKIP LOCKED) and gets rows 11-20

-- Update status immediately to prevent re-fetch
UPDATE runs 
SET status = 'running', 
    current_step_order = 0
WHERE id IN (locked_run_ids);

COMMIT;

-- Now process runs outside transaction

-- Alternative: Use Redis distributed lock (Redlock algorithm)
const lock = await redis.set(
  'run:lock:' + run_id,
  worker_id,
  'NX',  -- Only set if not exists
  'EX', 30  -- Expire after 30 seconds
);

if (!lock) {
  // Another worker is processing this run
  return;
}

// Process run...

// Release lock
await redis.del('run:lock:' + run_id);`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* COMPLIANCE & AUDIT API */}
          {/* ============================================================ */}
          
          <TabsContent value="compliance">
            <div className="space-y-6">
              <SectionHeader
                icon={FileText}
                title="Compliance & Audit Trail API"
                description="Tamper-proof audit logging with cryptographic verification"
              />

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Crypto-Chain Architecture</h4>
                  <p className="text-sm text-purple-800 mb-4">
                    Each compliance event contains SHA256(previous_event + current_event). 
                    Any modification breaks the chain, making tampering immediately detectable.
                  </p>
                  <pre className="bg-purple-100 p-4 rounded text-xs overflow-x-auto">
{`// Event Structure
{
  id: "uuid",
  tenant_id: "tenant_123",
  category: "data_access",
  event_type: "invoice_read",
  ts: "2025-01-09T12:34:56Z",
  actor: "user_456",
  payload: {...},  // PII redacted
  prev_digest_sha256: "abc123...",  // Hash of previous event
  digest_sha256: "def456..."        // Hash of this event
}

// Digest Calculation
digest = SHA256(
  prev_digest + 
  canonical_json(event)  // Sorted keys, no whitespace
)

// Chain Verification (hourly cron job)
events = SELECT * FROM compliance_events 
         WHERE tenant_id = ? 
         ORDER BY ts ASC

prev_digest = ""
for event in events:
  expected_digest = SHA256(prev_digest + canonical_json(event))
  if (event.digest_sha256 != expected_digest):
    ALERT: Chain integrity violation!
  prev_digest = event.digest_sha256`}
                  </pre>
                </CardContent>
              </Card>

              {/* POST /api/v1/compliance/events */}
              <Endpoint
                method="POST"
                path="/api/v1/compliance/events"
                title="Log Compliance Event"
                description="Append event to tamper-proof audit trail"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  category: 'enum: provider_call | data_access | config_change | user_action | approval | refund',
                  event_type: 'string (specific event name)',
                  ref_type: 'string (resource type)',
                  ref_id: 'string (resource ID)',
                  actor: 'string (user_id or email)',
                  payload: {
                    // Event-specific data (will be PII-redacted)
                  },
                  severity: 'enum: LOW | NORMAL | HIGH | CRITICAL (default: NORMAL)'
                }}
                responseBody={{
                  event_id: 'string (UUID)',
                  digest_sha256: 'string (hash of this event)',
                  prev_digest_sha256: 'string',
                  ts: 'string (ISO 8601)',
                  chain_valid: 'boolean (always true for new events)'
                }}
                securityNotes={[
                  'CRITICAL: Append-only table (no UPDATE or DELETE)',
                  'Compute hash chain on server (never trust client)',
                  'Redact PII from payload before storing',
                  'High-severity events trigger real-time alerts'
                ]}
                backendLogic={`
1. Extract tenant_id from JWT (middleware)
2. Redact PII from payload:
   payload = redactPII(payload)
3. Fetch last event digest:
   SELECT digest_sha256 FROM compliance_events 
   WHERE tenant_id = tenant_id 
   ORDER BY ts DESC 
   LIMIT 1
   FOR UPDATE  -- Lock to prevent race condition
4. If no previous event: prev_digest = ""
5. Prepare event object:
   event = {
     id: uuid(),
     tenant_id: tenant_id,
     category: category,
     event_type: event_type,
     ref_type: ref_type,
     ref_id: ref_id,
     actor: actor,
     payload: payload,
     ts: now(),
     prev_digest_sha256: prev_digest
   }
6. Compute digest:
   canonical_json = JSON.stringify(event, sort_keys=true, separators=(',', ':'))
   current_digest = SHA256(prev_digest + canonical_json)
7. Add digest to event:
   event.digest_sha256 = current_digest
8. Insert into database:
   INSERT INTO compliance_events (...) VALUES (...)
9. If severity = HIGH | CRITICAL:
   - Send alert to security team
   - Publish to monitoring system
10. Return event_id + digest
                `}
                scalingNotes={[
                  'Use database-level locking to prevent race conditions in hash chain',
                  'Consider partitioning compliance_events by month (10M+ rows)',
                  'Archive old events to cold storage (S3 Glacier) after 1 year',
                  'Merkle tree optimization: batch hash 1000 events into single root hash'
                ]}
              />

              {/* GET /api/v1/compliance/events */}
              <Endpoint
                method="GET"
                path="/api/v1/compliance/events"
                title="Query Compliance Events"
                description="Search audit trail with filters"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                queryParams={{
                  category: 'string (optional)',
                  event_type: 'string (optional)',
                  actor: 'string (optional, user_id or email)',
                  from_date: 'string (ISO 8601, optional)',
                  to_date: 'string (ISO 8601, optional)',
                  limit: 'integer (default: 100, max: 1000)',
                  offset: 'integer (default: 0)'
                }}
                responseBody={{
                  events: 'array<object>',
                  total_count: 'integer',
                  has_more: 'boolean'
                }}
                securityNotes={[
                  'Tenant isolation via RLS',
                  'Admin-only access to other users events',
                  'Rate limit: 10 queries/min',
                  'Large date ranges may be slow (use pagination)'
                ]}
                backendLogic={`
1. Validate query params
2. Build WHERE clause:
   WHERE tenant_id = current_setting('app.current_tenant_id')
   [AND category = $1]
   [AND event_type = $2]
   [AND actor = $3]
   [AND ts >= $4]
   [AND ts <= $5]
3. Query with pagination:
   SELECT * FROM compliance_events 
   WHERE ...
   ORDER BY ts DESC 
   LIMIT limit OFFSET offset
4. Get total count
5. Return results
                `}
              />

              {/* POST /api/v1/compliance/verify-chain */}
              <Endpoint
                method="POST"
                path="/api/v1/compliance/verify-chain"
                title="Verify Audit Trail Integrity"
                description="Check if event chain has been tampered with"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  from_date: 'string (ISO 8601, optional)',
                  to_date: 'string (ISO 8601, optional)'
                }}
                responseBody={{
                  chain_valid: 'boolean',
                  total_events: 'integer',
                  violations: 'array<object> (empty if valid)',
                  verification_timestamp: 'string (ISO 8601)'
                }}
                securityNotes={[
                  'Admin-only endpoint',
                  'Expensive operation (O(n) where n = event count)',
                  'Run as scheduled job (hourly) rather than on-demand',
                  'If violations found: CRITICAL alert'
                ]}
                backendLogic={`
1. Verify caller is admin
2. Fetch all events in date range:
   SELECT * FROM compliance_events 
   WHERE tenant_id = tenant_id 
   [AND ts >= from_date]
   [AND ts <= to_date]
   ORDER BY ts ASC
3. Verify chain:
   prev_digest = ""
   violations = []
   for event in events:
     expected_digest = SHA256(prev_digest + canonical_json(event))
     if (event.digest_sha256 != expected_digest):
       violations.append({
         event_id: event.id,
         expected_digest: expected_digest,
         actual_digest: event.digest_sha256,
         prev_event_id: prev_event.id
       })
     prev_digest = event.digest_sha256
4. If violations:
   - Log CRITICAL security event
   - Send alert to security team
   - Lock tenant account (status = suspended)
5. Return verification result
                `}
              />

              {/* POST /api/v1/compliance/anchors */}
              <Endpoint
                method="POST"
                path="/api/v1/compliance/anchors"
                title="Create Compliance Anchor"
                description="Create cryptographic anchor for period (daily job)"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  period: 'string (YYYY-MM-DD format)',
                  anchor_type: 'enum: daily | monthly'
                }}
                responseBody={{
                  anchor_id: 'string (UUID)',
                  period: 'string',
                  anchor_sha256: 'string (Merkle root of all events)',
                  hmac_sha256: 'string (HMAC signature)',
                  event_count: 'integer',
                  computed_at: 'string (ISO 8601)'
                }}
                securityNotes={[
                  'Run as daily cron job (00:00 UTC)',
                  'Merkle root: cryptographic summary of all events in period',
                  'HMAC: prevent anchor tampering (even if attacker modifies events + anchor)',
                  'Future: Submit anchor to blockchain for timestamping proof'
                ]}
                backendLogic={`
1. Verify admin or system user
2. Parse period dates:
   from_ts = period + 'T00:00:00Z'
   to_ts = period + 'T23:59:59Z'
3. Fetch all events in period:
   events = SELECT * FROM compliance_events 
            WHERE tenant_id = tenant_id 
              AND ts >= from_ts 
              AND ts < to_ts
            ORDER BY ts ASC
4. Build Merkle tree:
   leaf_hashes = events.map(e => SHA256(e.digest_sha256))
   merkle_root = buildMerkleTree(leaf_hashes)
5. Compute HMAC (prevents tampering):
   hmac = HMAC_SHA256(
     key: tenant_secret_key,
     message: merkle_root + period + event_count
   )
6. Store anchor:
   INSERT INTO compliance_anchors (
     id, tenant_id, period, anchor_sha256, hmac_sha256,
     from_ts, to_ts, event_count, computed_at
   ) VALUES (...)
7. Future enhancement:
   Submit anchor to blockchain:
   - Ethereum: store merkle_root in smart contract
   - Bitcoin: OP_RETURN anchor in transaction
   - OpenTimestamps: RFC 3161 timestamping
8. Return anchor
                `}
              />

              {/* GET /api/v1/compliance/gdpr/export */}
              <Endpoint
                method="GET"
                path="/api/v1/compliance/gdpr/export"
                title="GDPR Data Export"
                description="Export all user data (GDPR Article 20: Right to Data Portability)"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true }
                ]}
                requestBody={null}
                queryParams={{
                  format: 'enum: json | csv | xml (default: json)'
                }}
                responseBody={{
                  // File download (Content-Disposition: attachment)
                }}
                securityNotes={[
                  'User can only export their own data',
                  'Admin can export any users data (with reason logged)',
                  'Rate limit: 1 export per user per hour',
                  'Export includes: user profile, orders, invoices, approvals, audit trail'
                ]}
                backendLogic={`
1. Identify target user:
   if (admin requesting other users data):
     Require reason parameter
     Log HIGH_SEVERITY event
     target_user_id = query_param.user_id
   else:
     target_user_id = req.userId
2. Collect all user data:
   export_data = {
     user_profile: fetch_user_profile(target_user_id),
     orders: fetch_user_orders(target_user_id),
     invoices: fetch_user_invoices(target_user_id),
     approvals: fetch_user_approvals(target_user_id),
     workflow_runs: fetch_user_runs(target_user_id),
     compliance_events: fetch_user_audit_trail(target_user_id)
   }
3. Format based on requested format:
   if (format = 'json'):
     response = JSON.stringify(export_data, null, 2)
   if (format = 'csv'):
     response = convertToCSV(export_data)
4. Set response headers:
   Content-Type: application/json | text/csv
   Content-Disposition: attachment; filename="user-{user_id}-export.{format}"
5. Return file
                `}
              />

              {/* POST /api/v1/compliance/gdpr/erase */}
              <Endpoint
                method="POST"
                path="/api/v1/compliance/gdpr/erase"
                title="GDPR Right to Erasure"
                description="Crypto-shred user data (GDPR Article 17)"
                headers={[
                  { name: 'Authorization', value: 'Bearer <jwt>', required: true },
                  { name: 'Content-Type', value: 'application/json', required: true }
                ]}
                requestBody={{
                  user_id: 'string (UUID)',
                  reason: 'string (required)',
                  confirmation: 'string (must equal "ERASE_PERMANENTLY")'
                }}
                responseBody={{
                  success: 'boolean',
                  method: 'enum: crypto_shred | hard_delete',
                  erased_at: 'string (ISO 8601)',
                  data_categories_erased: 'array<string>'
                }}
                securityNotes={[
                  'CRITICAL: Crypto-shredding (delete encryption key, not data)',
                  'Encrypted data remains but is permanently unrecoverable',
                  'Audit trail preserved (already PII-redacted)',
                  'Irreversible operation - require confirmation'
                ]}
                backendLogic={`
1. Verify admin OR self-service
2. Validate confirmation = "ERASE_PERMANENTLY"
3. Log erasure request:
   INSERT INTO compliance_events (
     category: 'data_access',
     event_type: 'gdpr_erasure_request',
     ref_type: 'user',
     ref_id: user_id,
     actor: req.userId,
     payload: {reason: reason},
     severity: 'CRITICAL'
   )
4. Crypto-shredding approach:
   a. Identify user encryption key in HSM:
      key_id = 'user-encryption-key-' + user_id
   b. Delete key from HSM:
      await kms.scheduleKeyDeletion({
        KeyId: key_id,
        PendingWindowInDays: 7  // 7 day recovery window
      })
   c. Update user record:
      UPDATE users 
      SET encryption_key_id = NULL,
          data_erased_at = now(),
          gdpr_erasure_reason = reason
      WHERE id = user_id
   d. Encrypted data in database becomes unrecoverable
5. Compliance events remain intact (already PII-redacted)
6. Send confirmation email to user
7. Return success
                `}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* ============================================================ */}
        {/* APPENDIX: Common Headers & Error Responses */}
        {/* ============================================================ */}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Common HTTP Headers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Headers (All Endpoints)</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">Authorization: Bearer &lt;jwt&gt;</code> - Required for all authenticated endpoints</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">Content-Type: application/json</code> - For POST/PUT/PATCH requests</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">Idempotency-Key: &lt;uuid&gt;</code> - Required for all write operations</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">X-Request-ID: &lt;uuid&gt;</code> - Optional, for distributed tracing</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Headers (All Endpoints)</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">X-Request-ID: &lt;uuid&gt;</code> - Echo back request ID</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">X-RateLimit-Remaining: &lt;int&gt;</code> - Remaining requests in window</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">X-RateLimit-Reset: &lt;unix_timestamp&gt;</code> - When limit resets</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">X-Tenant-ID: &lt;tenant_id&gt;</code> - Current tenant (for debugging)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Standard Error Response Format</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// All errors follow this structure
{
  "error": {
    "code": "TENANT_NOT_FOUND",          // Machine-readable error code
    "message": "Tenant not found",       // Human-readable message
    "details": {                         // Optional additional context
      "tenant_id": "tenant_123"
    },
    "request_id": "req_abc123",          // For support debugging
    "documentation_url": "https://docs.datachor.com/errors/TENANT_NOT_FOUND"
  }
}

// HTTP Status Codes
200 OK                   // Success
201 Created              // Resource created
400 Bad Request          // Invalid input
401 Unauthorized         // Missing/invalid JWT
403 Forbidden            // Valid JWT but insufficient permissions
404 Not Found            // Resource not found (or wrong tenant)
409 Conflict             // Idempotency key conflict, resource state conflict
422 Unprocessable Entity // Validation error
429 Too Many Requests    // Rate limit exceeded
500 Internal Server Error// Server error (logged, monitored)
503 Service Unavailable  // Maintenance mode or overload`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rate Limiting Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// Redis-based sliding window rate limiter
class RateLimiter {
  async checkLimit(key, limit, window_seconds) {
    const now = Date.now();
    const window_start = now - (window_seconds * 1000);
    
    // Remove old requests outside window
    await redis.zremrangebyscore(key, 0, window_start);
    
    // Count requests in current window
    const count = await redis.zcard(key);
    
    if (count >= limit) {
      throw new RateLimitError('Rate limit exceeded');
    }
    
    // Add current request
    await redis.zadd(key, now, \`\${now}-\${uuid()}\`);
    await redis.expire(key, window_seconds);
    
    return {
      remaining: limit - count - 1,
      reset: window_start + (window_seconds * 1000)
    };
  }
}

// Apply per tenant: rate_limit:tenant:{tenant_id}
// Apply per user: rate_limit:user:{user_id}
// Apply per endpoint: rate_limit:endpoint:{endpoint}:{user_id}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 mb-6 p-6 bg-white rounded-lg border-l-4 border-indigo-500">
      <Icon className="w-8 h-8 text-indigo-600 mt-1" />
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

function Endpoint({
  method,
  path,
  title,
  description,
  headers,
  requestBody,
  responseBody,
  queryParams,
  securityNotes,
  backendLogic,
  scalingNotes
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={
                method === 'GET' ? 'bg-green-100 text-green-800' :
                method === 'POST' ? 'bg-blue-100 text-blue-800' :
                method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {method}
              </Badge>
              <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">{path}</code>
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headers */}
        {headers && headers.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Headers</h4>
            <div className="space-y-1">
              {headers.map((header, idx) => (
                <div key={idx} className="text-xs font-mono bg-gray-50 p-2 rounded flex items-center justify-between">
                  <span>{header.name}: {header.value}</span>
                  {header.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query Parameters */}
        {queryParams && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Query Parameters</h4>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(queryParams, null, 2)}
            </pre>
          </div>
        )}

        {/* Request Body */}
        {requestBody && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Request Body</h4>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
              {typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        )}

        {/* Response Body */}
        {responseBody && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Response Body (200 OK)</h4>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
              {typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)}
            </pre>
          </div>
        )}

        {/* Security Notes */}
        {securityNotes && securityNotes.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-sm text-red-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Considerations
            </h4>
            <ul className="space-y-1">
              {securityNotes.map((note, idx) => (
                <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Backend Logic */}
        {backendLogic && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-700">Backend Implementation Logic</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {backendLogic}
            </pre>
          </div>
        )}

        {/* Scaling Notes */}
        {scalingNotes && scalingNotes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-sm text-blue-900 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Scaling & Optimization Notes
            </h4>
            <ul className="space-y-1">
              {scalingNotes.map((note, idx) => (
                <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}