'use client';

import { detectAndHighlightSyntax } from '@/ai/flows/automatic-syntax-highlighting';
import { useEffect, useState, useTransition } from 'react';
import { Skeleton } from './ui/skeleton';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState('');
  const [language, setLanguage] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      // Basic sanitization
      const sanitizedCode = code.replace(/```/g, '');
      const result = await detectAndHighlightSyntax({ code: sanitizedCode });
      
      let finalHtml = result.highlightedCode || '';
      
      // The model sometimes wraps the output in markdown backticks, so we need to remove them.
      const langRegex = /^```(\w*)\n/;
      const match = finalHtml.match(langRegex);
      const detectedLang = match ? match[1] : result.language || '';
      setLanguage(detectedLang);
      
      finalHtml = finalHtml.replace(langRegex, '').replace(/\n```$/, '');
      
      setHighlightedCode(finalHtml);
    });
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Code has been copied to clipboard.',
    });
  };

  if (isPending) {
    return <Skeleton className="w-full h-48" />;
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {language && <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{language}</span>}
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
        </Button>
      </div>
      <pre className="p-4 rounded-md bg-background overflow-x-auto">
        <code
          className="font-code text-sm"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}
