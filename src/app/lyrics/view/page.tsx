
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

function LyricsView() {
  const [songContent, setSongContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get('id');

  const fetchSong = useCallback(async () => {
    if (!songId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const songDoc = doc(firestore, 'songs', songId);
      const docSnap = await getDoc(songDoc);
      if (docSnap.exists()) {
        setSongContent(docSnap.data().content);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching song:", error);
    } finally {
      setIsLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    fetchSong();
  }, [fetchSong]);


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
            <p className="text-muted-foreground">Could not find the requested lyrics.</p>
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
