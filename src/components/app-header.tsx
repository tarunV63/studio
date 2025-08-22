'use client';

import { Menu, MoreVertical, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/page';
import { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';


export function AppHeader() {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const songsCollection = collection(firestore, 'songs');
    const q = query(songsCollection, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLyricsFiles(songs);
    });

    return () => unsubscribe();
  }, []);

  const handleFileSelect = (file) => {
    window.dispatchEvent(new CustomEvent('song-selected', { detail: file }));
    setIsSheetOpen(false); // Close sheet on selection
  };
  
    const handleFileUpload = () => {
    // The main page handles the upload logic, this is a stub
    // but we can trigger the main page's input if needed.
    // For now, this button is inside the sidebar which is only for mobile here.
    // The main page's button should be used.
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarProps = {
    onFileSelect: handleFileSelect,
    fileInputRef,
    handleFileUpload,
    searchTerm,
    setSearchTerm,
    filteredSongs,
    selectedSong: null 
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-2 sm:px-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary-foreground/10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Song List</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
              <SheetHeader className="p-4 border-b">
                  <SheetTitle>Song List</SheetTitle>
              </SheetHeader>
              <SidebarContent {...sidebarProps} />
            </SheetContent>
          </Sheet>
        ) : (
          <Music2 className="h-6 w-6 ml-2" />
        )}
        <h1 className="text-xl font-bold font-headline">Lyrics</h1>
      </div>
      <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary-foreground/10">
        <MoreVertical className="h-6 w-6" />
        <span className="sr-only">More options</span>
      </Button>
    </header>
  );
}
