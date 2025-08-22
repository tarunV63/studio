'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function LyricsView() {
  const [song, setSong] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Workaround to get data from the main page without a database
    try {
      const storedSong = sessionStorage.getItem('temp_song_view');
      if (storedSong) {
        setSong(JSON.parse(storedSong));
        // Clean up session storage after use
        sessionStorage.removeItem('temp_song_view');
      } else {
        setError('No song data found. Please navigate from the main page.');
      }
    } catch (e) {
      console.error("Error reading from session storage:", e);
      setError("Failed to load song data.");
    }
  }, []);

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manager
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{song?.name || 'Song Lyrics'}</CardTitle>
        </CardHeader>
        <CardContent>
          {song?.content ? (
            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">
              {song.content}
            </pre>
          ) : (
            <p className="text-muted-foreground">No lyrics to display. Please go back and select a song.</p>
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
