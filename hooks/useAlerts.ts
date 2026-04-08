'use client';

import { useMemo } from 'react';
import { Plant, Warning, WeatherData } from '@/lib/types';
import { generateAlerts } from '@/lib/alerts';

export function useAlerts(plants: Plant[], weather: WeatherData | null): Warning[] {
  return useMemo(() => generateAlerts(plants, weather), [plants, weather]);
}
