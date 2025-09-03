'use server';

import { revalidatePath } from 'next/cache';
import { getContent, setContent, type SharedContent } from '@/lib/storage';
import { randomBytes } from 'crypto';
import {nanoid} from 'nanoid';

interface SendState {
  id?: string;
  error?: string;
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


    const id = nanoid(8);
    setContent(id, contentToStore);

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

export async function receiveContent(id: string): Promise<ReceiveResult> {
  if (!id || typeof id !== 'string' || id.length < 3) {
    return { error: 'Invalid ID format.' };
  }
  try {
    const data = getContent(id.trim());

    if (!data) {
      // Check realtime sessions
        if(sessionStore.has(id.trim())) {
            const session = sessionStore.get(id.trim())!;
            if (Date.now() > session.expiresAt) {
                sessionStore.delete(id.trim());
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
