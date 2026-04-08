'use client';

import { useState } from 'react';
import { usePlants } from '@/hooks/usePlants';
import { useWeather } from '@/hooks/useWeather';
import { useAlerts } from '@/hooks/useAlerts';
import { Warning, RiskLevel } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Filter = 'todas' | RiskLevel;

const FILTERS: { value: Filter; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { value: 'todas', label: 'Todas', icon: null, activeClass: 'bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white' },
  { value: 'alto', label: 'Alto', icon: <ShieldAlert className="h-3.5 w-3.5" />, activeClass: 'bg-red-600 text-white' },
  { value: 'medio', label: 'Medio', icon: <AlertTriangle className="h-3.5 w-3.5" />, activeClass: 'bg-amber-500 text-white' },
  { value: 'bajo', label: 'Bajo', icon: <Info className="h-3.5 w-3.5" />, activeClass: 'bg-blue-500 text-white' },
];

const RISK_STYLES: Record<RiskLevel, { border: string; icon: React.ReactNode; badge: string }> = {
  alto: {
    border: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
    icon: <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  },
  medio: {
    border: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  },
  bajo: {
    border: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40',
    icon: <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />,
    badge: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  },
  ok: {
    border: '',
    icon: null,
    badge: '',
  },
};

const RISK_LABEL: Record<RiskLevel, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
  ok: 'OK',
};

function countByLevel(warnings: Warning[]) {
  return {
    alto: warnings.filter((w) => w.riskLevel === 'alto').length,
    medio: warnings.filter((w) => w.riskLevel === 'medio').length,
    bajo: warnings.filter((w) => w.riskLevel === 'bajo').length,
  };
}

export function NavNotifications() {
  const [filter, setFilter] = useState<Filter>('todas');
  const { plants } = usePlants();
  const { weather } = useWeather();
  const warnings = useAlerts(plants, weather);
  const plantNames = Object.fromEntries(plants.map((p) => [p.id, p.name]));

  const counts = countByLevel(warnings);
  const totalHigh = counts.alto;

  const filtered = filter === 'todas' ? warnings : warnings.filter((w) => w.riskLevel === filter);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificaciones">
          <Bell className="h-5 w-5" />
          {warnings.length > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                totalHigh > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              )}
            >
              {warnings.length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-5 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {warnings.length > 0 && (
              <Badge variant="secondary" className="ml-1">{warnings.length}</Badge>
            )}
          </SheetTitle>

          {/* Count chips */}
          {warnings.length > 0 && (
            <div className="flex gap-2 text-xs mt-1 flex-wrap">
              {counts.alto > 0 && (
                <span className="flex items-center gap-1 text-red-700">
                  <ShieldAlert className="h-3 w-3" /> {counts.alto} alto
                </span>
              )}
              {counts.medio > 0 && (
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> {counts.medio} medio
                </span>
              )}
              {counts.bajo > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Info className="h-3 w-3" /> {counts.bajo} bajo
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Filter bar */}
        <div className="flex gap-1.5 px-4 py-3 border-b bg-muted/40 flex-wrap">
          {FILTERS.map((f) => {
            const count =
              f.value === 'todas'
                ? warnings.length
                : (counts as Record<string, number>)[f.value] ?? 0;

            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  isActive
                    ? f.activeClass + ' border-transparent shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {f.icon}
                {f.label}
                <span
                  className={cn(
                    'ml-0.5 min-w-[16px] h-4 rounded-full text-[10px] flex items-center justify-center px-1',
                    isActive ? 'bg-white/20 text-inherit' : 'bg-muted-foreground/20'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
              <p className="font-medium text-sm">
                {filter === 'todas' ? 'Sin alertas activas' : `Sin alertas de nivel ${filter}`}
              </p>
            </div>
          ) : (
            filtered.map((w) => (
              <AlertCard key={w.id} warning={w} plantName={plantNames[w.plantId] ?? w.plantId} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AlertCard({ warning, plantName }: { warning: Warning; plantName: string }) {
  const style = RISK_STYLES[warning.riskLevel];

  return (
    <div className={cn('rounded-lg border p-3 space-y-1.5', style.border)}>
      <div className="flex items-start gap-2">
        {style.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold leading-tight">{warning.title}</p>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', style.badge)}>
              {RISK_LABEL[warning.riskLevel]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{plantName}</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed pl-6">{warning.description}</p>
      <div className="flex items-start gap-1.5 pl-6">
        <span className="text-xs">💡</span>
        <p className="text-xs font-medium leading-relaxed">{warning.recommendation}</p>
      </div>
    </div>
  );
}
