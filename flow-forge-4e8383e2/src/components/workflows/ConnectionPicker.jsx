import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function ConnectionPicker({ provider, connections, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">Select {provider} Connection</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No {provider} connections found. Create one first.
                </p>
                <Link to={createPageUrl('Connections')}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Connection
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onSelect(conn.id)}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{conn.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{conn.provider}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            conn.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {conn.status}
                        </Badge>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </button>
                ))}

                <Link to={createPageUrl('Connections')}>
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Connection
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}