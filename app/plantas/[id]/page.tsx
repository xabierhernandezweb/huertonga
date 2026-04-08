'use client';

import { usePlants } from '@/hooks/usePlants';
import { useWeather } from '@/hooks/useWeather';
import { useAlerts } from '@/hooks/useAlerts';
import { PlantDetail } from '@/components/plant/PlantDetail';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default function PlantaDetallePage({ params }: Props) {
  const { id } = params;
  const { plants, hydrated, updateHeight, deletePlant } = usePlants();
  const { weather } = useWeather();
  const warnings = useAlerts(plants, weather);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="animate-pulse text-2xl">🌱</span>
      </div>
    );
  }

  const plant = plants.find((p) => p.id === id);

  if (!plant) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🌾</p>
        <p className="text-lg font-medium">Planta no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/">Volver al huerto</Link>
        </Button>
      </div>
    );
  }

  const plantWarnings = warnings.filter((w) => w.plantId === plant.id);

  return (
    <PlantDetail
      plant={plant}
      warnings={plantWarnings}
      weather={weather}
      onUpdateHeight={updateHeight}
      onDelete={deletePlant}
    />
  );
}
