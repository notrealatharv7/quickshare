'use client';

import { Download, FileText } from 'lucide-react';
import type { SharedContent } from '@/lib/storage';
import { Button } from './ui/button';
import { CodeBlock } from './code-block';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface ContentDisplayProps {
  content: SharedContent;
}

export function ContentDisplay({ content }: ContentDisplayProps) {

  const handleDownload = () => {
    if (content.type !== 'file' || !content.content) return;
    const byteCharacters = atob(content.content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: content.mimetype });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = content.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle>Shared Content</CardTitle>
        {content.type === 'file' && <CardDescription>Your shared file is ready for download.</CardDescription>}
      </CardHeader>
      <CardContent>
        {content.type === 'text' ? (
          <CodeBlock code={content.content} />
        ) : (
          <div className="flex items-center justify-between rounded-lg border bg-background p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{content.filename}</p>
                <p className="text-sm text-muted-foreground">{content.mimetype}</p>
              </div>
            </div>
            <Button onClick={handleDownload} size="icon" variant="outline">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
