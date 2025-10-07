import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Code, Database, Shield, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BackendCode_INDEX() {
  const fileCategories = [
    {
      name: 'Configuration',
      icon: Settings,
      color: 'indigo',
      files: [
        { name: 'package.json', path: 'BackendCode_package_json', desc: 'Dependencies & scripts' },
        { name: 'tsconfig.json', path: 'BackendCode_tsconfig_json', desc: 'TypeScript config' },
        { name: '.env.example', path: 'BackendCode_env_example', desc: 'Environment variables' },
        { name: 'drizzle.config.ts', path: 'BackendCode_drizzle_config', desc: 'Database ORM config' },
      ]
    },
    {
      name: 'Core Server',
      icon: Code,
      color: 'green',
      files: [
        { name: 'src/index.ts', path: 'BackendCode_src_index_ts', desc: 'Server entry point' },
        { name: 'src/db.ts', path: 'BackendCode_src_db_ts', desc: 'Database client' },
        { name: 'src/schema.ts', path: 'BackendCode_src_schema_ts', desc: 'Drizzle schema' },
      ]
    },
    {
      name: 'Security Layer',
      icon: Shield,
      color: 'red',
      files: [
        { name: 'src/security/keys.ts', path: 'BackendCode_src_security_keys_ts', desc: 'RSA key management' },
        { name: 'src/security/jwt.ts', path: 'BackendCode_src_security_jwt_ts', desc: 'JWT signing/verification' },
        { name: 'src/security/hash.ts', path: 'BackendCode_src_security_hash_ts', desc: 'Password hashing' },
      ]
    },
    {
      name: 'Middleware',
      icon: Shield,
      color: 'purple',
      files: [
        { name: 'src/middleware/auth.ts', path: 'BackendCode_src_middleware_auth_ts', desc: 'Authentication' },
        { name: 'src/middleware/rls.ts', path: 'BackendCode_src_middleware_rls_ts', desc: 'Row-level security' },
      ]
    },
    {
      name: 'API Routes',
      icon: Code,
      color: 'blue',
      files: [
        { name: 'src/routes/auth.ts', path: 'BackendCode_src_routes_auth_ts', desc: 'Authentication endpoints' },
        { name: 'src/routes/tenants.ts', path: 'BackendCode_src_routes_tenants_ts', desc: 'Tenant management' },
        { name: 'src/routes/workflows.ts', path: 'BackendCode_src_routes_workflows_ts', desc: 'Workflow operations' },
        { name: 'src/routes/credentials.ts', path: 'BackendCode_src_routes_credentials_ts', desc: 'Credential vault' },
        { name: 'src/routes/compliance.ts', path: 'BackendCode_src_routes_compliance_ts', desc: 'Audit logging' },
      ]
    },
    {
      name: 'Libraries',
      icon: FileText,
      color: 'yellow',
      files: [
        { name: 'src/lib/idempotency.ts', path: 'BackendCode_src_lib_idempotency_ts', desc: 'Idempotency keys' },
        { name: 'src/lib/locks.ts', path: 'BackendCode_src_lib_locks_ts', desc: 'Distributed locks' },
      ]
    },
    {
      name: 'Vault Module',
      icon: Shield,
      color: 'orange',
      files: [
        { name: 'src/modules/vault/index.ts', path: 'BackendCode_src_modules_vault_index_ts', desc: 'Encryption vault' },
      ]
    },
    {
      name: 'Database',
      icon: Database,
      color: 'teal',
      files: [
        { name: 'drizzle/migrations/000_init.sql', path: 'BackendCode_migration_0000_init_sql', desc: 'Initial migration' },
      ]
    },
    {
      name: 'Scripts',
      icon: FileText,
      color: 'pink',
      files: [
        { name: 'scripts/migrate.ts', path: 'BackendCode_scripts_migrate_ts', desc: 'Run migrations' },
        { name: 'scripts/seed.ts', path: 'BackendCode_scripts_seed_ts', desc: 'Seed demo data' },
      ]
    },
    {
      name: 'DevOps',
      icon: Settings,
      color: 'gray',
      files: [
        { name: 'docker-compose.yml', path: 'BackendCode_docker_compose_yml', desc: 'Local development' },
        { name: 'Dockerfile', path: 'BackendCode_Dockerfile', desc: 'Container image' },
        { name: 'README.md', path: 'BackendCode_README_md', desc: 'Setup instructions' },
        { name: '.gitignore', path: 'BackendCode_gitignore', desc: 'Git ignore rules' },
        { name: '.github/workflows/ci.yml', path: 'BackendCode_github_workflows_ci_yml', desc: 'CI/CD pipeline' },
      ]
    },
  ];

  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Backend Code Repository</h1>
          <p className="text-gray-600">
            Complete TypeScript backend with Fastify, PostgreSQL RLS, JWT auth, and encryption vault
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Each page contains one complete file.</strong> Click any file to view and copy its contents.
              All files are production-ready and follow security best practices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {fileCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[category.color]} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.files.map((file) => (
                      <Link key={file.path} to={createPageUrl(file.path)}>
                        <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm font-semibold truncate">{file.name}</p>
                              <p className="text-xs text-gray-600 truncate">{file.desc}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Features Included
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
              <li>✅ JWT RS256 authentication</li>
              <li>✅ Row-level security (RLS)</li>
              <li>✅ Bcrypt + pepper password hashing</li>
              <li>✅ AES-256-GCM encryption vault</li>
              <li>✅ Idempotency keys</li>
              <li>✅ Distributed locks</li>
              <li>✅ CORS & request validation</li>
              <li>✅ Compliance audit logging</li>
              <li>✅ Impersonation tracking</li>
              <li>✅ Rate limiting ready</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}