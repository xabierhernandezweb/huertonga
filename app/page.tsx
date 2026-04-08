'use client';

import { usePlants } from '@/hooks/usePlants';
import { useWeather } from '@/hooks/useWeather';
import { useAlerts } from '@/hooks/useAlerts';
import { WeatherBanner } from '@/components/dashboard/WeatherBanner';
import { PlantGrid } from '@/components/dashboard/PlantGrid';

export default function HomePage() {
  const { plants, hydrated } = usePlants();
  const { weather, isLoading, error, refetch } = useWeather();
  const warnings = useAlerts(plants, weather);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <span className="animate-pulse text-2xl">🌱</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-400">Mi Huerto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Urretxu, Gipuzkoa · {plants.length} plantas · {warnings.length} alertas activas
        </p>
      </div>

      <WeatherBanner
        weather={weather}
        isLoading={isLoading}
        error={error}
        onRefetch={refetch}
      />

      <div className="mb-3">
        <h2 className="text-lg font-semibold text-green-900 dark:text-green-400">Tus plantas</h2>
      </div>
      <PlantGrid plants={plants} warnings={warnings} weather={weather} />
    </div>
  );
}
