'use client';

import { useState } from 'react';
import { Warning, RiskLevel } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface Props {
  warnings: Warning[];
  plantNames: Record<string, string>;
}

const RISK_CONFIG: Record<RiskLevel, { variant: 'destructive' | 'default'; icon: React.ReactNode; label: string; bg: string }> = {
  alto: { variant: 'destructive', icon: <ShieldAlert className="h-4 w-4" />, label: 'Alto', bg: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40' },
  medio: { variant: 'default', icon: <AlertTriangle className="h-4 w-4 text-amber-600" />, label: 'Medio', bg: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40' },
  bajo: { variant: 'default', icon: <Info className="h-4 w-4 text-blue-500" />, label: 'Bajo', bg: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40' },
  ok: { variant: 'default', icon: <Info className="h-4 w-4" />, label: 'OK', bg: '' },
};

export function AlertsSummary({ warnings, plantNames }: Props) {
  const [open, setOpen] = useState(false);

  if (warnings.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
        <span className="text-lg">✅</span>
        <span>Todo en orden — no hay alertas activas en tu huerto.</span>
      </div>
    );
  }

  const visible = warnings.slice(0, 3);
  const hidden = warnings.slice(3);

  return (
    <div className="mb-6 space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Alertas activas ({warnings.length})
      </h2>
      {visible.map((w) => (
        <AlertItem key={w.id} warning={w} plantNames={plantNames} />
      ))}
      {hidden.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="space-y-2">
            {hidden.map((w) => (
              <AlertItem key={w.id} warning={w} plantNames={plantNames} />
            ))}
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-1">
              {open ? (
                <><ChevronUp className="h-4 w-4 mr-1" /> Ocultar</>
              ) : (
                <><ChevronDown className="h-4 w-4 mr-1" /> Ver {hidden.length} más</>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}

function AlertItem({ warning, plantNames }: { warning: Warning; plantNames: Record<string, string> }) {
  const cfg = RISK_CONFIG[warning.riskLevel];
  const plantName = plantNames[warning.plantId] ?? warning.plantId;

  return (
    <Alert className={`${cfg.bg} border`}>
      <div className="flex items-start gap-2">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <AlertTitle className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{warning.title}</span>
            <span className="text-xs font-normal text-muted-foreground">— {plantName}</span>
          </AlertTitle>
          <AlertDescription className="mt-1 space-y-1">
            <p className="text-sm">{warning.description}</p>
            <p className="text-sm font-medium">💡 {warning.recommendation}</p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
