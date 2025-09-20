
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Send } from 'lucide-react';
import { getPublicChatMessages, sendPublicChatMessage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface PublicMessage {
  text: string;
  timestamp: number;
}

export function PublicChatBox() {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [isSending, startSendingTransition] = useTransition();
  const [isPolling, startPollingTransition] = useTransition();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    startPollingTransition(async () => {
      const res = await getPublicChatMessages();
      setMessages(res.messages);
    });
  };

  useEffect(() => {
    fetchMessages(); // Initial fetch
    pollIntervalRef.current = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(pollIntervalRef.current);
  }, []);

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
      setMessages((prev) => [...prev, { text, timestamp: Date.now() }]);
      await sendPublicChatMessage(text);
      fetchMessages(); // Fetch immediately after sending
    });
  };

  return (
    <>
        <Separator className="my-8" />
        <Card>
        <CardHeader>
            <CardTitle>Public Chat</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-64 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.map((msg, index) => (
                <div key={index} className="flex items-end gap-2 justify-start">
                    <div className="max-w-xs rounded-lg p-3 bg-muted">
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-muted-foreground text-right mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
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
                placeholder="Type a public message..."
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
    </>
  );
}
