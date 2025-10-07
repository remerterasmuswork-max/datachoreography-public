import React, { useState, useEffect } from 'react';
import { Approval, Run, WorkflowStep } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    try {
      const filterObj = filter === 'all' ? {} : { state: filter };
      const apps = await Approval.filter(filterObj, '-requested_at');
      setApprovals(apps);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId, comment) => {
    await Approval.update(approvalId, {
      state: 'approved',
      responded_at: new Date().toISOString(),
      comment
    });
    
    // TODO: Resume workflow run
    loadApprovals();
    setSelectedApproval(null);
  };

  const handleReject = async (approvalId, comment) => {
    if (!comment) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    await Approval.update(approvalId, {
      state: 'rejected',
      responded_at: new Date().toISOString(),
      comment
    });
    
    loadApprovals();
    setSelectedApproval(null);
  };

  const getStateBadge = (state) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock }
    };
    
    const variant = variants[state] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {state}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve workflow actions</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {approvals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No {filter} approvals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {approvals.map((approval) => (
                  <Card key={approval.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Approval Request #{approval.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested: {new Date(approval.requested_at).toLocaleString()}
                          </p>
                        </div>
                        {getStateBadge(approval.state)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {approval.context && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Action Context:</p>
                          <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(approval.context, null, 2)}
                          </pre>
                        </div>
                      )}

                      {approval.expires_at && approval.state === 'pending' && (
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                          <Clock className="w-4 h-4" />
                          Expires: {new Date(approval.expires_at).toLocaleString()}
                        </div>
                      )}

                      {approval.comment && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">Comment:</p>
                          <p className="text-sm text-blue-800">{approval.comment}</p>
                        </div>
                      )}

                      {approval.state === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => setSelectedApproval(approval)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setSelectedApproval(approval)}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Approval Modal */}
        {selectedApproval && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Review Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Action Details:</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto max-h-64">
                    {JSON.stringify(selectedApproval.context, null, 2)}
                  </pre>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <Textarea
                    placeholder="Add any notes or reasons..."
                    rows={3}
                    id="approval-comment"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApproval(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      const comment = document.getElementById('approval-comment').value;
                      handleReject(selectedApproval.id, comment);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const comment = document.getElementById('approval-comment').value;
                      handleApprove(selectedApproval.id, comment);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}