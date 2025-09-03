'use server';

/**
 * @fileOverview A real-time sharing AI agent.
 *
 * - createRealtimeSession - A function that handles the real-time sharing session.
 * - CreateRealtimeSessionInput - The input type for the createRealtimeSession function.
 * - CreateRealtimeSessionOutput - The return type for the createRealtimeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {nanoid} from 'nanoid';
import type {SharedContent} from '@/lib/storage';

const CreateRealtimeSessionInputSchema = z.object({
  sessionId: z.string().optional().describe('The ID of the session to create or join.'),
});
export type CreateRealtimeSessionInput = z.infer<typeof CreateRealtimeSessionInputSchema>;

const CreateRealtimeSessionOutputSchema = z.object({
  sessionId: z.string().describe('The ID of the session.'),
  status: z.enum(['pending', 'connected', 'expired']).describe('The status of the session.'),
  content: z
    .custom<SharedContent>()
    .optional()
    .describe('The shared content.'),
});
export type CreateRealtimeSessionOutput = z.infer<typeof CreateRealtimeSessionOutputSchema>;

const sessionStore = new Map<
  string,
  {status: 'pending' | 'connected'; content?: SharedContent; expiresAt: number}
>();
const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

export async function createRealtimeSession(
  input: CreateRealtimeSessionInput
): Promise<CreateRealtimeSessionOutput> {
  return createRealtimeSessionFlow(input);
}

const createRealtimeSessionFlow = ai.defineFlow(
  {
    name: 'createRealtimeSessionFlow',
    inputSchema: CreateRealtimeSessionInputSchema,
    outputSchema: CreateRealtimeSessionOutputSchema,
  },
  async ({sessionId}) => {
    let currentSessionId = sessionId;
    if (currentSessionId && !sessionStore.has(currentSessionId)) {
      return {sessionId: currentSessionId, status: 'expired'};
    }

    if (!currentSessionId) {
      currentSessionId = nanoid(8);
      sessionStore.set(currentSessionId, {
        status: 'pending',
        expiresAt: Date.now() + EXPIRY_DURATION,
      });
    }

    const session = sessionStore.get(currentSessionId)!;
    if (Date.now() > session.expiresAt) {
      sessionStore.delete(currentSessionId);
      return {sessionId: currentSessionId, status: 'expired'};
    }

    return {
      sessionId: currentSessionId,
      status: session.status,
      content: session.content,
    };
  }
);
