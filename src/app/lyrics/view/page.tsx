
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

function LyricsView() {
  const [songContent, setSongContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // We'll use localStorage to pass the content to avoid complex state management for this simple case
    const content = localStorage.getItem('temp_song_content');
    if (content) {
      setSongContent(content);
    }
    setIsLoading(false);
    // Optional: Clean up localStorage after reading
    // localStorage.removeItem('temp_song_content');
  }, []);


  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manager
      </Button>
      <Card>
        <CardContent className="p-6">
          {songContent ? (
            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">
              {songContent}
            </pre>
          ) : (
            <p className="text-muted-foreground">No lyrics to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function ViewLyricsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <LyricsView />
    </Suspense>
  )
}

    