'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';

import { receiveContent } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ContentDisplay } from './content-display';
import type { SharedContent } from '@/lib/storage';

interface ReceiveResult {
  data?: SharedContent;
  error?: string;
}

export function ReceiveForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ReceiveResult | null>(null);
  const [id, setId] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setResult(null);
    if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
    }
    startTransition(async () => {
      const res = await receiveContent(id);
      setResult(res);
      if (!res.data && !res.error) {
        // Start polling if it's a pending session
        pollIntervalRef.current = setInterval(async () => {
            const pollRes = await receiveContent(id);
            if(pollRes.data || pollRes.error) {
                setResult(pollRes);
                clearInterval(pollIntervalRef.current);
            }
        }, 2000);
      }
    });
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const id = hash.split('?')[0];
      setId(id);
      window.location.hash = '';
      if(id) {
          startTransition(async () => {
            const res = await receiveContent(id);
            setResult(res);
            if (!res.data && !res.error) {
                // Start polling if it's a pending session
                pollIntervalRef.current = setInterval(async () => {
                    const pollRes = await receiveContent(id);
                    if(pollRes.data || pollRes.error) {
                        setResult(pollRes);
                        clearInterval(pollIntervalRef.current);
                    }
                }, 2000);
            }
          });
      }
    }

    return () => {
        if(pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    }
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Receive Content</CardTitle>
        <CardDescription>Enter the shared ID to view or download the content.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            name="id"
            placeholder="Enter share ID"
            className="font-mono text-lg h-12"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={isPending && !result}
            required
          />
          <Button type="submit" size="icon" className="h-12 w-12" disabled={isPending && !result}>
            {isPending && !result ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
          </Button>
        </form>

        <div className="mt-6">
          {result?.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {!result?.data && !result?.error && isPending && (
             <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Waiting for content...</p>
             </div>
          )}

          {result?.data && <ContentDisplay content={result.data} />}
        </div>
      </CardContent>
    </Card>
  );
}
