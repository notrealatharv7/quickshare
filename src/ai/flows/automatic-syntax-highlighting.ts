'use server';

/**
 * @fileOverview Automatically detects the syntax of code and applies highlighting.
 *
 * - detectAndHighlightSyntax - A function that detects the syntax of code and applies highlighting.
 * - DetectAndHighlightSyntaxInput - The input type for the detectAndHighlightSyntax function.
 * - DetectAndHighlightSyntaxOutput - The return type for the detectAndHighlightSyntax function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndHighlightSyntaxInputSchema = z.object({
  code: z.string().describe('The code to detect the syntax and highlight.'),
});
export type DetectAndHighlightSyntaxInput = z.infer<typeof DetectAndHighlightSyntaxInputSchema>;

const DetectAndHighlightSyntaxOutputSchema = z.object({
  highlightedCode: z
    .string()
    .describe('The code with syntax highlighting applied.'),
  language: z.string().optional().describe('The detected language of the code.'),
});
export type DetectAndHighlightSyntaxOutput = z.infer<typeof DetectAndHighlightSyntaxOutputSchema>;

export async function detectAndHighlightSyntax(
  input: DetectAndHighlightSyntaxInput
): Promise<DetectAndHighlightSyntaxOutput> {
  return detectAndHighlightSyntaxFlow(input);
}

const detectAndHighlightSyntaxPrompt = ai.definePrompt({
  name: 'detectAndHighlightSyntaxPrompt',
  input: {schema: DetectAndHighlightSyntaxInputSchema},
  output: {schema: DetectAndHighlightSyntaxOutputSchema},
  prompt: `You are a code syntax highlighter. You take in a code snippet, determine the language, and return the code with syntax highlighting.

  Respond in markdown format with the appropriate language tag.
  If you cannot determine the language, respond in plain text.

  Code: {{{code}}} `,
});

const detectAndHighlightSyntaxFlow = ai.defineFlow(
  {
    name: 'detectAndHighlightSyntaxFlow',
    inputSchema: DetectAndHighlightSyntaxInputSchema,
    outputSchema: DetectAndHighlightSyntaxOutputSchema,
  },
  async input => {
    const {output} = await detectAndHighlightSyntaxPrompt(input);
    return output!;
  }
);
