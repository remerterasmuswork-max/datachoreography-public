import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Clock, Zap, Shield, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TemplateCard({ template, onViewDetails }) {
  const categoryColors = {
    finance: 'from-green-500 to-green-600',
    operations: 'from-blue-500 to-blue-600',
    compliance: 'from-red-500 to-red-600',
    customer: 'from-purple-500 to-purple-600',
  };

  const complexityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const getRevenueImpactBadge = (score) => {
    if (score >= 8) return { label: 'Very High', color: 'bg-purple-100 text-purple-800' };
    if (score >= 6) return { label: 'High', color: 'bg-green-100 text-green-800' };
    if (score >= 4) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
  };

  const revenueImpact = getRevenueImpactBadge(template.metrics.revenue_impact_score || 5);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className={`w-12 h-12 bg-gradient-to-br ${categoryColors[template.category]} rounded-lg flex items-center justify-center text-2xl`}>
              {template.icon}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{template.metrics.rating}</span>
              <span className="text-gray-500">({template.metrics.reviews})</span>
            </div>
          </div>
          
          <CardTitle className="text-lg">{template.name}</CardTitle>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {template.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Badge className={complexityColors[template.complexity]}>
              {template.complexity}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col">
          <p className="text-sm text-gray-600 line-clamp-2 flex-1">
            {template.description}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Steps</p>
                <p className="font-semibold">{template.workflow_json.steps.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Saves</p>
                <p className="font-semibold">{template.metrics.time_saved_per_run}</p>
              </div>
            </div>
          </div>

          {/* Revenue Impact */}
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">Revenue Impact:</span>
            </div>
            <Badge className={revenueImpact.color}>
              {revenueImpact.label}
            </Badge>
          </div>

          {/* Required Services */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Required Services:</p>
            <div className="flex flex-wrap gap-1">
              {template.required_connections.slice(0, 4).map(conn => (
                <Badge key={conn} className="bg-gray-100 text-gray-700 text-xs">
                  {conn}
                </Badge>
              ))}
              {template.required_connections.length > 4 && (
                <Badge className="bg-gray-100 text-gray-700 text-xs">
                  +{template.required_connections.length - 4}
                </Badge>
              )}
            </div>
          </div>

          {/* Compliance Badges */}
          {template.gdpr.required && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Shield className="w-3 h-3 text-green-600" />
              <span>GDPR Compliant</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{template.metrics.installs.toLocaleString()}</span>
            </div>
            <div>v{template.version}</div>
          </div>

          {/* CTA */}
          <Button 
            onClick={() => onViewDetails()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-auto"
          >
            View Details & Install
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}