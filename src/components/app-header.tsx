'use client';

import { Menu, MoreVertical, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/page';
import { useState, useRef, useEffect } from 'react';

// These functions are duplicated from page.tsx to avoid circular dependency
async function getFiles() {
  if (typeof window !== 'undefined') {
    try {
      const files = localStorage.getItem('lyrics_files');
      if (files) {
        return JSON.parse(files);
      }
    } catch (e) {
      console.error("Could not parse lyrics_files from localStorage", e);
    }
    // If no files, we can't initialize with sample songs here as saveFiles is not available
    // This component will show an empty list until the main page loads and saves samples.
    return []; 
  }
  return [];
}


export function AppHeader() {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State and refs needed for SidebarContent
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // This effect ensures that the sidebar content is up-to-date
    // if the header is used across different pages or re-renders.
    if (isMobile) {
      getFiles().then(files => {
        setLyricsFiles(files);
        if (files.length > 0 && !selectedSong) {
          setSelectedSong(files[0]);
        }
      });
    }
  }, [isMobile, isSheetOpen, selectedSong]);

  const handleFileSelect = (file) => {
    setSelectedSong(file);
    // This is tricky. We can't directly update the main page's state.
    // A better solution would involve a global state manager (like Context or Zustand).
    // For now, we rely on the main page re-reading localStorage or a refresh.
    // A simple way to communicate is to close the sheet, which might trigger effects on the main page.
    setIsSheetOpen(false);
    // We could also use a custom event.
    window.dispatchEvent(new CustomEvent('song-selected', { detail: file }));
  };

  const handleFileUpload = (event) => {
     // This logic is complex and relies on main page state.
     // It's better to keep the upload button inside the main page
     // or use a global state solution.
     // For now, we will just trigger the click. The logic remains in page.tsx
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
    selectedSong
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
