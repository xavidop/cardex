import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { getUserApiKeys } from '@/lib/firestore';

// Default genkit instance with environment variables
const defaultApiKey = process.env.GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({apiKey: defaultApiKey})
  ],
  model: 'googleai/gemini-3-pro-preview',
});

// Function to create genkit instance with user API key
export async function createUserAI(userId: string) {
  try {
    const userApiKeys = await getUserApiKeys(userId);
    const userApiKey = userApiKeys?.geminiApiKey;
    
    if (userApiKey) {
      return genkit({
        plugins: [
          googleAI({apiKey: userApiKey})
        ],
        model: 'googleai/gemini-3-pro-preview',
      });
    }
  } catch (error) {
    console.warn('Failed to get user API keys, falling back to default:', error);
  }
  
  // Fallback to default AI instance
  return ai;
}
