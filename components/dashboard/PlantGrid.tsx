'use client';

import { Plant, Warning, WeatherData } from '@/lib/types';
import { PlantCard } from '@/components/plant/PlantCard';

interface Props {
  plants: Plant[];
  warnings: Warning[];
  weather: WeatherData | null;
}

export function PlantGrid({ plants, warnings, weather }: Props) {
  if (plants.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <span className="text-5xl block mb-4">🌱</span>
        <p className="text-lg font-medium">Tu huerto está vacío</p>
        <p className="text-sm mt-1">Añade tu primera planta para empezar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plants.map((plant) => {
        const plantWarnings = warnings.filter((w) => w.plantId === plant.id);
        return (
          <PlantCard
            key={plant.id}
            plant={plant}
            warnings={plantWarnings}
            weather={weather}
          />
        );
      })}
    </div>
  );
}
