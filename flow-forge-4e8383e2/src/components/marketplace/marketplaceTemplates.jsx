// Template Manifest v1 Specification
// MCP-aligned automation templates with full metadata

export const MARKETPLACE_TEMPLATES = [
  {
    template_id: 'order_to_cash_v1',
    name: 'Order-to-Cash Automation',
    description: 'Automatically sync Shopify orders to Xero invoices, capture Stripe payments, and send customer receipts',
    icon: '💰',
    category: 'finance',
    complexity: 'medium',
    version: '1.2.0',
    published_date: '2024-12-15',
    required_connections: ['shopify', 'xero', 'stripe', 'email'],
    permissions: [
      'Read orders from Shopify',
      'Create invoices in Xero',
      'Capture payments via Stripe',
      'Send email receipts',
    ],
    tags: ['popular', 'revenue', 'e-commerce', 'accounting'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered when a new order is created in Shopify',
        config: { event: 'order.created', source: 'shopify' }
      },
      steps: [
        {
          name: 'Fetch Order Details',
          description: 'Retrieve full order information from Shopify',
          provider: 'shopify',
          action: 'orders.get',
          inputs: { order_id: '{{trigger.order_id}}' },
          requires_approval: false
        },
        {
          name: 'Create Invoice in Xero',
          description: 'Generate accounting invoice',
          provider: 'xero',
          action: 'invoices.create',
          inputs: {
            customer: '{{step_0.order.customer}}',
            line_items: '{{step_0.order.line_items}}',
            reference: '{{step_0.order.name}}'
          },
          requires_approval: false
        },
        {
          name: 'Capture Payment',
          description: 'Process credit card payment via Stripe',
          provider: 'stripe',
          action: 'charges.capture',
          inputs: { charge: '{{step_0.order.payment_intent_id}}' },
          requires_approval: false
        },
        {
          name: 'Send Receipt Email',
          description: 'Email receipt to customer',
          provider: 'email',
          action: 'email.send_template',
          inputs: {
            to: '{{step_0.order.email}}',
            template: 'payment_receipt'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: true,
      pii_fields_collected: ['customer_email', 'customer_name', 'billing_address'],
      retention_days: 2555,
      purpose: 'Process e-commerce orders and maintain financial records'
    },
    metrics: {
      time_saved_per_run: '15 min',
      revenue_impact_score: 9,
      success_rate: 97,
      rating: 4.8,
      reviews: 342,
      installs: 1247
    },
    changelog: [
      {
        version: '1.2.0',
        date: '2024-12-15',
        title: 'Added email template support',
        changes: ['Custom email templates', 'Multi-language support', 'Bug fixes']
      },
      {
        version: '1.1.0',
        date: '2024-11-20',
        title: 'Stripe payment capture',
        changes: ['Added automatic payment capture', 'Improved error handling']
      }
    ]
  },
  
  {
    template_id: 'smart_refunds_v1',
    name: 'Smart Refund Processing',
    description: 'Handle refund requests with approval workflow, automatic Stripe refunds, inventory restocking, and customer notifications',
    icon: '↩️',
    category: 'operations',
    complexity: 'medium',
    version: '1.0.5',
    published_date: '2024-12-10',
    required_connections: ['shopify', 'stripe', 'slack', 'email'],
    permissions: [
      'Process refunds in Stripe',
      'Update Shopify inventory',
      'Send Slack notifications',
      'Send customer emails'
    ],
    tags: ['customer-service', 'approval-required', 'refunds'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered when refund is requested',
        config: { event: 'refund.requested' }
      },
      steps: [
        {
          name: 'Create Approval Request',
          description: 'Request manager approval via Slack',
          provider: 'slack',
          action: 'message.with_buttons',
          inputs: {
            channel: 'refunds',
            message: 'Refund request: {{trigger.amount}}'
          },
          requires_approval: true,
          approval_roles: ['admin', 'manager']
        },
        {
          name: 'Process Stripe Refund',
          description: 'Issue refund to customer card',
          provider: 'stripe',
          action: 'refunds.create',
          inputs: {
            charge: '{{trigger.charge_id}}',
            amount: '{{trigger.amount}}'
          },
          requires_approval: false,
          risk_level: 'high'
        },
        {
          name: 'Restock Inventory',
          description: 'Update Shopify inventory levels',
          provider: 'shopify',
          action: 'inventory.adjust',
          inputs: {
            product_id: '{{trigger.product_id}}',
            quantity_change: 1
          },
          requires_approval: false
        },
        {
          name: 'Notify Customer',
          description: 'Send refund confirmation email',
          provider: 'email',
          action: 'email.send_template',
          inputs: {
            to: '{{trigger.customer_email}}',
            template: 'refund_confirmation'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: false,
      pii_fields_collected: ['customer_email'],
      retention_days: 2555,
      purpose: 'Process refunds and maintain transaction records'
    },
    metrics: {
      time_saved_per_run: '20 min',
      revenue_impact_score: 7,
      success_rate: 95,
      rating: 4.6,
      reviews: 189,
      installs: 892
    },
    changelog: []
  },

  {
    template_id: 'ar_chaser_v1',
    name: 'AR Collection Agent',
    description: 'Intelligent accounts receivable chaser with segmented reminders, payment links, and escalation workflows',
    icon: '📊',
    category: 'finance',
    complexity: 'low',
    version: '2.0.1',
    published_date: '2024-12-20',
    required_connections: ['xero', 'stripe', 'email'],
    permissions: [
      'Read invoices from Xero',
      'Generate Stripe payment links',
      'Send reminder emails'
    ],
    tags: ['popular', 'ai-powered', 'cash-flow', 'finance'],
    workflow_json: {
      trigger: {
        type: 'schedule',
        description: 'Runs daily at 9 AM',
        config: { cron: '0 9 * * *' }
      },
      steps: [
        {
          name: 'Fetch Overdue Invoices',
          description: 'Get all unpaid invoices past due date',
          provider: 'xero',
          action: 'invoices.list',
          inputs: { status: 'overdue' },
          requires_approval: false
        },
        {
          name: 'Segment by Days Overdue',
          description: 'Categorize invoices by overdue period',
          provider: 'logic',
          action: 'data_transform',
          inputs: { data: '{{step_0.invoices}}' },
          requires_approval: false
        },
        {
          name: 'Generate Payment Links',
          description: 'Create Stripe payment links',
          provider: 'stripe',
          action: 'payment_links.create',
          inputs: { invoices: '{{step_1.overdue_invoices}}' },
          requires_approval: false
        },
        {
          name: 'Send Reminders',
          description: 'Email personalized reminders with payment links',
          provider: 'email',
          action: 'email.send_template',
          inputs: {
            recipients: '{{step_1.customer_emails}}',
            template: 'payment_reminder'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: false,
      pii_fields_collected: ['customer_email', 'company_name'],
      retention_days: 2555,
      purpose: 'Collect outstanding payments and maintain financial records'
    },
    metrics: {
      time_saved_per_run: '45 min',
      revenue_impact_score: 10,
      success_rate: 98,
      rating: 4.9,
      reviews: 567,
      installs: 1589
    },
    changelog: [
      {
        version: '2.0.1',
        date: '2024-12-20',
        title: 'AI-powered dunning sequences',
        changes: ['Machine learning for optimal send times', 'Personalized message templates']
      }
    ]
  },

  {
    template_id: 'vat_auto_calc_v1',
    name: 'VAT Auto-Calculator',
    description: 'Automatically calculate and apply correct VAT rates based on customer location, product type, and local tax rules',
    icon: '🧮',
    category: 'compliance',
    complexity: 'high',
    version: '1.3.2',
    published_date: '2024-11-25',
    required_connections: ['shopify', 'xero'],
    permissions: [
      'Read product catalog',
      'Update tax calculations',
      'Create tax invoices'
    ],
    tags: ['compliance', 'tax', 'international', 'vat'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered on checkout',
        config: { event: 'checkout.created' }
      },
      steps: [
        {
          name: 'Detect Customer Location',
          description: 'Determine tax jurisdiction',
          provider: 'shopify',
          action: 'customer.get_location',
          inputs: { customer_id: '{{trigger.customer_id}}' },
          requires_approval: false
        },
        {
          name: 'Calculate VAT Rate',
          description: 'Apply correct VAT based on location and product type',
          provider: 'logic',
          action: 'tax_calculation',
          inputs: {
            country: '{{step_0.country}}',
            products: '{{trigger.line_items}}'
          },
          requires_approval: false
        },
        {
          name: 'Update Invoice',
          description: 'Apply calculated VAT to invoice',
          provider: 'xero',
          action: 'invoices.update',
          inputs: {
            invoice_id: '{{trigger.invoice_id}}',
            tax_amount: '{{step_1.vat_amount}}'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: false,
      pii_fields_collected: ['billing_address', 'country'],
      retention_days: 2555,
      purpose: 'Calculate accurate tax and maintain compliance with tax regulations'
    },
    metrics: {
      time_saved_per_run: '5 min',
      revenue_impact_score: 8,
      success_rate: 99,
      rating: 4.7,
      reviews: 234,
      installs: 987
    },
    changelog: []
  },

  {
    template_id: 'dispute_evidence_v1',
    name: 'Dispute Evidence Kit',
    description: 'Automatically gather and submit evidence for Stripe payment disputes including order details, shipping proof, and communication logs',
    icon: '🛡️',
    category: 'compliance',
    complexity: 'medium',
    version: '1.1.0',
    published_date: '2024-12-05',
    required_connections: ['stripe', 'shopify', 'email'],
    permissions: [
      'Access dispute information',
      'Read order and shipping data',
      'Submit evidence to Stripe',
      'Access email communications'
    ],
    tags: ['fraud-prevention', 'disputes', 'chargeback'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered when dispute is created',
        config: { event: 'charge.dispute.created', source: 'stripe' }
      },
      steps: [
        {
          name: 'Fetch Order Details',
          description: 'Get complete order information',
          provider: 'shopify',
          action: 'orders.get',
          inputs: { order_id: '{{trigger.metadata.order_id}}' },
          requires_approval: false
        },
        {
          name: 'Gather Shipping Proof',
          description: 'Collect tracking and delivery confirmation',
          provider: 'shopify',
          action: 'fulfillments.get',
          inputs: { order_id: '{{trigger.metadata.order_id}}' },
          requires_approval: false
        },
        {
          name: 'Compile Evidence Package',
          description: 'Prepare evidence bundle for submission',
          provider: 'logic',
          action: 'data_transform',
          inputs: {
            order_data: '{{step_0.order}}',
            shipping_data: '{{step_1.fulfillment}}'
          },
          requires_approval: false
        },
        {
          name: 'Submit to Stripe',
          description: 'Upload evidence to dispute',
          provider: 'stripe',
          action: 'disputes.update',
          inputs: {
            dispute_id: '{{trigger.id}}',
            evidence: '{{step_2.evidence_package}}'
          },
          requires_approval: true,
          approval_roles: ['admin']
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: false,
      pii_fields_collected: ['customer_name', 'shipping_address', 'email_communications'],
      retention_days: 2555,
      purpose: 'Defend against fraudulent disputes and chargebacks'
    },
    metrics: {
      time_saved_per_run: '30 min',
      revenue_impact_score: 9,
      success_rate: 91,
      rating: 4.8,
      reviews: 156,
      installs: 673
    },
    changelog: []
  },

  {
    template_id: 'invoice_sync_v1',
    name: 'Invoice Sync Master',
    description: 'Bi-directional sync between Xero and Shopify, ensuring invoices, payments, and credits are always in sync',
    icon: '🔄',
    category: 'finance',
    complexity: 'medium',
    version: '1.4.1',
    published_date: '2024-12-12',
    required_connections: ['xero', 'shopify'],
    permissions: [
      'Read and write invoices in Xero',
      'Read orders from Shopify',
      'Update Shopify order status'
    ],
    tags: ['accounting', 'sync', 'automation'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered on invoice or order changes',
        config: { event: 'invoice.updated|order.updated' }
      },
      steps: [
        {
          name: 'Detect Change Source',
          description: 'Determine which system triggered the update',
          provider: 'logic',
          action: 'condition_check',
          inputs: { source: '{{trigger.source}}' },
          requires_approval: false
        },
        {
          name: 'Sync to Target System',
          description: 'Update corresponding record in other system',
          provider: 'logic',
          action: 'data_transform',
          inputs: { data: '{{trigger.payload}}' },
          requires_approval: false
        },
        {
          name: 'Update Invoice',
          description: 'Apply changes to target invoice',
          provider: 'xero',
          action: 'invoices.update',
          inputs: { invoice_data: '{{step_1.transformed_data}}' },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: false,
      consent_needed: false,
      pii_fields_collected: [],
      retention_days: 90,
      purpose: 'Maintain synchronized financial records'
    },
    metrics: {
      time_saved_per_run: '10 min',
      revenue_impact_score: 6,
      success_rate: 96,
      rating: 4.5,
      reviews: 298,
      installs: 1123
    },
    changelog: []
  },

  {
    template_id: 'high_value_approval_v1',
    name: 'High-Value Approval Gate',
    description: 'Automatically flag and require approval for transactions above a certain threshold before processing',
    icon: '⚠️',
    category: 'compliance',
    complexity: 'low',
    version: '1.0.2',
    published_date: '2024-11-30',
    required_connections: ['slack', 'email'],
    permissions: [
      'Send approval requests',
      'Block transaction processing',
      'Send notifications'
    ],
    tags: ['risk-management', 'approval', 'fraud-prevention'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered on high-value transaction',
        config: { event: 'transaction.created' }
      },
      steps: [
        {
          name: 'Check Transaction Amount',
          description: 'Verify if amount exceeds threshold',
          provider: 'logic',
          action: 'condition_check',
          inputs: {
            amount: '{{trigger.amount}}',
            threshold: 10000
          },
          requires_approval: false
        },
        {
          name: 'Request Approval',
          description: 'Send approval request to finance team',
          provider: 'slack',
          action: 'message.with_buttons',
          inputs: {
            channel: 'finance-approvals',
            message: 'High-value transaction requires approval: ${{trigger.amount}}'
          },
          requires_approval: true,
          approval_roles: ['admin', 'finance_manager']
        },
        {
          name: 'Notify Requester',
          description: 'Email status to transaction initiator',
          provider: 'email',
          action: 'email.send',
          inputs: {
            to: '{{trigger.requester_email}}',
            subject: 'Transaction Approval Status'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: false,
      consent_needed: false,
      pii_fields_collected: ['requester_email'],
      retention_days: 2555,
      purpose: 'Prevent unauthorized high-value transactions'
    },
    metrics: {
      time_saved_per_run: '0 min',
      revenue_impact_score: 10,
      success_rate: 99,
      rating: 4.9,
      reviews: 423,
      installs: 1876
    },
    changelog: []
  },

  {
    template_id: 'dunning_sequence_v1',
    name: 'Smart Dunning Sequence',
    description: 'Multi-stage payment reminder sequence with escalating urgency, personalized messaging, and automatic account suspension',
    icon: '⏰',
    category: 'finance',
    complexity: 'medium',
    version: '1.2.3',
    published_date: '2024-12-08',
    required_connections: ['stripe', 'email', 'slack'],
    permissions: [
      'Read subscription status',
      'Send payment reminders',
      'Update subscription status',
      'Send team notifications'
    ],
    tags: ['subscriptions', 'dunning', 'revenue-recovery'],
    workflow_json: {
      trigger: {
        type: 'schedule',
        description: 'Runs daily to check failed payments',
        config: { cron: '0 10 * * *' }
      },
      steps: [
        {
          name: 'Fetch Failed Payments',
          description: 'Get all failed subscription charges',
          provider: 'stripe',
          action: 'charges.list',
          inputs: { status: 'failed', type: 'subscription' },
          requires_approval: false
        },
        {
          name: 'Segment by Attempt Count',
          description: 'Categorize by number of retry attempts',
          provider: 'logic',
          action: 'data_transform',
          inputs: { charges: '{{step_0.failed_charges}}' },
          requires_approval: false
        },
        {
          name: 'Send Personalized Reminders',
          description: 'Email reminders with escalating urgency',
          provider: 'email',
          action: 'email.send_template',
          inputs: {
            recipients: '{{step_1.customers}}',
            template: 'dunning_{{step_1.attempt_stage}}'
          },
          requires_approval: false
        },
        {
          name: 'Suspend Accounts (Final Stage)',
          description: 'Suspend after max retries',
          provider: 'stripe',
          action: 'subscriptions.pause',
          inputs: { subscription_ids: '{{step_1.max_attempts}}' },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: false,
      pii_fields_collected: ['customer_email', 'payment_method'],
      retention_days: 2555,
      purpose: 'Recover failed subscription payments'
    },
    metrics: {
      time_saved_per_run: '35 min',
      revenue_impact_score: 9,
      success_rate: 94,
      rating: 4.7,
      reviews: 312,
      installs: 1234
    },
    changelog: []
  },

  {
    template_id: 'fraud_precheck_v1',
    name: 'Fraud Pre-Check',
    description: 'Real-time fraud detection using velocity checks, geolocation analysis, and device fingerprinting before payment capture',
    icon: '🔍',
    category: 'compliance',
    complexity: 'high',
    version: '1.0.8',
    published_date: '2024-12-18',
    required_connections: ['stripe', 'shopify', 'slack'],
    permissions: [
      'Read customer and order data',
      'Block suspicious transactions',
      'Send fraud alerts'
    ],
    tags: ['fraud-prevention', 'security', 'risk-management'],
    workflow_json: {
      trigger: {
        type: 'webhook',
        description: 'Triggered before payment capture',
        config: { event: 'checkout.before_capture' }
      },
      steps: [
        {
          name: 'Fetch Customer History',
          description: 'Get customer transaction history',
          provider: 'shopify',
          action: 'customers.get',
          inputs: { customer_id: '{{trigger.customer_id}}' },
          requires_approval: false
        },
        {
          name: 'Run Fraud Checks',
          description: 'Analyze transaction for fraud signals',
          provider: 'logic',
          action: 'fraud_analysis',
          inputs: {
            order: '{{trigger.order}}',
            customer_history: '{{step_0.history}}',
            device_fingerprint: '{{trigger.device_info}}'
          },
          requires_approval: false
        },
        {
          name: 'Flag High-Risk Orders',
          description: 'Block or require review for suspicious orders',
          provider: 'slack',
          action: 'message.send',
          inputs: {
            channel: 'fraud-alerts',
            message: 'High-risk order detected: {{trigger.order_id}}'
          },
          requires_approval: true,
          approval_roles: ['admin', 'risk_manager']
        }
      ]
    },
    gdpr: {
      required: true,
      consent_needed: true,
      pii_fields_collected: ['customer_email', 'ip_address', 'device_info', 'billing_address'],
      retention_days: 2555,
      purpose: 'Detect and prevent fraudulent transactions'
    },
    metrics: {
      time_saved_per_run: '0 min',
      revenue_impact_score: 10,
      success_rate: 97,
      rating: 4.9,
      reviews: 287,
      installs: 1453
    },
    changelog: []
  },

  {
    template_id: 'payment_reconciliation_v1',
    name: 'Payment Reconciliation',
    description: 'Automatically match Stripe payouts to Xero invoices, flag discrepancies, and generate reconciliation reports',
    icon: '🎯',
    category: 'finance',
    complexity: 'high',
    version: '1.3.0',
    published_date: '2024-12-01',
    required_connections: ['stripe', 'xero', 'email'],
    permissions: [
      'Read Stripe payouts',
      'Read Xero invoices',
      'Update reconciliation status',
      'Send reports'
    ],
    tags: ['accounting', 'reconciliation', 'finance'],
    workflow_json: {
      trigger: {
        type: 'schedule',
        description: 'Runs weekly on Monday morning',
        config: { cron: '0 8 * * 1' }
      },
      steps: [
        {
          name: 'Fetch Stripe Payouts',
          description: 'Get all payouts from last period',
          provider: 'stripe',
          action: 'payouts.list',
          inputs: { date_range: 'last_7_days' },
          requires_approval: false
        },
        {
          name: 'Fetch Xero Invoices',
          description: 'Get paid invoices from same period',
          provider: 'xero',
          action: 'invoices.list',
          inputs: { status: 'paid', date_range: 'last_7_days' },
          requires_approval: false
        },
        {
          name: 'Match Transactions',
          description: 'Reconcile payouts with invoices',
          provider: 'logic',
          action: 'reconciliation',
          inputs: {
            payouts: '{{step_0.payouts}}',
            invoices: '{{step_1.invoices}}'
          },
          requires_approval: false
        },
        {
          name: 'Generate Report',
          description: 'Create reconciliation report',
          provider: 'logic',
          action: 'report_generation',
          inputs: { reconciliation_data: '{{step_2.results}}' },
          requires_approval: false
        },
        {
          name: 'Email Report',
          description: 'Send report to finance team',
          provider: 'email',
          action: 'email.send',
          inputs: {
            to: 'finance@company.com',
            subject: 'Weekly Reconciliation Report',
            attachment: '{{step_3.report_pdf}}'
          },
          requires_approval: false
        }
      ]
    },
    gdpr: {
      required: false,
      consent_needed: false,
      pii_fields_collected: [],
      retention_days: 2555,
      purpose: 'Reconcile payments for accurate financial reporting'
    },
    metrics: {
      time_saved_per_run: '60 min',
      revenue_impact_score: 7,
      success_rate: 98,
      rating: 4.8,
      reviews: 198,
      installs: 876
    },
    changelog: []
  }
];

export default MARKETPLACE_TEMPLATES;