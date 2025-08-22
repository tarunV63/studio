'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function LyricsView() {
  const [song, setSong] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchSong = useCallback(async (id) => {
      setIsLoading(true);
      setError(null);
      try {
        if (!firestore) {
            throw new Error("Firestore is not initialized.");
        }
        const songDoc = await getDoc(doc(firestore, 'songs', id));
        if (songDoc.exists()) {
          setSong({ id: songDoc.id, ...songDoc.data() });
        } else {
          setError('Song not found.');
        }
      } catch (err) {
        console.error("Error fetching song:", err);
        setError('Failed to load song.');
      } finally {
          setIsLoading(false);
      }
  }, []);
  
  useEffect(() => {
    const songId = searchParams.get('id');
    if (songId) {
      fetchSong(songId);
    } else {
      setError('No song ID provided.');
      setIsLoading(false);
    }
  }, [searchParams, fetchSong]);


  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
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
