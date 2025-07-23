'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, X } from 'lucide-react';

interface ApiKeysWarningProps {
  className?: string;
  showDismiss?: boolean;
  requiredKeys?: ('geminiApiKey' | 'openaiApiKey')[];
}

export default function ApiKeysWarning({ 
  className = "", 
  showDismiss = true,
  requiredKeys = ['geminiApiKey', 'openaiApiKey']
}: ApiKeysWarningProps) {
  const { hasGeminiKey, hasOpenAIKey, loading } = useApiKeys();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed) {
    return null;
  }

  // Check which keys are missing
  const missingKeys: string[] = [];
  if (requiredKeys.includes('geminiApiKey') && !hasGeminiKey) {
    missingKeys.push('Gemini API');
  }
  if (requiredKeys.includes('openaiApiKey') && !hasOpenAIKey) {
    missingKeys.push('OpenAI API');
  }

  // If no keys are missing, don't show the warning
  if (missingKeys.length === 0) {
    return null;
  }

  const allKeysMissing = missingKeys.length === requiredKeys.length;
  
  return (
    <Alert className={`border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <span className="font-medium text-yellow-800 dark:text-yellow-200">
            {allKeysMissing ? 'API Keys Required' : 'Some API Keys Missing'}
          </span>
          <p className="text-yellow-700 dark:text-yellow-300 mt-1">
            {allKeysMissing 
              ? `Configure your ${missingKeys.join(' and ')} key${missingKeys.length > 1 ? 's' : ''} to enable AI-powered features.`
              : `Missing ${missingKeys.join(' and ')} key${missingKeys.length > 1 ? 's' : ''}. Some features may be unavailable.`
            }
          </p>
          <div className="flex gap-2 mt-2">
            <Button asChild size="sm" variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <Link href="/dashboard/settings">
                <Settings className="h-3 w-3 mr-1" />
                Configure Keys
              </Link>
            </Button>
          </div>
        </div>
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 h-8 w-8 p-0 ml-4"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
