'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ViewLyricsPage() {
  const [lyrics, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs only on the client-side
    const storedLyrics = localStorage.getItem('current_lyrics');
    if (storedLyrics) {
      setLyrics(storedLyrics);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manager
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Song Lyrics</CardTitle>
        </CardHeader>
        <CardContent>
          {lyrics ? (
            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">
              {lyrics}
            </pre>
          ) : (
            <p className="text-muted-foreground">No lyrics to display. Please go back and select a song.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
