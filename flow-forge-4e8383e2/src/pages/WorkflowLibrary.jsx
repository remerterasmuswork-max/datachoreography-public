import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Star, Download, Zap, Clock, DollarSign, TrendingUp } from 'lucide-react';
import WorkflowCard from '../components/marketplace/WorkflowCard';
import WorkflowInstaller from '../components/marketplace/WorkflowInstaller';
import { motion } from 'framer-motion';

export default function WorkflowLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [installing, setInstalling] = useState(false);

  // Prebuilt workflow templates (marketplace-ready)
  const workflowTemplates = [
    {
      id: 'order-to-cash',
      name: 'Order-to-Cash Automation',
      description: 'Automatically sync Shopify orders to Xero invoices, capture Stripe payments, and send customer receipts',
      category: 'finance',
      icon: '💰',
      popularity: 4.8,
      installs: 1247,
      steps: 5,
      estimatedTimeSaved: '3 hours/week',
      revenueImpact: 'High',
      connections: ['shopify', 'stripe', 'xero', 'email'],
      triggers: ['order.created'],
      actions: [
        'Fetch order details from Shopify',
        'Create invoice in Xero',
        'Capture payment via Stripe',
        'Send receipt email',
        'Update order status'
      ],
      complexity: 'medium',
      tags: ['popular', 'revenue', 'e-commerce']
    },
    {
      id: 'smart-refunds',
      name: 'Smart Refund Processing',
      description: 'Handle refund requests with approval workflow, automatic Stripe refunds, inventory restocking, and customer notifications',
      category: 'operations',
      icon: '↩️',
      popularity: 4.6,
      installs: 892,
      steps: 6,
      estimatedTimeSaved: '2 hours/week',
      revenueImpact: 'Medium',
      connections: ['shopify', 'stripe', 'slack', 'email'],
      triggers: ['refund.requested'],
      actions: [
        'Create approval request in Slack',
        'Process Stripe refund',
        'Update Shopify inventory',
        'Send customer notification',
        'Log compliance event',
        'Update accounting records'
      ],
      complexity: 'medium',
      tags: ['customer-service', 'approval-required']
    },
    {
      id: 'ar-chaser',
      name: 'AR Collection Agent',
      description: 'Intelligent accounts receivable chaser with segmented reminders, payment links, and escalation workflows',
      category: 'finance',
      icon: '📊',
      popularity: 4.9,
      installs: 1589,
      steps: 4,
      estimatedTimeSaved: '5 hours/week',
      revenueImpact: 'Very High',
      connections: ['xero', 'stripe', 'email'],
      triggers: ['schedule.daily'],
      actions: [
        'Fetch overdue invoices from Xero',
        'Segment by days overdue',
        'Generate payment links',
        'Send personalized reminders',
        'Track payment status'
      ],
      complexity: 'low',
      tags: ['popular', 'ai-powered', 'cash-flow']
    },
    {
      id: 'new-customer-welcome',
      name: 'New Customer Onboarding',
      description: 'Welcome new customers with personalized emails, setup guides, and Slack notifications to your team',
      category: 'marketing',
      icon: '👋',
      popularity: 4.7,
      installs: 2134,
      steps: 3,
      estimatedTimeSaved: '1 hour/week',
      revenueImpact: 'Low',
      connections: ['shopify', 'email', 'slack'],
      triggers: ['customer.created'],
      actions: [
        'Send welcome email series',
        'Create customer profile',
        'Notify team in Slack'
      ],
      complexity: 'low',
      tags: ['onboarding', 'easy-setup']
    },
    {
      id: 'inventory-sync',
      name: 'Multi-Channel Inventory Sync',
      description: 'Keep inventory levels synchronized across Shopify, Amazon, and your warehouse management system',
      category: 'operations',
      icon: '📦',
      popularity: 4.5,
      installs: 756,
      steps: 4,
      estimatedTimeSaved: '4 hours/week',
      revenueImpact: 'High',
      connections: ['shopify'],
      triggers: ['inventory.updated'],
      actions: [
        'Fetch inventory levels',
        'Calculate available stock',
        'Update all channels',
        'Send low-stock alerts'
      ],
      complexity: 'medium',
      tags: ['inventory', 'multi-channel']
    },
    {
      id: 'fraud-detection',
      name: 'Fraud Detection & Prevention',
      description: 'Automatically flag suspicious orders, verify customer details, and block high-risk transactions',
      category: 'security',
      icon: '🛡️',
      popularity: 4.8,
      installs: 983,
      steps: 7,
      estimatedTimeSaved: '3 hours/week',
      revenueImpact: 'Very High',
      connections: ['shopify', 'stripe'],
      triggers: ['order.created', 'payment.captured'],
      actions: [
        'Run fraud score analysis',
        'Verify billing/shipping match',
        'Check customer history',
        'Flag high-risk orders',
        'Request manual review',
        'Block suspicious cards',
        'Log security events'
      ],
      complexity: 'high',
      tags: ['security', 'ai-powered', 'risk-management']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Workflows', icon: Zap },
    { id: 'finance', name: 'Finance & Accounting', icon: DollarSign },
    { id: 'operations', name: 'Operations', icon: TrendingUp },
    { id: 'marketing', name: 'Marketing & Sales', icon: Star },
    { id: 'security', name: 'Security & Compliance', icon: Star },
  ];

  const filteredWorkflows = workflowTemplates.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         wf.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || wf.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (workflow) => {
    setSelectedWorkflow(workflow);
    setInstalling(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Automation Library</h1>
          <p className="text-gray-600 mt-2">Browse and install pre-built workflows to automate your business</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <cat.icon className="w-4 h-4" />
                <span className="hidden md:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <WorkflowCard
                workflow={workflow}
                onInstall={() => handleInstall(workflow)}
              />
            </motion.div>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No workflows found matching your criteria</p>
          </div>
        )}

        {/* Installation Modal */}
        {installing && selectedWorkflow && (
          <WorkflowInstaller
            workflow={selectedWorkflow}
            onClose={() => {
              setInstalling(false);
              setSelectedWorkflow(null);
            }}
            onComplete={() => {
              setInstalling(false);
              setSelectedWorkflow(null);
              alert('Workflow installed successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
}