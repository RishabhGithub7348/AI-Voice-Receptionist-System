"use client";

import { useState, useCallback } from 'react';

export interface CustomerSession {
  sessionId: string;
  customerPhone: string;
  customerName?: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended' | 'paused';
  callDuration?: number;
}

export function useCustomerSession() {
  const [currentSession, setCurrentSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (customerPhone: string, customerName?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerPhone,
          customerName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer session');
      }

      const result = await response.json();
      if (result.success) {
        setCurrentSession(result.session);
        return result.session;
      } else {
        throw new Error(result.message || 'Failed to create session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer-session', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          status: 'ended',
          endTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to end customer session');
      }

      const result = await response.json();
      if (result.success) {
        setCurrentSession(prev => prev ? { ...prev, status: 'ended', endTime: result.session.endTime } : null);
        return result.session;
      } else {
        throw new Error(result.message || 'Failed to end session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customer-session?sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customer session');
      }

      const result = await response.json();
      if (result.success) {
        setCurrentSession(result.session);
        return result.session;
      } else {
        throw new Error(result.message || 'Failed to fetch session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  return {
    currentSession,
    loading,
    error,
    createSession,
    endSession,
    getSession,
    clearSession,
  };
}