import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Webhook, Hand } from 'lucide-react';

export default function TriggerBlock({ onSelect }) {
  const triggers = [
    {
      id: 'webhook',
      name: 'Webhook',
      type: 'webhook',
      description: 'Trigger when an external event occurs (e.g., new order, payment)',
      icon: Webhook,
      config: { event: 'order.created' },
    },
    {
      id: 'schedule',
      name: 'Schedule',
      type: 'schedule',
      description: 'Run on a recurring schedule (daily, weekly, monthly)',
      icon: Clock,
      config: { cron: '0 9 * * *' },
    },
    {
      id: 'manual',
      name: 'Manual',
      type: 'manual',
      description: 'Run manually when you click a button',
      icon: Hand,
      config: {},
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {triggers.map((trigger) => {
        const Icon = trigger.icon;
        return (
          <button
            key={trigger.id}
            onClick={() => onSelect(trigger)}
            className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{trigger.name}</p>
                <p className="text-sm text-gray-600">{trigger.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}