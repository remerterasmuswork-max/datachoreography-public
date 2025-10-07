import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function ActionBlock({
  step,
  index,
  connections,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSelectConnection,
  isFirst,
  isLast,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasConnection = step.connectionId !== null;
  const selectedConnection = connections.find((c) => c.id === step.connectionId);

  return (
    <Card className="border-2 border-indigo-200">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{step.actionData.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{step.actionData.name}</p>
                <Badge variant="outline" className="text-xs">
                  {step.actionData.provider}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{step.actionData.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <Button variant="ghost" size="icon" onClick={onMoveUp}>
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            {!isLast && (
              <Button variant="ghost" size="icon" onClick={onMoveDown}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {step.actionData.provider !== 'logic' && (
          <div className="mb-3">
            {hasConnection ? (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Connected: {selectedConnection?.name}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={onSelectConnection}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">
                    No connection selected
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={onSelectConnection}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Connect
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Configuration */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              {isOpen ? 'Hide' : 'Configure'} Step
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Inputs:</p>
                <div className="space-y-2">
                  {step.actionData.inputs.map((input) => (
                    <div key={input}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {input}
                      </label>
                      <Input
                        placeholder={`Enter ${input} or use {{variable}}`}
                        value={step.config[input] || ''}
                        onChange={(e) =>
                          onUpdate({
                            config: { ...step.config, [input]: e.target.value },
                          })
                        }
                        className="text-sm font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {step.actionData.outputs.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Outputs:</p>
                  <div className="flex flex-wrap gap-2">
                    {step.actionData.outputs.map((output) => (
                      <Badge key={output} variant="secondary" className="text-xs font-mono">
                        {output}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use these variables in later steps: {`{{step_${index}.${step.actionData.outputs[0]}}}`}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}