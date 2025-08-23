
'use client';

import { Menu, MoreVertical, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/page';
import { useState, useEffect, useRef } from 'react';

export function AppHeader({ songs, onFileSelect, onAddSong }) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const initialLoad = useRef(true);

  // Automatically open the sheet on mobile view on initial load only.
  useEffect(() => {
    if (isMobile && initialLoad.current) {
      setIsSheetOpen(true);
      initialLoad.current = false;
    }
  }, [isMobile]);


  // Close sheet when a song is selected on mobile
  useEffect(() => {
    const handleClose = () => setIsSheetOpen(false);
    window.addEventListener('song-selected-mobile', handleClose);
    return () => {
      window.removeEventListener('song-selected-mobile', handleClose);
    };
  }, []);

  const filteredSongs = songs.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarProps = {
    onFileSelect,
    handleAddSong: onAddSong,
    searchTerm,
    setSearchTerm,
    filteredSongs,
    selectedSong: null // No concept of selected song in the header's sheet
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
