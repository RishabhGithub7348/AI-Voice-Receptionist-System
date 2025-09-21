"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Brain,
  Users,
  RefreshCw
} from 'lucide-react';
import { useAnalytics, useCleanupTimeouts } from '@/hooks/useApi';

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue"
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700"
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {TrendIcon && (
              <TrendIcon className={`w-5 h-5 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
            )}
          </div>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>
        <Icon className="w-8 h-8 opacity-70" />
      </div>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const { data: analytics, isLoading, refetch } = useAnalytics();
  const cleanupTimeouts = useCleanupTimeouts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No analytics data available</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const resolutionRate = analytics.total_requests > 0
    ? Math.round((analytics.resolved_requests / analytics.total_requests) * 100)
    : 0;

  const timeoutRate = analytics.total_requests > 0
    ? Math.round((analytics.timeout_requests / analytics.total_requests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">System performance and usage metrics</p>
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
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value={analytics.total_requests}
          subtitle="All time requests"
          icon={Phone}
          color="blue"
          trend="up"
        />
        <MetricCard
          title="Pending Requests"
          value={analytics.pending_requests}
          subtitle="Awaiting supervisor"
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Resolved Requests"
          value={analytics.resolved_requests}
          subtitle="Successfully handled"
          icon={CheckCircle}
          color="green"
          trend="up"
        />
        <MetricCard
          title="Knowledge Entries"
          value={analytics.knowledge_base_entries}
          subtitle="Learned answers"
          icon={Brain}
          color="purple"
          trend="up"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resolution Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Resolution Rate</span>
              <div className="flex items-center gap-2">
                <Badge className={resolutionRate >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {resolutionRate}%
                </Badge>
                {resolutionRate >= 80 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Resolution Time</span>
              <Badge variant="outline">
                {analytics.avg_resolution_time_hours.toFixed(1)} hours
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Timeout Rate</span>
              <Badge className={timeoutRate <= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {timeoutRate}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Timeout Requests</span>
              <span className="font-medium">{analytics.timeout_requests}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">AI Response Rate</span>
              <Badge className="bg-green-100 text-green-800">
                {analytics.total_requests > 0
                  ? Math.round(((analytics.total_requests - analytics.pending_requests) / analytics.total_requests) * 100)
                  : 100}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Knowledge Base Usage</span>
              <Badge className="bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Escalation Rate</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {analytics.total_requests > 0
                  ? Math.round((analytics.pending_requests / analytics.total_requests) * 100)
                  : 0}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">System Status</span>
              <Badge className="bg-green-100 text-green-800">
                Operational
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Performance */}
      {analytics.top_categories && analytics.top_categories.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Knowledge Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.top_categories.slice(0, 6).map((category, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{category.category || 'General'}</span>
                  <Badge variant="outline">{category.count} entries</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary & Recommendations</h3>
        <div className="space-y-4">
          {resolutionRate >= 90 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Excellent Performance</p>
                <p className="text-sm text-green-700">
                  Resolution rate is above 90%. The system is performing exceptionally well.
                </p>
              </div>
            </div>
          )}

          {analytics.avg_resolution_time_hours > 4 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Slow Resolution Time</p>
                <p className="text-sm text-yellow-700">
                  Average resolution time is {analytics.avg_resolution_time_hours.toFixed(1)} hours.
                  Consider adding more supervisors during peak hours.
                </p>
              </div>
            </div>
          )}

          {analytics.timeout_requests > 5 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">High Timeout Rate</p>
                <p className="text-sm text-red-700">
                  {analytics.timeout_requests} requests have timed out.
                  Consider reviewing supervisor response times and notification settings.
                </p>
              </div>
            </div>
          )}

          {analytics.knowledge_base_entries < 50 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Growing Knowledge Base</p>
                <p className="text-sm text-blue-700">
                  Knowledge base has {analytics.knowledge_base_entries} entries.
                  Continue resolving queries to improve AI performance.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}