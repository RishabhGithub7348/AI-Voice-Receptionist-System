"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Users,
  Brain,
  BarChart3,
  Settings,
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  PhoneCall
} from 'lucide-react';

// Import our existing components
import { SupervisorDashboard } from '@/components/supervisor-dashboard';
import { RoomComponent } from '@/components/room-component';
import { QueryProvider } from '@/providers/QueryProvider';
import { KnowledgeBaseManager } from '@/components/knowledge-base-manager';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { useDashboard, useAnalytics } from '@/hooks/useApi';

function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue"
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700"
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>
        <Icon className="w-8 h-8 opacity-70" />
      </div>
    </div>
  );
}

function WelcomeSection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">
          🏢 Frontdesk AI Supervisor
        </h1>
        <p className="text-xl mb-6 opacity-90">
         {` Human-in-the-Loop AI System for Bella's Hair & Beauty Salon`}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/10 rounded-lg p-4">
            <PhoneCall className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">Smart Call Handling</h3>
            <p className="text-sm opacity-80">AI receptionist with automatic escalation</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">Supervisor Support</h3>
            <p className="text-sm opacity-80">Human oversight for complex queries</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Brain className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-semibold">Learning System</h3>
            <p className="text-sm opacity-80">Knowledge base grows from resolutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatusCard
        title="Active Calls"
        value="1"
        subtitle="Voice chat connected"
        icon={Phone}
        color="green"
      />
      <StatusCard
        title="Pending Tickets"
        value="0"
        subtitle="Awaiting supervisor"
        icon={Clock}
        color="yellow"
      />
      <StatusCard
        title="Resolved Today"
        value="0"
        subtitle="Successfully handled"
        icon={CheckCircle}
        color="blue"
      />
      <StatusCard
        title="Knowledge Base"
        value="6"
        subtitle="Learned answers"
        icon={Brain}
        color="purple"
      />
    </div>
  );
}

function QuickStatsWithData() {
  const { data: analytics } = useAnalytics();
  const { data: helpRequests } = useDashboard();

  const pendingRequests = helpRequests?.filter(req => req.status === 'pending')?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatusCard
        title="Active Calls"
        value="1"
        subtitle="Voice chat connected"
        icon={Phone}
        color="green"
      />
      <StatusCard
        title="Pending Tickets"
        value={pendingRequests}
        subtitle="Awaiting supervisor"
        icon={Clock}
        color="yellow"
      />
      <StatusCard
        title="Resolved Today"
        value={analytics?.resolved_requests || 0}
        subtitle="Successfully handled"
        icon={CheckCircle}
        color="blue"
      />
      <StatusCard
        title="Knowledge Base"
        value={analytics?.knowledge_base_entries || 0}
        subtitle="Learned answers"
        icon={Brain}
        color="purple"
      />
    </div>
  );
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: helpRequests } = useDashboard();

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <HeadphonesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Frontdesk AI Supervisor
                  </h1>
                  <p className="text-sm text-gray-600">
                   {` Bella's Hair & Beauty Salon`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">
                  System Online
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl  mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="calls" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Call Simulator
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Help Tickets
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <WelcomeSection />
              <QuickStatsWithData />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {helpRequests && helpRequests.length > 0 ? (
                      helpRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                          request.status === 'pending' ? 'bg-yellow-50' :
                          request.status === 'resolved' ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                          {request.status === 'pending' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          ) : request.status === 'resolved' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {request.status === 'pending' ? 'Query escalated to supervisor' :
                               request.status === 'resolved' ? 'Ticket resolved by supervisor' :
                               'Customer inquiry'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.question.length > 50 ? request.question.substring(0, 50) + '...' : request.question}
                            </p>
                            <p className="text-xs text-gray-500">From: {request.customer_phone}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity. Start a voice call to see requests here.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">System Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>AI Agent</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Backend API</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>LiveKit Connection</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calls">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">📞 Live Phone Call Simulator</h2>
                  <p className="opacity-90">
                    Test the AI receptionist with real voice calls. Speak naturally and see how the system handles escalations.
                  </p>
                </div>
                <RoomComponent />
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              <SupervisorDashboard />
            </TabsContent>

            <TabsContent value="knowledge">
              <KnowledgeBaseManager />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>{`© 2025 Frontdesk AI Supervisor - Built for Bella's Hair & Beauty Salon`}</p>
              <div className="flex items-center gap-4">
                <span>Powered by LiveKit + FastAPI + Supabase</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}

export function FrontdeskDashboard() {
  return (
    <QueryProvider>
      <DashboardContent />
    </QueryProvider>
  );
}