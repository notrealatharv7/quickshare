
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Send } from 'lucide-react';
import { getChatMessages, sendRealtimeChatMessage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatMessage {
  sender: 'user' | 'peer';
  text: string;
  timestamp: number;
}

interface ChatBoxProps {
  sessionId: string;
  sender: 'user' | 'peer';
  initialMessages?: ChatMessage[];
}

export function ChatBox({ sessionId, sender, initialMessages = [] }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, startSendingTransition] = useTransition();
  const [isPolling, startPollingTransition] = useTransition();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    startPollingTransition(async () => {
      const res = await getChatMessages(sessionId);
      if (res.messages) {
        setMessages(res.messages);
      }
      if (res.error) {
        clearInterval(pollIntervalRef.current);
      }
    });
  };

  useEffect(() => {
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollIntervalRef.current);
  }, [sessionId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollable = scrollAreaRef.current.querySelector('div');
        if (scrollable) {
            scrollable.scrollTop = scrollable.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('message') as string;
    if (!text.trim()) return;

    (e.currentTarget as HTMLFormElement).reset();

    startSendingTransition(async () => {
      setMessages((prev) => [...prev, { sender, text, timestamp: Date.now() }]);
      await sendRealtimeChatMessage(sessionId, text, sender);
      fetchMessages(); // Fetch immediately after sending
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-end gap-2',
                  msg.sender === sender ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-xs rounded-lg p-3',
                    msg.sender === sender
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="w-full flex items-center space-x-2">
          <Input
            name="message"
            placeholder="Type a message..."
            disabled={isSending}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
