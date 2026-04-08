'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEMES = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Oscuro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" />;
  }

  function cycle() {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme ?? 'system') + 1) % order.length];
    setTheme(next);
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2];
  const Icon = current.icon;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      title={`Tema: ${current.label}`}
      className="w-9 h-9"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
