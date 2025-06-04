// Summarize Card Information Flow
'use server';

/**
 * @fileOverview Summarizes the key information of a Pokemon card.
 *
 * - summarizeCardInformation - A function that summarizes the card information.
 * - SummarizeCardInformationInput - The input type for the summarizeCardInformation function.
 * - SummarizeCardInformationOutput - The return type for the summarizeCardInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCardInformationInputSchema = z.object({
  name: z.string().describe('The name of the Pokemon card.'),
  set: z.string().describe('The set the card belongs to.'),
  rarity: z.string().describe('The rarity of the card.'),
});
export type SummarizeCardInformationInput = z.infer<typeof SummarizeCardInformationInputSchema>;

const SummarizeCardInformationOutputSchema = z.object({
  summary: z.string().describe('A summary of the card information.'),
});
export type SummarizeCardInformationOutput = z.infer<typeof SummarizeCardInformationOutputSchema>;

export async function summarizeCardInformation(
  input: SummarizeCardInformationInput
): Promise<SummarizeCardInformationOutput> {
  return summarizeCardInformationFlow(input);
}

const summarizeCardInformationPrompt = ai.definePrompt({
  name: 'summarizeCardInformationPrompt',
  input: {schema: SummarizeCardInformationInputSchema},
  output: {schema: SummarizeCardInformationOutputSchema},
  prompt: `Summarize the key information of the following Pokemon card, including its name, set, and rarity:\n\nName: {{{name}}}\nSet: {{{set}}}\nRarity: {{{rarity}}}`,
});

const summarizeCardInformationFlow = ai.defineFlow(
  {
    name: 'summarizeCardInformationFlow',
    inputSchema: SummarizeCardInformationInputSchema,
    outputSchema: SummarizeCardInformationOutputSchema,
  },
  async input => {
    const {output} = await summarizeCardInformationPrompt(input);
    return output!;
  }
);
