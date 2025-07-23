'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, updateUserApiKeys } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserApiKeys } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({
    geminiApiKey: '',
    openaiApiKey: '',
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      if (profile?.apiKeys) {
        setApiKeys(profile.apiKeys);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Basic validation
    if (!apiKeys.geminiApiKey && !apiKeys.openaiApiKey) {
      toast({
        title: 'Warning',
        description: 'Please provide at least one API key to enable card generation',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await updateUserApiKeys(user.uid, apiKeys);
      toast({
        title: 'Success',
        description: 'Your API keys have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your API keys',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API keys to enable AI-powered card generation
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Configure your API keys to enable different AI features. Your keys are securely stored and encrypted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>Security Note:</strong> Your API keys are stored securely in your user profile. 
                Only you can access them. We recommend using keys with appropriate usage limits.
              </AlertDescription>
            </Alert>

            {/* Gemini API Key */}
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Google Gemini API Key</Label>
              <div className="relative">
                <Input
                  id="geminiApiKey"
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="Enter your Google Gemini API key"
                  value={apiKeys.geminiApiKey || ''}
                  onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Used for regular Pokemon card generation and video generation using Google's Imagen and Veo models. 
                Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
              </p>
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openaiApiKey"
                  type={showOpenAIKey ? 'text' : 'password'}
                  placeholder="Enter your OpenAI API key"
                  value={apiKeys.openaiApiKey || ''}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Used for photo-based Pokemon card generation using GPT-4o and DALL-E. 
                Get your key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Keys
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Availability</CardTitle>
            <CardDescription>
              Which features are available based on your configured API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${apiKeys.geminiApiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium">Regular Card Generation</p>
                  <p className="text-sm text-muted-foreground">Requires Gemini API key</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${apiKeys.openaiApiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium">Photo-based Generation</p>
                  <p className="text-sm text-muted-foreground">Requires OpenAI API key</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${apiKeys.geminiApiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium">Video Generation</p>
                  <p className="text-sm text-muted-foreground">Requires Gemini API key</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
