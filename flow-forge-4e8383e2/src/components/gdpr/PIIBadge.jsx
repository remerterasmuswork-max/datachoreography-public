import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function PIIBadge({ piiFields = [], severity = 'medium' }) {
  if (!piiFields || piiFields.length === 0) {
    return null;
  }

  const severityConfig = {
    low: {
      color: 'bg-blue-100 text-blue-800',
      icon: Info,
      label: 'PII'
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
      label: 'PII Data'
    },
    high: {
      color: 'bg-red-100 text-red-800',
      icon: Shield,
      label: 'Sensitive PII'
    }
  };

  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${config.color} flex items-center gap-1 cursor-help`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">Personal Data Processed:</p>
            <ul className="text-xs space-y-1">
              {piiFields.map((field, index) => (
                <li key={index}>• {field}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              This data is encrypted at rest and subject to GDPR regulations
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}