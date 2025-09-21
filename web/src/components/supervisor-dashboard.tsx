"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useDashboard, useResolveHelpRequest, useAnalytics, useKnowledgeBase, useCleanupTimeouts } from '@/hooks/useApi';
import { HelpRequest } from '@/lib/api';

const priorityColors = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  unresolved: <XCircle className="w-4 h-4" />,
  timeout: <AlertCircle className="w-4 h-4" />,
};

function HelpRequestCard({ request }: { request: HelpRequest }) {
  const [isResolving, setIsResolving] = useState(false);
  const [response, setResponse] = useState('');
  const [supervisorId, setSupervisorId] = useState('supervisor-1');

  const resolveHelpRequest = useResolveHelpRequest();

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
    } catch (error) {
      console.error('Failed to resolve request:', error);
      setIsResolving(false);
    }
  };

  const isUrgent = request.hours_waiting > 1 || request.priority === 'urgent';

  return (
    <div className={`p-4 border rounded-lg space-y-3 ${isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[request.status]}
          <Badge className={priorityColors[request.priority]}>
            {request.priority.toUpperCase()}
          </Badge>
          <span className="text-sm text-gray-500">
            {request.hours_waiting.toFixed(1)}h waiting
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {request.customer_phone}
          {request.customer_name && ` (${request.customer_name})`}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Customer Question:</h3>
        <p className="text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
          {request.question}
        </p>
      </div>

      {request.context && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Conversation Context:</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
            {request.context}
          </p>
        </div>
      )}

      {request.status === 'pending' && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label htmlFor="response">Your Response:</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response to help the customer..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="supervisor-id">Supervisor ID:</Label>
              <Input
                id="supervisor-id"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleResolve}
              disabled={!response.trim() || isResolving}
              className="mt-6"
            >
              {isResolving ? 'Resolving...' : 'Send Response'}
            </Button>
          </div>
        </div>
      )}

      {request.status === 'resolved' && request.supervisor_response && (
        <div className="border-t pt-3">
          <h4 className="font-medium text-green-700 mb-2">✅ Resolved Response:</h4>
          <p className="text-gray-700 bg-green-50 p-3 rounded border-l-4 border-green-500">
            {request.supervisor_response}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Resolved by {request.supervisor_id} on {new Date(request.resolved_at!).toLocaleString()}
          </p>
        </div>
      )}
    </div>
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

function KnowledgeBasePanel() {
  const { data: knowledgeBase, isLoading } = useKnowledgeBase();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading knowledge base...</div>;
  }

  if (!knowledgeBase) {
    return <div className="p-8 text-center text-gray-500">No knowledge base entries available</div>;
  }

  return (
    <div className="space-y-4">
      {knowledgeBase.map((entry) => (
        <div key={entry.id} className="p-4 border rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline">{entry.category || 'general'}</Badge>
            <div className="text-sm text-gray-500">
              Used {entry.usage_count} times • Confidence: {(entry.confidence_score * 100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-gray-900">Q: {entry.question}</h4>
            </div>
            <div>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">A: {entry.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Export the table version
export { SupervisorDashboardTable as SupervisorDashboard } from './supervisor-dashboard-table';