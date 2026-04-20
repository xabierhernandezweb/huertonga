import { AppState, Plant, WeatherData } from './types';
import { INITIAL_PLANTS } from './constants';

const STORAGE_KEY = 'huertonga_state';
const SCHEMA_VERSION = 2; // v2: nuevas plantas 18-abr + categorías pimiento/lechuga/puerro/cebolla

function defaultState(): AppState {
  return {
    plants: INITIAL_PLANTS,
    lastWeatherFetch: null,
    weatherCache: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      // Schema outdated → reset con las plantas por defecto actualizadas
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPlants(): Plant[] {
  return loadAppState().plants;
}

export function savePlants(plants: Plant[]): void {
  const state = loadAppState();
  saveAppState({ ...state, plants });
}

export function getWeatherCache(): WeatherData | null {
  return loadAppState().weatherCache;
}

export function saveWeatherCache(weather: WeatherData): void {
  const state = loadAppState();
  saveAppState({ ...state, weatherCache: weather, lastWeatherFetch: weather.fetchedAt });
}
