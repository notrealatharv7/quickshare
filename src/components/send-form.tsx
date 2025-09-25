
'use client';

import { useState, useTransition, type DragEvent, useRef, useEffect, useActionState } from 'react';
import { Copy, Loader2, Send, UploadCloud, X, Wifi } from 'lucide-react';
import { sendContent, createRealtimeSession } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ChatBox } from './chat-box';

const initialState = {
    id: undefined,
    isRealtime: false,
    error: undefined,
};

export function SendForm() {
  const [formState, formAction] = useActionState(sendContent, initialState);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [useRealtime, setUseRealtime] = useState(false);
  const [realtimeSessionId, setRealtimeSessionId] = useState<string | null>(null);
  const [isRealtimePending, startRealtimeTransition] = useTransition();
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (useRealtime && !realtimeSessionId) {
      startRealtimeTransition(async () => {
        const { sessionId } = await createRealtimeSession();
        setRealtimeSessionId(sessionId);
      });
    }
    if (!useRealtime) {
      setRealtimeSessionId(null);
    }
  }, [useRealtime]);

  // Auto-save logic for real-time text content
  useEffect(() => {
    if (useRealtime && realtimeSessionId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        startTransition(() => {
          const formData = new FormData();
          formData.append('text', textContent);
          formData.append('realtimeSessionId', realtimeSessionId);
          formAction(formData);
        });
      }, 1500); // Auto-save after 1.5s of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }
  }, [textContent, useRealtime, realtimeSessionId, formAction]);


  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/collab#${id}`);
    toast({
      title: 'Copied to clipboard!',
      description: 'The shareable link has been copied.',
    });
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setTextContent(''); // Clear text when file is dropped
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (file) {
      formData.append('file', file);
    }
    if (realtimeSessionId) {
      formData.append('realtimeSessionId', realtimeSessionId);
    }
    startTransition(() => {
      formAction(formData);
    });
  };
  
  const handleReset = () => {
    // A bit of a hack to reset the form state
    formState.id = undefined;
    formState.error = undefined;
    formState.isRealtime = false;
    setUseRealtime(false);
    setRealtimeSessionId(null);
    setTextContent('');
    setFile(null);
    formRef.current?.reset();
  }


  useEffect(() => {
    if (formState?.id && !formState.isRealtime) {
        // We don't reset here anymore to show the success message
    }
  }, [formState]);

  if (formState?.id && formState?.isRealtime) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Real-time Session Active</CardTitle>
          <CardDescription>Share this ID. Your content will be shared live.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input readOnly value={formState.id} className="font-mono text-lg h-12" />
            <Button
              size="icon"
              className="h-12 w-12"
              onClick={() => handleCopy(formState.id!)}
            >
              <Copy className="h-6 w-6" />
            </Button>
          </div>
           {formState.isRealtime && formState.id && <ChatBox sessionId={formState.id} sender="user" />}
          <Button
            variant="link"
            className="px-0 mt-4"
            onClick={handleReset}
          >
            End Session & Share Something Else
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (formState?.id && !formState.isRealtime) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Content Shared!</CardTitle>
          <CardDescription>Share this ID with anyone to give them access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input readOnly value={formState.id} className="font-mono text-lg h-12" />
            <Button
              size="icon"
              className="h-12 w-12"
              onClick={() => handleCopy(formState.id!)}
            >
              <Copy className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="link"
            className="px-0 mt-4"
            onClick={handleReset}
          >
            Share something else
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle>Send Content</CardTitle>
        <CardDescription>Paste your code, text, or drop a file to share it instantly.</CardDescription>
      </CardHeader>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1">
        <CardContent
          className="flex-1"
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
        >
          <div
            className={cn(
              'relative h-full transition-all duration-300 rounded-lg border-2 border-dashed flex flex-col justify-center items-center p-4',
              isDragging ? 'border-primary bg-accent' : 'border-border'
            )}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  ({(file.size / 1024).toFixed(2)} KB)
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-muted-foreground"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex flex-col justify-center items-center transition-opacity',
                    isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  )}
                >
                  <UploadCloud className="h-12 w-12 text-primary" />
                  <p className="mt-2 text-lg font-semibold">Drop file to upload</p>
                </div>
                <Textarea
                  name="text"
                  placeholder="Paste your content here..."
                  className="h-64 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent font-code"
                  disabled={isPending}
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    if (file) setFile(null); // Clear file if user starts typing
                  }}
                />
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="realtime-mode"
              checked={useRealtime}
              onCheckedChange={setUseRealtime}
              disabled={isRealtimePending || isPending}
            />
            <Label htmlFor="realtime-mode" className="flex items-center gap-2">
              {isRealtimePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Real-time Session
            </Label>
          </div>

          {realtimeSessionId && (
            <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
              <Input
                readOnly
                value={realtimeSessionId}
                className="font-mono text-md h-10 bg-transparent border-0"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => handleCopy(realtimeSessionId)}
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          )}

          {formState.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formState.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" disabled={isPending || (useRealtime && !!textContent) }>
            {isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="mr-2 h-5 w-5" />
            )}
            { useRealtime ? 'Start Session' : 'Send' }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
