/**
 * API client for Frontdesk AI Supervisor Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

export interface HelpRequest {
  id: string;
  question: string;
  context?: string;
  status: 'pending' | 'resolved' | 'unresolved' | 'timeout';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  customer_phone: string;
  customer_name?: string;
  created_at: string;
  timeout_at?: string;
  hours_waiting: number;
  supervisor_response?: string;
  supervisor_id?: string;
  resolved_at?: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
  source: string;
  confidence_score: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total_requests: number;
  pending_requests: number;
  resolved_requests: number;
  timeout_requests: number;
  avg_resolution_time_hours: number;
  knowledge_base_entries: number;
  top_categories: { category: string; count: number }[];
}

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Supervisor Dashboard API
  async getDashboard(): Promise<HelpRequest[]> {
    return this.request<HelpRequest[]>('/supervisor/dashboard');
  }

  async resolveHelpRequest(
    requestId: string,
    supervisorResponse: string,
    supervisorId: string,
    addToKnowledgeBase: boolean = true
  ): Promise<HelpRequest> {
    return this.request<HelpRequest>(
      `/supervisor/requests/${requestId}/resolve?supervisor_id=${supervisorId}&add_to_kb=${addToKnowledgeBase}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          supervisor_response: supervisorResponse,
        }),
      }
    );
  }

  // Knowledge Base API
  async getKnowledgeBase(category?: string, limit: number = 100): Promise<KnowledgeBaseEntry[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());

    return this.request<KnowledgeBaseEntry[]>(`/supervisor/knowledge-base?${params}`);
  }

  async addKnowledgeEntry(
    question: string,
    answer: string,
    category?: string
  ): Promise<KnowledgeBaseEntry> {
    return this.request<KnowledgeBaseEntry>('/supervisor/knowledge-base', {
      method: 'POST',
      body: JSON.stringify({
        question,
        answer,
        category,
      }),
    });
  }

  // Analytics API
  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('/supervisor/analytics');
  }

  // Cleanup API
  async cleanupTimeouts(): Promise<{ success: boolean; message: string; data: { timeout_count: number } }> {
    return this.request('/supervisor/cleanup-timeouts', {
      method: 'POST',
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; database: string }> {
    return this.request('/health');
  }
}

export const apiClient = new APIClient();