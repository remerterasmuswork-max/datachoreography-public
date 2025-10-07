import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Star, Download, Zap, Clock, DollarSign, TrendingUp, Shield } from 'lucide-react';
import TemplateCard from '../components/marketplace/TemplateCard';
import TemplateDetails from '../components/marketplace/TemplateDetails';
import { motion } from 'framer-motion';
import { MARKETPLACE_TEMPLATES } from '../components/marketplace/marketplaceTemplates';

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sortBy, setSortBy] = useState('popular');

  const categories = [
    { id: 'all', name: 'All Templates', icon: Zap, count: MARKETPLACE_TEMPLATES.length },
    { id: 'finance', name: 'Finance & Accounting', icon: DollarSign, count: MARKETPLACE_TEMPLATES.filter(t => t.category === 'finance').length },
    { id: 'operations', name: 'Operations', icon: TrendingUp, count: MARKETPLACE_TEMPLATES.filter(t => t.category === 'operations').length },
    { id: 'compliance', name: 'Compliance & Risk', icon: Shield, count: MARKETPLACE_TEMPLATES.filter(t => t.category === 'compliance').length },
    { id: 'customer', name: 'Customer Success', icon: Star, count: MARKETPLACE_TEMPLATES.filter(t => t.category === 'customer').length },
  ];

  const filteredTemplates = MARKETPLACE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.metrics.installs - a.metrics.installs;
      case 'rating':
        return b.metrics.rating - a.metrics.rating;
      case 'newest':
        return new Date(b.published_date) - new Date(a.published_date);
      case 'roi':
        return (b.metrics.revenue_impact_score || 0) - (a.metrics.revenue_impact_score || 0);
      default:
        return 0;
    }
  });

  if (selectedTemplate) {
    return (
      <TemplateDetails
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-600" />
            Automation Marketplace
          </h1>
          <p className="text-gray-600 mt-2">Browse and install pre-built automation templates</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="roi">Best ROI</option>
          </select>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <cat.icon className="w-4 h-4" />
                <span className="hidden md:inline">{cat.name}</span>
                <Badge variant="secondary" className="ml-1">{cat.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Featured Banner */}
        <Card className="mb-8 border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-indigo-600 text-white mb-2">✨ Featured</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Order-to-Cash Automation</h3>
                <p className="text-gray-600 mb-4">The most popular template - saves 5+ hours per week on average</p>
                <Button 
                  onClick={() => setSelectedTemplate(MARKETPLACE_TEMPLATES[0])}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  View Details
                </Button>
              </div>
              <div className="hidden md:block text-6xl">💰</div>
            </div>
          </CardContent>
        </Card>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.template_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <TemplateCard
                template={template}
                onViewDetails={() => setSelectedTemplate(template)}
              />
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No templates found matching your criteria</p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">{MARKETPLACE_TEMPLATES.length}</div>
              <p className="text-sm text-gray-600 mt-1">Templates Available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {MARKETPLACE_TEMPLATES.reduce((sum, t) => sum + t.metrics.installs, 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Installs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {(MARKETPLACE_TEMPLATES.reduce((sum, t) => sum + t.metrics.rating, 0) / MARKETPLACE_TEMPLATES.length).toFixed(1)}★
              </div>
              <p className="text-sm text-gray-600 mt-1">Average Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {MARKETPLACE_TEMPLATES.reduce((sum, t) => sum + parseInt(t.metrics.time_saved_per_run.split(' ')[0] || 0), 0)}h
              </div>
              <p className="text-sm text-gray-600 mt-1">Time Saved Weekly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}