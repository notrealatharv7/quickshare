'use server';

/**
 * @fileOverview This flow determines whether to override automatic syntax highlighting.
 *
 * - shouldOverrideHighlighting - Determines if automatic highlighting should be overridden.
 * - ShouldOverrideHighlightingInput - The input type for the shouldOverrideHighlighting function.
 * - ShouldOverrideHighlightingOutput - The return type for the shouldOverrideHighlighting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShouldOverrideHighlightingInputSchema = z.object({
  code: z.string().describe('The code snippet to be highlighted.'),
  detectedLanguage: z.string().describe('The automatically detected language.'),
  userOverride: z.boolean().optional().describe('Whether the user wants to override the highlighting.'),
  userSelectedLanguage: z.string().optional().describe('The language the user has selected to override the highlighting.'),
});

export type ShouldOverrideHighlightingInput = z.infer<typeof ShouldOverrideHighlightingInputSchema>;

const ShouldOverrideHighlightingOutputSchema = z.object({
  override: z.boolean().describe('Whether to override the automatic highlighting.'),
  language: z.string().optional().describe('The language to use for highlighting if overriding.'),
});

export type ShouldOverrideHighlightingOutput = z.infer<typeof ShouldOverrideHighlightingOutputSchema>;

export async function shouldOverrideHighlighting(
  input: ShouldOverrideHighlightingInput
): Promise<ShouldOverrideHighlightingOutput> {
  return shouldOverrideHighlightingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shouldOverrideHighlightingPrompt',
  input: {schema: ShouldOverrideHighlightingInputSchema},
  output: {schema: ShouldOverrideHighlightingOutputSchema},
  prompt: `You are an AI assistant that helps determine whether to override automatic syntax highlighting for a code snippet.

You will receive the code snippet, the automatically detected language, and whether the user wants to override the highlighting, along with the language they selected.

Here's the information you have:
- Code: {{{code}}}
- Detected Language: {{{detectedLanguage}}}
- User Override: {{#if userOverride}}{{{userOverride}}}{{else}}false{{/if}}
- User Selected Language: {{#if userSelectedLanguage}}{{{userSelectedLanguage}}}{{else}}None{{/if}}

Based on this information, determine whether to override the automatic highlighting. Consider these factors:
- If the user has explicitly chosen to override, then override.
- If the detected language is incorrect or does not produce good highlighting, consider overriding if the user has selected a specific language.

Output a JSON object with the 'override' field set to true or false, and the 'language' field set to the language the user wants if override is true and user selected language is specified, otherwise omit it entirely.
`, // Added Handlebars syntax here
});

const shouldOverrideHighlightingFlow = ai.defineFlow(
  {
    name: 'shouldOverrideHighlightingFlow',
    inputSchema: ShouldOverrideHighlightingInputSchema,
    outputSchema: ShouldOverrideHighlightingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
