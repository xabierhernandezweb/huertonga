'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plant } from '@/lib/types';
import { loadAppState, savePlants } from '@/lib/storage';
import { INITIAL_PLANTS } from '@/lib/constants';

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadAppState();
    setPlants(state.plants.length > 0 ? state.plants : INITIAL_PLANTS);
    setHydrated(true);
  }, []);

  const persist = useCallback((updated: Plant[]) => {
    setPlants(updated);
    savePlants(updated);
  }, []);

  const addPlant = useCallback(
    (plant: Plant) => {
      persist([...plants, plant]);
    },
    [plants, persist]
  );

  const updatePlant = useCallback(
    (updated: Plant) => {
      persist(plants.map((p) => (p.id === updated.id ? updated : p)));
    },
    [plants, persist]
  );

  const deletePlant = useCallback(
    (id: string) => {
      persist(plants.filter((p) => p.id !== id));
    },
    [plants, persist]
  );

  const updateHeight = useCallback(
    (id: string, heightCm: number) => {
      persist(
        plants.map((p) =>
          p.id === id ? { ...p, heightCm, updatedAt: new Date().toISOString() } : p
        )
      );
    },
    [plants, persist]
  );

  return { plants, hydrated, addPlant, updatePlant, deletePlant, updateHeight };
}
