'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '@/lib/types';
import { getWeatherCache, saveWeatherCache } from '@/lib/storage';
import { OPEN_METEO_URL } from '@/lib/constants';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(OPEN_METEO_URL);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const data: WeatherData = {
        fetchedAt: new Date().toISOString(),
        current: json.current,
        daily: json.daily,
      };
      saveWeatherCache(data);
      setWeather(data);
    } catch (err) {
      setError('No se pudo obtener el clima. Mostrando datos sin conexión.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getWeatherCache();
    if (cached) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        setWeather(cached);
        setIsLoading(false);
        return;
      }
    }
    fetchWeather();
  }, [fetchWeather]);

  return { weather, isLoading, error, refetch: fetchWeather };
}
