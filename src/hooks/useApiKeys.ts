'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserApiKeys } from '@/lib/firestore';
import type { UserApiKeys } from '@/types';

interface UseApiKeysResult {
  apiKeys: UserApiKeys | null;
  loading: boolean;
  hasGeminiKey: boolean;
  hasOpenAIKey: boolean;
  hasAnyKey: boolean;
  refreshApiKeys: () => Promise<void>;
}

export function useApiKeys(): UseApiKeysResult {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKeys | null>(null);
  const [loading, setLoading] = useState(true);

  const loadApiKeys = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const keys = await getUserApiKeys(user.uid);
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setApiKeys(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [user]);

  const refreshApiKeys = async () => {
    setLoading(true);
    await loadApiKeys();
  };

  const hasGeminiKey = !!(apiKeys?.geminiApiKey);
  const hasOpenAIKey = !!(apiKeys?.openaiApiKey);
  const hasAnyKey = hasGeminiKey || hasOpenAIKey;

  return {
    apiKeys,
    loading,
    hasGeminiKey,
    hasOpenAIKey,
    hasAnyKey,
    refreshApiKeys,
  };
}
