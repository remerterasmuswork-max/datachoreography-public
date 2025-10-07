import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Clock, Zap } from 'lucide-react';

export default function WorkflowCard({ workflow, onInstall }) {
  const complexityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="text-4xl">{workflow.icon}</div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{workflow.popularity}</span>
          </div>
        </div>
        
        <CardTitle className="text-lg">{workflow.name}</CardTitle>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {workflow.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Badge className={complexityColors[workflow.complexity]}>
            {workflow.complexity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {workflow.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-gray-600">{workflow.steps} steps</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">{workflow.estimatedTimeSaved}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Download className="w-3 h-3" />
          <span>{workflow.installs.toLocaleString()} installs</span>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {workflow.connections.slice(0, 4).map(conn => (
            <Badge key={conn} className="bg-gray-100 text-gray-700 text-xs">
              {conn}
            </Badge>
          ))}
        </div>

        <Button 
          onClick={() => onInstall(workflow)}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Install Workflow
        </Button>
      </CardContent>
    </Card>
  );
}