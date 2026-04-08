'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NavNotifications } from './NavNotifications';
import { ThemeToggle } from './ThemeToggle';

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-800 dark:text-green-400 hover:opacity-80">
          <span className="text-2xl">🌿</span>
          <span>Huertonga</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NavNotifications />
          <Button asChild size="sm">
            <Link href="/anadir-planta">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Añadir planta</span>
              <span className="sm:hidden">Añadir</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
