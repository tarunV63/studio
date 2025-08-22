import { Menu, MoreVertical, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-2 sm:px-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2 sm:gap-4">
        <Music2 className="h-6 w-6 ml-2" />
        <h1 className="text-xl font-bold font-headline">Lyrics</h1>
      </div>
      <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary-foreground/10">
        <MoreVertical className="h-6 w-6" />
        <span className="sr-only">More options</span>
      </Button>
    </header>
  );
}
