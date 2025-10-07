import React, { useState, useEffect } from 'react';
import { Approval, Run } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function ActionCenter() {
  const [approvals, setApprovals] = useState([]);
  const [failedRuns, setFailedRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadActionItems();
  }, [filter]);

  const loadActionItems = async () => {
    try {
      // Load approvals
      const filterObj = filter === 'all' ? {} : { state: filter };
      const apps = await Approval.filter(filterObj, '-requested_at', 50);
      setApprovals(apps);

      // Load failed runs that need attention
      const runs = await Run.filter({ status: 'failed' }, '-started_at', 20);
      setFailedRuns(runs);
    } catch (error) {
      console.error('Failed to load action items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval) => {
    try {
      await Approval.update(approval.id, {
        state: 'approved',
        responded_at: new Date().toISOString(),
        comment: comment || undefined,
      });

      setComment('');
      setSelectedItem(null);
      loadActionItems();
    } catch (error) {
      alert(`Failed to approve: ${error.message}`);
    }
  };

  const handleReject = async (approval) => {
    if (!comment) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await Approval.update(approval.id, {
        state: 'rejected',
        responded_at: new Date().toISOString(),
        comment,
      });

      setComment('');
      setSelectedItem(null);
      loadActionItems();
    } catch (error) {
      alert(`Failed to reject: ${error.message}`);
    }
  };

  const handleRetryRun = async (run) => {
    alert('Retry functionality coming soon!');
    // TODO: Call backend retry endpoint
  };

  const filteredApprovals = approvals.filter((approval) =>
    approval.context &&
    JSON.stringify(approval.context).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = approvals.filter((a) => a.state === 'pending').length;
  const failedCount = failedRuns.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Clock className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Action Center</h1>
          <p className="text-gray-600 mt-2">Review and approve pending workflow actions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed Runs</p>
                  <p className="text-3xl font-bold text-red-600">{failedCount}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Actions</p>
                  <p className="text-3xl font-bold text-green-600">{pendingCount + failedCount}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search action items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="failed">Failed Runs ({failedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {filteredApprovals.filter((a) => a.state === 'pending').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending approvals! 🎉</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApprovals
                  .filter((a) => a.state === 'pending')
                  .map((approval, index) => (
                    <motion.div
                      key={approval.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                Approval Request
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                Requested: {new Date(approval.requested_at).toLocaleString()}
                              </p>
                            </div>
                            {approval.expires_at && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Expires: {new Date(approval.expires_at).toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {approval.context && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm font-medium mb-2">Action Details:</p>
                              <pre className="text-xs text-gray-700 overflow-x-auto">
                                {JSON.stringify(approval.context, null, 2)}
                              </pre>
                            </div>
                          )}

                          {approval.amount_value && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-indigo-900">
                                Amount: ${approval.amount_value.toLocaleString()}
                              </p>
                            </div>
                          )}

                          {approval.risk_reason && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm">
                                <strong>Reason:</strong> {approval.risk_reason}
                              </p>
                            </div>
                          )}

                          {selectedItem?.id === approval.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Comment (optional for approval, required for rejection)
                                </label>
                                <Textarea
                                  placeholder="Add your notes..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(approval)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(approval)}
                                  variant="outline"
                                  className="flex-1 text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedItem(null);
                                    setComment('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setSelectedItem(approval)}
                              className="w-full"
                            >
                              Review & Decide
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredApprovals
                .filter((a) => a.state === 'approved')
                .map((approval) => (
                  <Card key={approval.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="flex-1">
                          <p className="font-semibold">Approved</p>
                          <p className="text-sm text-gray-600">
                            {new Date(approval.responded_at).toLocaleString()}
                          </p>
                          {approval.comment && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{approval.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {filteredApprovals
                .filter((a) => a.state === 'rejected')
                .map((approval) => (
                  <Card key={approval.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <div className="flex-1">
                          <p className="font-semibold">Rejected</p>
                          <p className="text-sm text-gray-600">
                            {new Date(approval.responded_at).toLocaleString()}
                          </p>
                          {approval.comment && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{approval.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="failed" className="mt-6">
            {failedRuns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No failed runs! Everything's running smoothly.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {failedRuns.map((run) => (
                  <Card key={run.id} className="border-2 border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <div>
                            <p className="font-semibold">Run #{run.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(run.started_at).toLocaleString()}
                            </p>
                            {run.error_message && (
                              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{run.error_message}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button onClick={() => handleRetryRun(run)} variant="outline">
                          Retry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}