'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

function LyricsView() {
  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get('id');

  useEffect(() => {
    if (!songId) {
      setError('No song ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchSong = async () => {
      try {
        const songDoc = await getDoc(doc(firestore, 'songs', songId));
        if (songDoc.exists()) {
          setSong({ id: songDoc.id, ...songDoc.data() });
        } else {
          setError('Song not found.');
        }
      } catch (err) {
        console.error("Error fetching song:", err);
        setError('Failed to load the song.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading lyrics...</div>;
  }

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
