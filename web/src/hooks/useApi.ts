/**
 * TanStack Query hooks for API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, HelpRequest, KnowledgeBaseEntry, Analytics } from '@/lib/api';

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  knowledgeBase: (category?: string) => ['knowledgeBase', { category }] as const,
  analytics: ['analytics'] as const,
  health: ['health'] as const,
};

// Dashboard Hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.getDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

export const useResolveHelpRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      supervisorResponse,
      supervisorId,
      addToKnowledgeBase = true,
    }: {
      requestId: string;
      supervisorResponse: string;
      supervisorId: string;
      addToKnowledgeBase?: boolean;
    }) =>
      apiClient.resolveHelpRequest(requestId, supervisorResponse, supervisorId, addToKnowledgeBase),
    onSuccess: () => {
      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBase() });
    },
  });
};

// Knowledge Base Hooks
export const useKnowledgeBase = (category?: string) => {
  return useQuery({
    queryKey: queryKeys.knowledgeBase(category),
    queryFn: () => apiClient.getKnowledgeBase(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddKnowledgeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      question,
      answer,
      category,
    }: {
      question: string;
      answer: string;
      category?: string;
    }) => apiClient.addKnowledgeEntry(question, answer, category),
    onSuccess: () => {
      // Invalidate knowledge base queries
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });
};

// Analytics Hooks
export const useAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => apiClient.getAnalytics(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

// Utility Hooks
export const useCleanupTimeouts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.cleanupTimeouts(),
    onSuccess: () => {
      // Invalidate dashboard and analytics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 60000, // Check health every minute
    retry: 1,
  });
};