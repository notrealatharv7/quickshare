'use client';

import { useState, useTransition, useEffect } from 'react';
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setResult(null);
    startTransition(async () => {
      const res = await receiveContent(id);
      setResult(res);
    });
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if(hash){
      setId(hash);
      window.location.hash = '';
      startTransition(async () => {
        const res = await receiveContent(hash);
        setResult(res);
      });
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
            disabled={isPending}
            required
          />
          <Button type="submit" size="icon" className="h-12 w-12" disabled={isPending}>
            {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
          </Button>
        </form>

        <div className="mt-6">
          {result?.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {result?.data && <ContentDisplay content={result.data} />}
        </div>
      </CardContent>
    </Card>
  );
}
