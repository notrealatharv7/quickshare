
'use client';

import { useState, useTransition, type DragEvent, useRef, useEffect } from 'react';
import { Copy, Loader2, Send, UploadCloud, X, Wifi, LogOut } from 'lucide-react';
import { sendContent, createRealtimeSession, updateRealtimeContent } from '@/app/actions';
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

interface SendState {
  id?: string;
  error?: string;
  isRealtime?: boolean;
}

export function SendForm() {
  const [state, setState] = useState<SendState>({});
  const [isPending, startTransition] = useTransition();
  const [isAutoSaving, startAutoSaveTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [useRealtime, setUseRealtime] = useState(false);
  const [isRealtimePending, startRealtimeTransition] = useTransition();
  
  const [activeRealtimeSession, setActiveRealtimeSession] = useState<string | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save logic for real-time text content
  useEffect(() => {
    if (activeRealtimeSession) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        startAutoSaveTransition(async () => {
          await updateRealtimeContent(activeRealtimeSession, textContent);
        });
      }, 1500); // Auto-save after 1.5s of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }
  }, [textContent, activeRealtimeSession]);


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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (useRealtime) {
        startRealtimeTransition(async () => {
            const { sessionId } = await createRealtimeSession();
            // We don't need to update content right away, auto-save will handle it
            setActiveRealtimeSession(sessionId);
        });
    } else {
        const formData = new FormData(event.currentTarget);
        if (file) {
            formData.set('file', file);
        }
        startTransition(async () => {
            const result = await sendContent({}, formData);
            setState(result);
        });
    }
  };
  
  const handleReset = () => {
    setState({});
    setUseRealtime(false);
    setActiveRealtimeSession(null);
    setTextContent('');
    setFile(null);
    formRef.current?.reset();
  }

  if (activeRealtimeSession) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Real-time Session Active</CardTitle>
          <CardDescription>Share this ID. Your content will be shared live as you type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input readOnly value={activeRealtimeSession} className="font-mono text-lg h-12" />
            <Button
              size="icon"
              className="h-12 w-12"
              onClick={() => handleCopy(activeRealtimeSession)}
            >
              <Copy className="h-6 w-6" />
            </Button>
          </div>
          <Textarea
            name="text"
            placeholder="Start typing your real-time content here..."
            className="h-64 resize-none font-code mt-4"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
          <div className="text-right text-sm text-muted-foreground mt-2 h-4">
            {isAutoSaving ? 'Saving...' : textContent ? 'Saved' : ''}
          </div>
        </CardContent>
        <CardFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleReset}
            >
              <LogOut className="mr-2 h-5 w-5" />
              End Session
            </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (state?.id) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Content Shared!</CardTitle>
          <CardDescription>Share this ID with anyone to give them access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input readOnly value={state.id} className="font-mono text-lg h-12" />
            <Button
              size="icon"
              className="h-12 w-12"
              onClick={() => handleCopy(state.id!)}
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
                  placeholder="Paste your code here..."
                  className="h-64 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent font-code"
                  disabled={isPending || isRealtimePending}
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
              disabled={isPending || isRealtimePending}
            />
            <Label htmlFor="realtime-mode" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Real-time Session
            </Label>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" disabled={isPending || isRealtimePending || (!textContent && !file && !useRealtime)}>
            {isPending || isRealtimePending ? (
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
