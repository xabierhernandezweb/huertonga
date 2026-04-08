import { addDays, format } from 'date-fns';
import { PlantCategory } from './types';
import { PLANT_CATALOG } from './constants';

export function computeHarvestWindow(
  plantedAt: string,
  category: PlantCategory,
  extraDaysMin = 0,
  extraDaysMax = 0
): { start: string; end: string } {
  const catalog = PLANT_CATALOG[category];
  const base = new Date(plantedAt);
  return {
    start: format(addDays(base, catalog.harvestDaysMin + extraDaysMin), 'yyyy-MM-dd'),
    end: format(addDays(base, catalog.harvestDaysMax + extraDaysMax), 'yyyy-MM-dd'),
  };
}

export function formatHarvestRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'No estimado';
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const s = new Date(start);
  const e = new Date(end);
  const sLabel = `${months[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
  const eLabel = `${months[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  if (sLabel === eLabel) return sLabel;
  return `${sLabel} – ${eLabel}`;
}
