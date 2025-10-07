import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Crown, TrendingUp } from 'lucide-react';

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState('starter');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '€99',
      icon: Zap,
      color: 'indigo',
      features: [
        '2 workflows enabled',
        '2 integrations',
        '1,000 actions/month',
        'Email support',
        'Basic analytics'
      ],
      limits: {
        workflows: 2,
        connections: 2,
        actions: 1000,
        slack_approvals: false
      }
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '€299',
      icon: TrendingUp,
      color: 'green',
      popular: true,
      features: [
        '5 workflows enabled',
        '5 integrations',
        '10,000 actions/month',
        'Slack approvals',
        'Advanced analytics',
        'Priority support',
        'Custom email templates'
      ],
      limits: {
        workflows: 5,
        connections: 5,
        actions: 10000,
        slack_approvals: true
      }
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 'Custom',
      icon: Crown,
      color: 'purple',
      features: [
        'Unlimited workflows',
        'Unlimited integrations',
        'Unlimited actions',
        'SSO / SAML',
        'Audit log exports',
        'Custom SLAs',
        'Dedicated support',
        'On-premise option'
      ],
      limits: {
        workflows: -1,
        connections: -1,
        actions: -1,
        slack_approvals: true
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-600 mt-2">Scale your automation as you grow</p>
        </div>

        {/* Current Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Usage (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Workflows Active</p>
                <p className="text-2xl font-bold">2 / 2</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Connections</p>
                <p className="text-2xl font-bold">3 / 2</p>
                <Badge className="bg-yellow-100 text-yellow-800 mt-1">Over limit</Badge>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Actions Used</p>
                <p className="text-2xl font-bold">847 / 1,000</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Est. Overage</p>
                <p className="text-2xl font-bold">€0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'border-2 border-indigo-500 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-12 h-12 text-${plan.color}-600`} />
                    {isCurrentPlan && (
                      <Badge className="bg-green-100 text-green-800">Current</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-gray-200 text-gray-700 cursor-not-allowed' 
                        : plan.id === 'scale'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.id === 'scale' ? 'Contact Sales' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">What counts as an "action"?</h4>
              <p className="text-sm text-gray-600">
                Each API call to an integration (Shopify, Stripe, Xero, etc.) counts as one action. 
                For example, the Order-to-Cash workflow uses ~6 actions per order.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What happens if I exceed my limits?</h4>
              <p className="text-sm text-gray-600">
                Workflows will continue running, but you'll be charged €0.10 per additional action beyond your plan limit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes! Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}