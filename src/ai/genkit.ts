import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Validate API key exists
const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error('Missing Google AI API key. Please set GOOGLE_GENAI_API_KEY or GEMINI_API_KEY environment variable.');
  throw new Error('Google AI API key is required for Genkit configuration');
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-pro-preview-05-06',
});
