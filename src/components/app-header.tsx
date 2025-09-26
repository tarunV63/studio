
'use client';

import { Menu, MoreVertical, Music2, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from '@/app/page';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function AppHeader({ songs, onFileSelect, onAddSong, isSheetOpen, setIsSheetOpen }) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

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
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary-foreground/10" onClick={() => setIsSheetOpen(true)}>
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
      
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary-foreground/10">
                    <MoreVertical className="h-6 w-6" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {user ? (
                  <>
                    <DropdownMenuItem disabled>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Admin Login</span>
                    </Link>
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );
}
