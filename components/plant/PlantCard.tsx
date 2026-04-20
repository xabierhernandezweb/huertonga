'use client';

import Link from 'next/link';
import { Plant, Warning, RiskLevel } from '@/lib/types';
import { PLANT_CATALOG } from '@/lib/constants';
import { formatHarvestRange } from '@/lib/harvest';
import { getWateringRecommendation } from '@/lib/watering';
import { WeatherData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Droplets, Calendar, Sprout, AlertTriangle } from 'lucide-react';

interface Props {
  plant: Plant;
  warnings: Warning[];
  weather: WeatherData | null;
}

const RISK_BADGE: Record<RiskLevel, { label: string; className: string }> = {
  alto: { label: 'Alerta alta', className: 'bg-red-100 text-red-700 border-red-300' },
  medio: { label: 'Atención', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  bajo: { label: 'Aviso', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ok: { label: 'OK', className: 'bg-green-100 text-green-700 border-green-200' },
};

const ORIGIN_LABEL: Record<string, string> = {
  comprada: 'Comprada',
  autogerminated: 'Autogerm.',
  siembra_directa: 'Siembra directa',
};

export function PlantCard({ plant, warnings, weather }: Props) {
  const catalog = PLANT_CATALOG[plant.category];
  const topRisk: RiskLevel = warnings.length > 0 ? warnings[0].riskLevel : 'ok';
  const riskCfg = RISK_BADGE[topRisk];
  const watering = getWateringRecommendation(plant, weather);
  const harvestLabel = formatHarvestRange(plant.harvestWindowStart, plant.harvestWindowEnd);
  const topWarnings = warnings.slice(0, 2);

  return (
    <TooltipProvider>
      <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0" title={catalog.displayName}>{catalog.icon}</span>
              <div className="min-w-0">
                <CardTitle className="text-base leading-tight truncate">{plant.name}</CardTitle>
                {plant.quantity && plant.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">{plant.quantity} plantas</p>
                )}
              </div>
            </div>
            {warnings.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`shrink-0 text-xs ${riskCfg.className}`}>
                    {riskCfg.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-semibold">{warnings[0].title}</p>
                  <p className="text-xs mt-0.5">{warnings[0].description}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Badge variant="outline" className={`shrink-0 text-xs ${riskCfg.className}`}>OK</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">{ORIGIN_LABEL[plant.origin]}</Badge>
            <Badge variant="secondary" className="text-xs">Bancal {plant.bedNumber}</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 pt-0">
          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <Sprout className="h-4 w-4 text-green-600 shrink-0" />
            {plant.heightCm != null ? (
              <span>{plant.heightCm} cm de altura</span>
            ) : (
              <span className="text-muted-foreground">Germinando...</span>
            )}
          </div>

          {/* Harvest */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
            <span>Cosecha: <span className="font-medium">{harvestLabel}</span></span>
          </div>

          {/* Watering */}
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
            <span>
              Riego cada <span className="font-medium">{watering.frequencyDays} días</span>
              {watering.reducedDueToRain && <span className="text-blue-500 ml-1">(lluvia prevista)</span>}
            </span>
          </div>

          {/* Top warnings inline */}
          {topWarnings.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                {topWarnings.map((w) => (
                  <div key={w.id} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                    <span className="leading-tight">{w.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/plantas/${plant.id}`}>Ver detalle</Link>
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
