
'use server';

import { revalidatePath } from 'next/cache';
import { storageProvider, type SharedContent } from '@/lib/database';
import { nanoid } from 'nanoid';

interface ChatMessage {
    sender: 'user' | 'peer';
    text: string;
    timestamp: number;
}


interface SendState {
  id?: string;
  error?: string;
  isRealtime?: boolean;
}

const sessionStore = new Map<
  string,
  {status: 'pending' | 'connected'; content?: SharedContent; messages: ChatMessage[]; expiresAt: number}
>();
const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

export async function sendContent(prevState: SendState, formData: FormData): Promise<SendState> {
  const text = formData.get('text') as string;
  const file = formData.get('file') as File;
  const useRealtime = formData.get('useRealtime') === 'on';
  const realtimeSessionId = formData.get('realtimeSessionId') as string | null;

  if (useRealtime) {
      if (realtimeSessionId) {
        return { isRealtime: true, id: realtimeSessionId };
      } else {
        return { error: 'Could not create or find a real-time session.' };
      }
  }

  if (!text && (!file || file.size === 0)) {
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

    const id = await storageProvider.setContent(contentToStore);

    revalidatePath('/');
    return { id };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to save content. Please try again.';
    return { error: errorMessage };
  }
}

interface ReceiveResult {
  data?: SharedContent;
  messages?: ChatMessage[];
  error?: string;
}

const NANOID_REGEX = /^[a-zA-Z0-9_-]{8}$/;

export async function receiveContent(id: string): Promise<ReceiveResult> {
    const trimmedId = id.trim();
  if (!trimmedId || typeof trimmedId !== 'string' || !NANOID_REGEX.test(trimmedId)) {
    return { error: 'Invalid ID format. Please enter a valid 8-character ID.' };
  }
  try {
    // Check realtime sessions first
    if(sessionStore.has(trimmedId)) {
        const session = sessionStore.get(trimmedId)!;
        if (Date.now() > session.expiresAt) {
            sessionStore.delete(trimmedId);
            return { error: 'Content not found or has expired.' };
        }
        if (session.content) {
             if(session.status === 'pending') {
                session.status = 'connected';
            }
            return {data: session.content, messages: session.messages};
        }
        // User has joined, mark as connected to allow chat
        if(session.status === 'pending') {
            session.status = 'connected';
        }
          return {messages: session.messages}; // Still pending content, but can chat
    }
      
    const data = await storageProvider.getContent(trimmedId);

    if (!data) {
      return { error: 'Content not found or has expired.' };
    }

    return { data };
  } catch (e) {
    return { error: 'An unexpected error occurred.' };
  }
}

interface AuthResult {
    success: boolean;
    error?: string;
}

const VALID_CODES = ['TEACHER123', 'STUDENT456'];

export async function authenticateWithCode(code: string): Promise<AuthResult> {
    if (VALID_CODES.includes(code.trim())) {
        return { success: true };
    } else {
        return { success: false, error: 'The code you entered is invalid.' };
    }
}

export async function sendChatMessage(sessionId: string, message: string, sender: 'user' | 'peer'): Promise<{success: boolean, error?: string}> {
    if (!sessionStore.has(sessionId)) {
        return {success: false, error: 'Session not found.'};
    }
    const session = sessionStore.get(sessionId)!;
     if (Date.now() > session.expiresAt) {
        sessionStore.delete(sessionId);
        return {success: false, error: 'Session has expired.'};
    }
    
    session.messages.push({
        sender,
        text: message,
        timestamp: Date.now()
    });

    return {success: true};
}

export async function getChatMessages(sessionId: string): Promise<{messages?: ChatMessage[], error?: string}> {
    if (!sessionStore.has(sessionId)) {
        return { error: 'Session not found.' };
    }
    const session = sessionStore.get(sessionId)!;
    if (Date.now() > session.expiresAt) {
        sessionStore.delete(sessionId);
        return { error: 'Session has expired.' };
    }
    return { messages: session.messages };
}


// Public Chat
interface PublicMessage {
    sender: string;
    text: string;
    timestamp: number;
}
const publicChatStore: PublicMessage[] = [];

export async function sendPublicChatMessage(sender: string, message: string): Promise<{success: boolean}> {
    if (message.trim() && sender.trim()) {
        publicChatStore.push({
            sender,
            text: message,
            timestamp: Date.now(),
        });
        // Keep only the last 100 messages
        if (publicChatStore.length > 100) {
            publicChatStore.shift();
        }
    }
    return {success: true};
}

export async function getPublicChatMessages(): Promise<{messages: PublicMessage[]}> {
    return { messages: publicChatStore };
}


// Real-time session creation
interface CreateRealtimeSessionOutput {
  sessionId: string;
}

export async function createRealtimeSession(): Promise<CreateRealtimeSessionOutput> {
    const sessionId = nanoid(8);
    sessionStore.set(sessionId, {
        status: 'pending',
        messages: [],
        expiresAt: Date.now() + EXPIRY_DURATION,
        content: { type: 'text', content: ''} // Initialize with empty text content
    });
    return { sessionId };
}

export async function updateRealtimeContent(sessionId: string, text: string): Promise<{success: boolean, error?: string}> {
    if (!sessionStore.has(sessionId)) {
        return {success: false, error: 'Session not found.'};
    }
    const session = sessionStore.get(sessionId)!;
    if (Date.now() > session.expiresAt) {
        sessionStore.delete(sessionId);
        return {success: false, error: 'Session has expired.'};
    }
    
    session.content = { type: 'text', content: text };
    if (session.status === 'pending') {
        session.status = 'connected';
    }

    return {success: true};
}
