import { Plant, WateringRecommendation, WeatherData } from './types';
import { PLANT_CATALOG } from './constants';

type Condition = 'dry' | 'normal' | 'wet';

function getCondition(weather: WeatherData | null): Condition {
  if (!weather) return 'normal';
  const avg = weather.daily.precipitation_sum.reduce((a, b) => a + b, 0) / weather.daily.precipitation_sum.length;
  if (avg < 2) return 'dry';
  if (avg > 8) return 'wet';
  return 'normal';
}

export function getWateringRecommendation(
  plant: Plant,
  weather: WeatherData | null
): WateringRecommendation {
  const catalog = PLANT_CATALOG[plant.category];
  const condition = getCondition(weather);
  let frequencyDays = catalog.wateringFrequencyDays[condition];

  const claySoil = plant.soilType === 'jardin_arcilloso' || plant.soilType === 'mixto';
  if (claySoil) frequencyDays += 1;

  const notes = buildNotes(plant, weather, condition, claySoil);
  const reducedDueToRain = checkRainTomorrow(weather);

  return {
    plantId: plant.id,
    frequencyDays,
    amountMl: estimateAmount(plant.category),
    notes,
    reducedDueToRain,
  };
}

function checkRainTomorrow(weather: WeatherData | null): boolean {
  if (!weather) return false;
  return (weather.daily.precipitation_sum[1] ?? 0) > 5;
}

function estimateAmount(category: string): number | null {
  const map: Record<string, number> = {
    tomate: 500,
    fresa: 300,
    ajo: 200,
    acelga: 400,
    zanahoria: 350,
    perejil: 250,
  };
  return map[category] ?? null;
}

function buildNotes(
  plant: Plant,
  weather: WeatherData | null,
  condition: Condition,
  claySoil: boolean
): string {
  const parts: string[] = [];

  if (condition === 'dry') parts.push('Semana seca — riega con más frecuencia.');
  if (condition === 'wet') parts.push('Semana lluviosa — reduce o suspende el riego.');

  if (claySoil) {
    parts.push('Suelo arcilloso: espera a que la superficie (2-3cm) esté seca antes de regar. El encharcamiento pudre las raíces.');
  }

  if (plant.category === 'tomate') {
    parts.push('Riega en la base, evita mojar las hojas. El riego irregular causa agrietado del fruto.');
  }

  if (plant.category === 'zanahoria') {
    parts.push('Mantén humedad constante para evitar raíces bifurcadas, pero sin encharcar.');
  }

  if (plant.category === 'perejil') {
    parts.push('Mantén el suelo ligeramente húmedo durante la germinación (puede tardar 3-4 semanas).');
  }

  if (plant.origin === 'siembra_directa' && !plant.heightCm) {
    parts.push('Mientras germina, riega suave y con frecuencia para mantener la superficie húmeda.');
  }

  if (checkRainTomorrow(weather)) {
    parts.push('💧 Lluvia prevista mañana — puedes omitir el riego hoy.');
  }

  return parts.join(' ');
}
