import React from 'react';

// Email templates to be inserted into EmailTemplate entity
export const emailTemplates = [
  {
    name: 'payment_receipt',
    subject: 'Payment Receipt - Order {{order_number}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Order!</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>Your order has been confirmed and payment received. Here are your order details:</p>
      
      <div class="order-details">
        <h3>Order {{order_number}}</h3>
        <p><strong>Total Amount:</strong> {{total_amount}} {{currency}}</p>
        <p><strong>Payment Method:</strong> {{payment_method}}</p>
        <p><strong>Order Date:</strong> {{order_date}}</p>
      </div>

      <p>We'll send you another email when your order ships.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{order_status_url}}" class="button">View Order Status</a>
      </p>
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or contact support@yourstore.com</p>
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Thank you for your order!

Hi {{customer_name}},

Your order {{order_number}} has been confirmed and payment received.

Total Amount: {{total_amount}} {{currency}}
Payment Method: {{payment_method}}
Order Date: {{order_date}}

We'll send you another email when your order ships.

View order status: {{order_status_url}}

Questions? Reply to this email or contact support@yourstore.com

© {{current_year}} {{company_name}}. All rights reserved.`,
    variables: ['customer_name', 'order_number', 'total_amount', 'currency', 'payment_method', 'order_date', 'order_status_url', 'company_name', 'current_year']
  },
  {
    name: 'refund_confirmation',
    subject: 'Refund Processed - Order {{order_number}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .refund-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Processed</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>We've processed your refund for order {{order_number}}.</p>
      
      <div class="refund-details">
        <h3>Refund Details</h3>
        <p><strong>Refund Amount:</strong> {{refund_amount}} {{currency}}</p>
        <p><strong>Original Payment:</strong> {{payment_method}}</p>
        <p><strong>Processing Time:</strong> 5-10 business days</p>
        <p><strong>Refund Date:</strong> {{refund_date}}</p>
      </div>

      <p>The refund will appear on your original payment method within 5-10 business days.</p>
      
      <p>If you have any questions about this refund, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or contact support@yourstore.com</p>
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Refund Processed

Hi {{customer_name}},

We've processed your refund for order {{order_number}}.

Refund Amount: {{refund_amount}} {{currency}}
Original Payment: {{payment_method}}
Processing Time: 5-10 business days
Refund Date: {{refund_date}}

The refund will appear on your original payment method within 5-10 business days.

Questions? Reply to this email or contact support@yourstore.com

© {{current_year}} {{company_name}}. All rights reserved.`,
    variables: ['customer_name', 'order_number', 'refund_amount', 'currency', 'payment_method', 'refund_date', 'company_name', 'current_year']
  },
  {
    name: 'dunning_day7',
    subject: 'Payment Reminder - Invoice {{invoice_number}}',
    html_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Friendly Payment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{customer_name}},</p>
      <p>This is a friendly reminder that invoice {{invoice_number}} is now overdue.</p>
      
      <div class="invoice-details">
        <h3>Invoice {{invoice_number}}</h3>
        <p><strong>Amount Due:</strong> {{amount_due}} {{currency}}</p>
        <p><strong>Due Date:</strong> {{due_date}}</p>
        <p><strong>Days Overdue:</strong> {{days_overdue}}</p>
      </div>

      <p>Please make payment at your earliest convenience. You can pay securely online using the button below:</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{payment_link}}" class="button">Pay Now</a>
      </p>

      <p style="margin-top: 20px;">If you've already made this payment, please disregard this email. If you're experiencing any issues, please contact us immediately.</p>
    </div>
    <div class="footer">
      <p>Questions? Reply to this email or contact accounts@yourcompany.com</p>
      <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    text_body: `Friendly Payment Reminder

Hi {{customer_name}},

This is a friendly reminder that invoice {{invoice_number}} is now overdue.

Invoice {{invoice_number}}
Amount Due: {{amount_due}} {{currency}}
Due Date: {{due_date}}
Days Overdue: {{days_overdue}}

Please make payment at your earliest convenience.

Pay now: {{payment_link}}

If you've already made this payment, please disregard this email.

Questions? Reply to this email or contact accounts@yourcompany.com

© {{current_year}} {{company_name}}. All rights reserved.`,
    variables: ['customer_name', 'invoice_number', 'amount_due', 'currency', 'due_date', 'days_overdue', 'payment_link', 'company_name', 'current_year']
  }
];

export default function EmailTemplates() {
  return (
    <div className="space-y-6">
      {emailTemplates.map((template) => (
        <div key={template.name} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{template.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
          <div className="flex gap-2 flex-wrap">
            {template.variables.map((v) => (
              <code key={v} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {'{{'}{v}{'}}'}
              </code>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}