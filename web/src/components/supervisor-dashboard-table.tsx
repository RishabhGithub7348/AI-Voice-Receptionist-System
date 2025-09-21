"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  User,
  Calendar,
  Edit,
  Eye
} from 'lucide-react';
import { useDashboard, useResolveHelpRequest, useAnalytics, useKnowledgeBase, useCleanupTimeouts } from '@/hooks/useApi';
import { HelpRequest } from '@/lib/api';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const priorityColors = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  unresolved: 'bg-red-100 text-red-800',
  timeout: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  unresolved: <XCircle className="w-4 h-4" />,
  timeout: <AlertCircle className="w-4 h-4" />,
};

function HelpRequestModal({
  request,
  isOpen,
  onClose
}: {
  request: HelpRequest | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isResolving, setIsResolving] = useState(false);
  const [response, setResponse] = useState('');
  const [supervisorId, setSupervisorId] = useState('supervisor-1');
  const resolveHelpRequest = useResolveHelpRequest();

  if (!request) return null;

  const handleResolve = async () => {
    if (!response.trim()) return;

    setIsResolving(true);
    try {
      await resolveHelpRequest.mutateAsync({
        requestId: request.id,
        supervisorResponse: response,
        supervisorId,
        addToKnowledgeBase: true,
      });
      setResponse('');
      setIsResolving(false);
      onClose();
    } catch (error) {
      console.error('Failed to resolve request:', error);
      setIsResolving(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Help Request Details</ModalTitle>
          <ModalDescription>
            Review and respond to the customer's inquiry
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {/* Request Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{request.customer_phone}</p>
              {request.customer_name && (
                <p className="text-sm text-gray-600">{request.customer_name}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[request.status]}>
                  {request.status}
                </Badge>
                <Badge className={priorityColors[request.priority]}>
                  {request.priority}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(request.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Wait Time</p>
              <p className="font-medium">{request.hours_waiting.toFixed(1)} hours</p>
            </div>
          </div>

          {/* Question */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Customer Question
            </h3>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-700">{request.question}</p>
            </div>
          </div>

          {/* Context */}
          {request.context && (
            <div>
              <h3 className="font-semibold mb-2">Conversation Context</h3>
              <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">{request.context}</pre>
              </div>
            </div>
          )}

          {/* Response Form */}
          {request.status === 'pending' && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <Label htmlFor="modal-response">Your Response</Label>
                <Textarea
                  id="modal-response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response to help the customer..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="modal-supervisor">Supervisor ID</Label>
                <Input
                  id="modal-supervisor"
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Resolved Response */}
          {request.status === 'resolved' && request.supervisor_response && (
            <div>
              <h3 className="font-semibold mb-2 text-green-700">Resolved Response</h3>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-gray-700">{request.supervisor_response}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Resolved by {request.supervisor_id} on {new Date(request.resolved_at!).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          {request.status === 'pending' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!response.trim() || isResolving}
              >
                {isResolving ? 'Resolving...' : 'Send Response'}
              </Button>
            </>
          )}
          {request.status !== 'pending' && (
            <Button onClick={onClose}>Close</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AnalyticsPanel() {
  const { data: analytics, isLoading } = useAnalytics();
  const cleanupTimeouts = useCleanupTimeouts();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{analytics.total_requests}</div>
          <div className="text-sm text-blue-600">Total Requests</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{analytics.pending_requests}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{analytics.resolved_requests}</div>
          <div className="text-sm text-green-600">Resolved</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{analytics.knowledge_base_entries}</div>
          <div className="text-sm text-purple-600">KB Entries</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium mb-2">Performance Metrics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Avg Resolution Time:</span>
            <span className="font-medium">{analytics.avg_resolution_time_hours.toFixed(1)} hours</span>
          </div>
          <div className="flex justify-between">
            <span>Timeout Requests:</span>
            <span className="font-medium">{analytics.timeout_requests}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => cleanupTimeouts.mutate()}
          disabled={cleanupTimeouts.isPending}
          variant="outline"
          size="sm"
        >
          {cleanupTimeouts.isPending ? 'Cleaning...' : 'Cleanup Timeouts'}
        </Button>
      </div>
    </div>
  );
}

export function SupervisorDashboardTable() {
  const { data: helpRequests, isLoading, error, refetch } = useDashboard();
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Error loading dashboard: {error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const allRequests = helpRequests || [];
  const pendingRequests = allRequests.filter(req => req.status === 'pending');
  const resolvedRequests = allRequests.filter(req => req.status === 'resolved');
  const urgentRequests = pendingRequests.filter(req => req.priority === 'urgent' || req.hours_waiting > 1);

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'resolved':
        return resolvedRequests;
      case 'urgent':
        return urgentRequests;
      default:
        return allRequests;
    }
  };

  const handleViewRequest = (request: HelpRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRequest(null), 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Help Request Dashboard</h2>
          <p className="text-gray-600">Manage and respond to customer inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentRequests.length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {urgentRequests.length} Urgent
            </Badge>
          )}
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({allRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({urgentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>

        {['all', 'pending', 'urgent', 'resolved'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {getFilteredRequests().length === 0 ? (
              <div className="text-center p-12 bg-gray-50 rounded-lg">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">
                  {tab === 'pending' && 'No pending requests'}
                  {tab === 'urgent' && 'No urgent requests'}
                  {tab === 'resolved' && 'No resolved requests'}
                  {tab === 'all' && 'No requests found'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="max-w-md">Question</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredRequests().map((request) => (
                      <TableRow
                        key={request.id}
                        className={request.priority === 'urgent' ? 'bg-red-50' : ''}
                      >
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            <span className="flex items-center gap-1">
                              {statusIcons[request.status]}
                              {request.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[request.priority]}>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.customer_phone}</p>
                            {request.customer_name && (
                              <p className="text-sm text-gray-500">{request.customer_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{request.question}</p>
                        </TableCell>
                        <TableCell>
                          <span className={request.hours_waiting > 1 ? 'text-red-600 font-medium' : ''}>
                            {request.hours_waiting.toFixed(1)}h
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(request.created_at).toLocaleDateString()}</p>
                            <p className="text-gray-500">{new Date(request.created_at).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRequest(request)}
                            >
                              {request.status === 'pending' ? (
                                <>
                                  <Edit className="w-4 h-4 mr-1" />
                                  Respond
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal for viewing/editing requests */}
      <HelpRequestModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}