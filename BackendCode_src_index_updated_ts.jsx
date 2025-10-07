import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_index_updated_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/index.ts (UPDATED)
// Add new routes to existing Express app

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import workflowRoutes from './routes/workflows.js';
import credentialRoutes from './routes/credentials.js';
import complianceRoutes from './routes/compliance.js';

// NEW ROUTES
import marketplaceRoutes from './routes/marketplace.js';
import publisherRoutes from './routes/publisher.js';
import metricsRoutes from './routes/metrics.js';
import gdprRoutes from './routes/gdpr.js';
import approvalRoutes from './routes/approvals.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Existing Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/compliance', complianceRoutes);

// New Marketplace Routes
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/publisher', publisherRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/approvals', approvalRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 DataChoreography Backend running on port \${PORT}\`);
  console.log(\`📊 Marketplace API: http://localhost:\${PORT}/api/marketplace\`);
  console.log(\`📝 Publisher API: http://localhost:\${PORT}/api/publisher\`);
  console.log(\`📈 Metrics API: http://localhost:\${PORT}/api/metrics\`);
  console.log(\`🔒 GDPR API: http://localhost:\${PORT}/api/gdpr\`);
});`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-mono text-gray-700">src/index.ts (Updated)</h2>
              <Button onClick={copyCode} size="sm">
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}