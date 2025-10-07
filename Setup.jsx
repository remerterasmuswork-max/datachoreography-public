import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import IntegrationGuide from '../components/IntegrationGuide';
import { Workflow, WorkflowStep, EmailTemplate } from '@/api/entities';

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  const createSampleWorkflows = async () => {
    setLoading(true);
    setStatus({ message: 'Creating workflows...', type: 'info' });

    try {
      // Create Order-to-Cash workflow
      const o2c = await Workflow.create({
        workflow_key: 'o2c',
        display_name: 'Order-to-Cash',
        description: 'Automated order processing from Shopify to Xero invoice and Stripe payment',
        enabled: false,
        simulation_mode: true,
        trigger_type: 'webhook',
        trigger_config: {
          event: 'order.created',
          source: 'shopify'
        }
      });

      // Create O2C steps
      await WorkflowStep.bulkCreate([
        {
          workflow_id: o2c.id,
          step_order: 0,
          step_name: 'fetch_order_details',
          tool: 'shopify',
          action: 'orders.get',
          mapping_json: {
            order_id: { from: 'context', path: '$.id' }
          }
        },
        {
          workflow_id: o2c.id,
          step_order: 1,
          step_name: 'create_xero_invoice',
          tool: 'xero',
          action: 'invoices.create',
          mapping_json: {
            contact: { from: 'context', path: '$.fetch_order_details.order.customer' },
            line_items: { from: 'context', path: '$.fetch_order_details.order.line_items' },
            reference: { from: 'context', path: '$.fetch_order_details.order.name' }
          }
        },
        {
          workflow_id: o2c.id,
          step_order: 2,
          step_name: 'send_receipt',
          tool: 'email',
          action: 'email.send_template',
          mapping_json: {
            to: { from: 'context', path: '$.fetch_order_details.order.email' },
            subject: { from: 'static', value: 'Order Receipt' },
            template_name: { from: 'static', value: 'payment_receipt' }
          },
          continue_on_error: true
        }
      ]);

      // Create Returns workflow
      const returns = await Workflow.create({
        workflow_key: 'return_refund',
        display_name: 'Returns & Refunds',
        description: 'Process returns with approval, restock, and refund',
        enabled: false,
        simulation_mode: true,
        trigger_type: 'webhook',
        trigger_config: {
          event: 'return.requested'
        }
      });

      await WorkflowStep.bulkCreate([
        {
          workflow_id: returns.id,
          step_order: 0,
          step_name: 'approval_gate',
          tool: 'slack',
          action: 'message.with_buttons',
          requires_approval: true,
          approval_roles: ['admin', 'owner']
        },
        {
          workflow_id: returns.id,
          step_order: 1,
          step_name: 'process_refund',
          tool: 'stripe',
          action: 'refunds.create',
          mapping_json: {
            charge: { from: 'context', path: '$.payment_details.charge_id' },
            amount: { from: 'context', path: '$.refund_amount' }
          }
        }
      ]);

      // Create Smart Dunning workflow
      const dunning = await Workflow.create({
        workflow_key: 'smart_dunning',
        display_name: 'Smart Dunning',
        description: 'Intelligent AR management with segmented reminders',
        enabled: false,
        simulation_mode: true,
        trigger_type: 'schedule',
        trigger_config: {
          cron: '0 9 * * *'
        }
      });

      // Create email templates
      await EmailTemplate.bulkCreate([
        {
          name: 'payment_receipt',
          subject: 'Payment Receipt - Order {{order_number}}',
          html_body: '<h1>Thank you for your order!</h1><p>Order: {{order_number}}</p><p>Total: {{total_amount}}</p>',
          text_body: 'Thank you for your order!\nOrder: {{order_number}}\nTotal: {{total_amount}}',
          variables: ['order_number', 'total_amount', 'customer_name']
        },
        {
          name: 'refund_confirmation',
          subject: 'Refund Processed - Order {{order_number}}',
          html_body: '<h1>Refund Processed</h1><p>We have processed your refund of {{refund_amount}}.</p>',
          text_body: 'Refund Processed\nWe have processed your refund of {{refund_amount}}.',
          variables: ['order_number', 'refund_amount']
        }
      ]);

      setStatus({ 
        message: 'Sample workflows and templates created successfully! Go to Workflows page to configure and enable them.', 
        type: 'success' 
      });
    } catch (error) {
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Setup DataChoreography</h1>
          <p className="text-gray-600 mt-2">Configure integrations and create your first workflows</p>
        </div>

        {status.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-800' :
            status.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {status.type === 'info' && <Info className="w-5 h-5" />}
            <span>{status.message}</span>
          </div>
        )}

        <Tabs defaultValue="guide" className="space-y-6">
          <TabsList>
            <TabsTrigger value="guide">Integration Guide</TabsTrigger>
            <TabsTrigger value="workflows">Sample Workflows</TabsTrigger>
            <TabsTrigger value="mcp">MCP Tools Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="guide">
            <IntegrationGuide />
          </TabsContent>

          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Sample Workflows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Click the button below to create 3 sample workflows with preconfigured steps:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold">1. Order-to-Cash</h4>
                    <p className="text-sm text-gray-600">Shopify order → Xero invoice → Stripe payment → Email receipt</p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">2. Returns & Refunds</h4>
                    <p className="text-sm text-gray-600">Return request → Approval → Restock → Refund → Email confirmation</p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold">3. Smart Dunning</h4>
                    <p className="text-sm text-gray-600">Daily check for overdue invoices → Segmented reminders → Payment links</p>
                  </div>
                </div>

                <Button 
                  onClick={createSampleWorkflows}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Sample Workflows'}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Workflows will be created in simulation mode. You'll need to:
                    <ol className="list-decimal ml-5 mt-2 space-y-1">
                      <li>Connect your integrations (Shopify, Stripe, Xero, etc.)</li>
                      <li>Assign connections to workflow steps</li>
                      <li>Disable simulation mode and enable the workflow</li>
                    </ol>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mcp">
            <Card>
              <CardHeader>
                <CardTitle>MCP Tools Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Shopify Tools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Shopify Tools</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><code className="font-mono">orders.get</code> - Fetch order details</div>
                      <div><code className="font-mono">orders.list</code> - List orders with filters</div>
                      <div><code className="font-mono">refunds.create</code> - Create refund</div>
                      <div><code className="font-mono">inventory.adjust</code> - Adjust inventory levels</div>
                      <div><code className="font-mono">notes.add</code> - Add note to order</div>
                      <div><code className="font-mono">fulfillments.update</code> - Update fulfillment status</div>
                    </div>
                  </div>

                  {/* Stripe Tools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Stripe Tools</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><code className="font-mono">payments.get</code> - Get payment intent</div>
                      <div><code className="font-mono">payment_intents.create</code> - Create payment intent</div>
                      <div><code className="font-mono">charges.capture</code> - Capture authorized charge</div>
                      <div><code className="font-mono">refunds.create</code> - Process refund</div>
                      <div><code className="font-mono">payment_links.create</code> - Create payment link</div>
                    </div>
                  </div>

                  {/* Xero Tools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Xero Tools</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><code className="font-mono">invoices.create</code> - Create invoice</div>
                      <div><code className="font-mono">invoices.get</code> - Get invoice details</div>
                      <div><code className="font-mono">payments.apply</code> - Apply payment to invoice</div>
                      <div><code className="font-mono">credit_notes.create</code> - Create credit note</div>
                      <div><code className="font-mono">attachments.add</code> - Attach file to invoice</div>
                      <div><code className="font-mono">aging.get</code> - Get AR aging report</div>
                    </div>
                  </div>

                  {/* Email Tools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Email Tools (Gmail/MS Graph)</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><code className="font-mono">email.send_template</code> - Send templated email</div>
                      <div><code className="font-mono">thread.find_by_ref</code> - Find email thread</div>
                      <div><code className="font-mono">label.add</code> - Add label to message</div>
                    </div>
                  </div>

                  {/* Slack Tools */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Slack Tools</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><code className="font-mono">message.post</code> - Post message to channel</div>
                      <div><code className="font-mono">message.with_buttons</code> - Post interactive message with buttons</div>
                      <div><code className="font-mono">thread.post</code> - Post reply in thread</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}