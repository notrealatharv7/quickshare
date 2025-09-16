'use server';

import { revalidatePath } from 'next/cache';
import { storageProvider, type SharedContent } from '@/lib/database';

interface SendState {
  id?: string;
  error?: string;
  isRealtime?: boolean;
}

const sessionStore = new Map<
  string,
  {status: 'pending' | 'connected'; content?: SharedContent; expiresAt: number}
>();
const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

export async function sendContent(prevState: SendState, formData: FormData): Promise<SendState> {
  const text = formData.get('text') as string;
  const file = formData.get('file') as File;
  const realtimeSessionId = formData.get('realtimeSessionId') as string;

  if (!text && file.size === 0) {
    return { error: 'Please provide text, or drop a file to share.' };
  }

  try {
    let contentToStore: SharedContent;

    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      contentToStore = {
        type: 'file',
        content: Buffer.from(buffer).toString('base64'),
        filename: file.name,
        mimetype: file.type,
      };
    } else {
      contentToStore = {
        type: 'text',
        content: text,
      };
    }

    if (realtimeSessionId && sessionStore.has(realtimeSessionId)) {
        const session = sessionStore.get(realtimeSessionId)!;
        session.status = 'connected';
        session.content = contentToStore;
        return {id: realtimeSessionId, isRealtime: true};
    }


    const id = await storageProvider.setContent(contentToStore);

    revalidatePath('/');
    return { id };
  } catch (e) {
    return { error: 'Failed to save content. Please try again.' };
  }
}

interface ReceiveResult {
  data?: SharedContent;
  error?: string;
}

const NANOID_REGEX = /^[a-zA-Z0-9_-]{8}$/;

export async function receiveContent(id: string): Promise<ReceiveResult> {
    const trimmedId = id.trim();
  if (!trimmedId || typeof trimmedId !== 'string' || !NANOID_REGEX.test(trimmedId)) {
    return { error: 'Invalid ID format. Please enter a valid 8-character ID.' };
  }
  try {
    const data = await storageProvider.getContent(trimmedId);

    if (!data) {
      // Check realtime sessions
        if(sessionStore.has(trimmedId)) {
            const session = sessionStore.get(trimmedId)!;
            if (Date.now() > session.expiresAt) {
                sessionStore.delete(trimmedId);
                return { error: 'Content not found or has expired.' };
            }
            if (session.status === 'connected' && session.content) {
                return {data: session.content};
            }
            return {}; // Still pending
        }

      return { error: 'Content not found or has expired.' };
    }

    return { data };
  } catch (e) {
    return { error: 'An unexpected error occurred.' };
  }
}
