'use client';

import { Menu, MoreVertical, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/page';
import { useState, useRef, useEffect } from 'react';

// This function is duplicated from page.tsx to avoid complex state management.
// A global state manager would be a better long-term solution.
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
    return []; 
  }
  return [];
}


export function AppHeader() {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // This state is just for the SidebarContent inside the sheet
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // This effect ensures that the sidebar content is up-to-date
    // if the header is used across different pages or re-renders.
    const updateFiles = () => {
      getFiles().then(setLyricsFiles);
    };

    if (isMobile && isSheetOpen) {
      updateFiles();
    }
    
    // Listen for file changes from the main page
    window.addEventListener('lyrics_updated', updateFiles);
    return () => {
      window.removeEventListener('lyrics_updated', updateFiles);
    }

  }, [isMobile, isSheetOpen]);

  // This is a simplified handler for the sheet's sidebar.
  // It uses a custom event to notify the main page.
  const handleFileSelect = (file) => {
    window.dispatchEvent(new CustomEvent('song-selected', { detail: file }));
    setIsSheetOpen(false); // Close sheet on selection
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarProps = {
    onFileSelect: handleFileSelect,
    fileInputRef,
    handleFileUpload: () => {}, // The main page handles upload logic
    searchTerm,
    setSearchTerm,
    filteredSongs,
    selectedSong: null // The header doesn't need to know the selected song
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

    