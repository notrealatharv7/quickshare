
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { authenticateWithCode } from './actions';
import { CollabNotesLogo } from '@/components/icons';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
        setError('Please enter your name.');
        return;
    }
    setError(null);
    startTransition(async () => {
      const result = await authenticateWithCode(code);
      if (result.success) {
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userName', name);
        router.push('/collab');
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
    });
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background font-body items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
            <CollabNotesLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Collab Notes
            </h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Join Collaboration</CardTitle>
            <CardDescription>Enter your name and the access code to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  className="h-12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="code">Access Code</Label>
                <Input
                    id="code"
                    name="code"
                    placeholder="Enter your code"
                    className="font-mono text-lg h-12"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isPending}
                    required
                />
               </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Authentication Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <footer className="py-4 mt-4 text-center text-sm text-muted-foreground">
          <p>MADE BY S1 BATCH FOR CEP.</p>
        </footer>
      </div>
    </div>
  );
}
