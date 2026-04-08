'use client';

import { WeatherData } from '@/lib/types';
import { getWeatherInfo } from '@/lib/weather';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function WeatherBanner({ weather, isLoading, error, onRefetch }: Props) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-12 w-24 rounded-lg" />
            <div className="flex gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-14 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="mb-6 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <span className="text-sm text-orange-700 dark:text-orange-300">{error ?? 'No hay datos del clima'}</span>
          <Button variant="outline" size="sm" onClick={onRefetch} className="ml-auto">
            <RefreshCw className="h-4 w-4 mr-1" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = weather.current;
  const { label, icon } = getWeatherInfo(current.weathercode);

  return (
    <Card className="mb-6 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/60 dark:to-blue-950/60 border-sky-200 dark:border-sky-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Current conditions */}
          <div className="flex items-center gap-3 min-w-fit">
            <span className="text-4xl" title={label}>{icon}</span>
            <div>
              <div className="text-2xl font-bold text-sky-900 dark:text-sky-100">
                {current.temperature_2m.toFixed(1)}°C
              </div>
              <div className="text-xs text-sky-600 dark:text-sky-400">{label}</div>
              <div className="text-xs text-sky-500 dark:text-sky-500">Urretxu · {current.wind_speed_10m} km/h</div>
            </div>
          </div>

          <div className="w-px h-12 bg-sky-200 dark:bg-sky-800 hidden sm:block" />

          {/* 7-day forecast strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weather.daily.time.map((dateStr, i) => {
              const d = new Date(dateStr);
              const dayLabel = DAY_LABELS[d.getUTCDay()];
              const max = weather.daily.temperature_2m_max[i];
              const min = weather.daily.temperature_2m_min[i];
              const rain = weather.daily.precipitation_sum[i];
              const isToday = i === 0;

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[52px] text-center ${
                    isToday
                      ? 'bg-sky-200/70 dark:bg-sky-700/50 ring-1 ring-sky-300 dark:ring-sky-600'
                      : 'bg-white/60 dark:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                    {isToday ? 'Hoy' : dayLabel}
                  </span>
                  <span className="text-sm font-bold text-sky-900 dark:text-sky-100">{max?.toFixed(0)}°</span>
                  <span className="text-[10px] text-sky-500 dark:text-sky-400">{min?.toFixed(0)}°</span>
                  {rain > 0.5 && (
                    <span className="text-[10px] text-blue-500 dark:text-blue-400">💧{rain.toFixed(0)}mm</span>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefetch}
            title="Actualizar clima"
            className="ml-auto shrink-0 text-sky-600 dark:text-sky-400"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
