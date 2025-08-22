'use client';

import { Home, LayoutGrid, Heart, User, Music2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: LayoutGrid },
  { href: '/lyrics', label: 'Lyrics', icon: Music2 },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-card border-t">
      <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center font-medium text-xs px-2 hover:bg-muted group transition-colors duration-200"
            >
              <item.icon
                className={cn(
                  'w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'group-hover:text-primary transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
