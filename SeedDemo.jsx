import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Trash2, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { Order, Invoice, Run, Workflow, WorkflowStep, Return } from '@/api/entities';

export default function SeedDemo() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState({
    orders: 0,
    invoices: 0,
    runs: 0,
    returns: 0,
  });

  const loadStats = async () => {
    try {
      const orders = await Order.list();
      const invoices = await Invoice.list();
      const runs = await Run.list();
      const returns = await Return.list();

      setStats({
        orders: orders.length,
        invoices: invoices.length,
        runs: runs.length,
        returns: returns.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  const generateDemoOrders = () => {
    const products = [
      { name: 'Wireless Headphones', price: 129.99 },
      { name: 'Smart Watch', price: 299.99 },
      { name: 'Laptop Stand', price: 49.99 },
      { name: 'USB-C Cable', price: 19.99 },
      { name: 'Phone Case', price: 29.99 },
    ];

    const customers = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' },
      { name: 'Alice Williams', email: 'alice@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
    ];

    return Array.from({ length: 20 }, (_, i) => {
      const product = products[Math.floor(Math.random() * products.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const total = product.price * quantity;

      return {
        external_id: `DEMO_ORDER_${i + 1}`,
        order_number: `#${1000 + i}`,
        customer_email: customer.email,
        customer_name: customer.name,
        total_amount: total,
        currency: 'USD',
        status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
        financial_status: ['pending', 'authorized', 'paid'][Math.floor(Math.random() * 3)],
        order_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        order_data: {
          line_items: [
            {
              product_name: product.name,
              quantity,
              price: product.price,
            },
          ],
        },
      };
    });
  };

  const generateDemoInvoices = (orders) => {
    return orders.slice(0, 15).map((order, i) => ({
      order_id: order.id,
      external_id: `DEMO_INV_${i + 1}`,
      invoice_number: `INV-${2000 + i}`,
      customer_email: order.customer_email,
      total_amount: order.total_amount,
      amount_due: Math.random() > 0.7 ? order.total_amount : 0,
      currency: 'USD',
      status: Math.random() > 0.7 ? 'overdue' : Math.random() > 0.5 ? 'paid' : 'sent',
      invoice_date: order.order_date.split('T')[0],
      due_date: new Date(new Date(order.order_date).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      invoice_data: {},
    }));
  };

  const generateDemoRuns = (workflows) => {
    if (workflows.length === 0) return [];

    return Array.from({ length: 30 }, (_, i) => {
      const workflow = workflows[Math.floor(Math.random() * workflows.length)];
      const status = Math.random() > 0.9 ? 'failed' : Math.random() > 0.05 ? 'completed' : 'running';
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const duration = Math.random() * 10000 + 1000;

      return {
        workflow_id: workflow.id,
        idempotency_key: `DEMO_RUN_${i + 1}`,
        trigger_type: workflow.trigger_type,
        status,
        current_step_order: status === 'completed' ? 3 : Math.floor(Math.random() * 4),
        started_at: startTime.toISOString(),
        finished_at: status === 'completed' ? new Date(startTime.getTime() + duration).toISOString() : null,
        duration_ms: status === 'completed' ? Math.round(duration) : null,
        correlation_id: `DEMO_CORR_${i + 1}`,
        is_simulation: true,
        context: {
          demo: true,
          order_id: `DEMO_ORDER_${Math.floor(Math.random() * 20) + 1}`,
        },
        error_message: status === 'failed' ? 'Demo error: Rate limit exceeded' : null,
        actions_count: Math.floor(Math.random() * 5) + 1,
      };
    });
  };

  const generateDemoReturns = (orders) => {
    return orders.slice(0, 5).map((order, i) => ({
      order_id: order.id,
      external_id: `DEMO_RETURN_${i + 1}`,
      status: ['requested', 'approved', 'received', 'refunded'][Math.floor(Math.random() * 4)],
      reason: [
        'Wrong size',
        'Changed mind',
        'Damaged item',
        'Not as described',
      ][Math.floor(Math.random() * 4)],
      refund_amount: order.total_amount,
      currency: 'USD',
      requested_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      items_json: order.order_data.line_items,
    }));
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    setStatus({ type: 'info', message: 'Generating demo data...' });

    try {
      // Generate and insert orders
      setStatus({ type: 'info', message: 'Creating demo orders...' });
      const orderData = generateDemoOrders();
      const createdOrders = await Order.bulkCreate(orderData);

      // Generate and insert invoices
      setStatus({ type: 'info', message: 'Creating demo invoices...' });
      const invoiceData = generateDemoInvoices(createdOrders);
      await Invoice.bulkCreate(invoiceData);

      // Get workflows
      const workflows = await Workflow.list();

      // Generate and insert runs
      if (workflows.length > 0) {
        setStatus({ type: 'info', message: 'Creating demo workflow runs...' });
        const runData = generateDemoRuns(workflows);
        await Run.bulkCreate(runData);
      }

      // Generate and insert returns
      setStatus({ type: 'info', message: 'Creating demo returns...' });
      const returnData = generateDemoReturns(createdOrders);
      await Return.bulkCreate(returnData);

      setStatus({ type: 'success', message: 'Demo data created successfully!' });
      await loadStats();
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to seed demo data: ${error.message}` });
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('This will delete all demo data. Are you sure?')) {
      return;
    }

    setClearing(true);
    setStatus({ type: 'info', message: 'Clearing demo data...' });

    try {
      // Delete all orders, invoices, runs, returns
      const orders = await Order.list();
      const invoices = await Invoice.list();
      const runs = await Run.list();
      const returns = await Return.list();

      for (const order of orders) {
        if (order.external_id?.startsWith('DEMO_')) {
          await Order.delete(order.id);
        }
      }

      for (const invoice of invoices) {
        if (invoice.external_id?.startsWith('DEMO_')) {
          await Invoice.delete(invoice.id);
        }
      }

      for (const run of runs) {
        if (run.idempotency_key?.startsWith('DEMO_')) {
          await Run.delete(run.id);
        }
      }

      for (const ret of returns) {
        if (ret.external_id?.startsWith('DEMO_')) {
          await Return.delete(ret.id);
        }
      }

      setStatus({ type: 'success', message: 'Demo data cleared successfully!' });
      await loadStats();
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to clear demo data: ${error.message}` });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            Demo Data Generator
          </h1>
          <p className="text-gray-600 mt-2">
            Generate synthetic data to test your workflows without real transactions
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800'
                : status.type === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}
          >
            {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {status.type === 'info' && <Database className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.orders}</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invoices</p>
                  <p className="text-2xl font-bold text-green-600">{stats.invoices}</p>
                </div>
                <FileText className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Workflow Runs</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.runs}</p>
                </div>
                <Play className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Returns</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.returns}</p>
                </div>
                <RotateCcw className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Generate Demo Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Creates synthetic orders, invoices, workflow runs, and returns for testing
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 20 sample orders</li>
                <li>• 15 invoices (some overdue)</li>
                <li>• 30 workflow runs</li>
                <li>• 5 return requests</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  All demo data is tagged as simulation and won't trigger real actions
                </p>
              </div>
              <Button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {seeding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Generate Demo Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Clear Demo Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Remove all synthetic demo data from your workspace
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Deletes all DEMO_ prefixed records</li>
                <li>• Keeps real production data</li>
                <li>• Cannot be undone</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action is permanent
                </p>
              </div>
              <Button
                onClick={handleClearDemo}
                disabled={clearing}
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50"
              >
                {clearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Demo Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About Demo Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Demo mode allows you to test workflows without making real changes to your systems:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All workflow runs are tagged as <code className="bg-gray-100 px-1">is_simulation: true</code></li>
              <li>No real API calls are made to connected services</li>
              <li>Synthetic data is clearly marked with DEMO_ prefix</li>
              <li>Perfect for testing approval flows and error handling</li>
              <li>You can switch to live mode anytime from workflow settings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}