export type PlantCategory =
  | 'tomate'
  | 'fresa'
  | 'ajo'
  | 'acelga'
  | 'zanahoria'
  | 'perejil'
  | 'otro';

export type PlantOrigin = 'comprada' | 'autogerminated' | 'siembra_directa';

export type SoilType = 'jardin_arcilloso' | 'sustrato' | 'arena' | 'mixto';

export type RiskLevel = 'alto' | 'medio' | 'bajo' | 'ok';

export type AlertType =
  | 'frost_risk'
  | 'overwatering_clay'
  | 'late_planting'
  | 'germination_risk'
  | 'soil_compaction'
  | 'drought_stress'
  | 'rain_excess'
  | 'heat_stress'
  | 'fungal_risk'
  | 'bolting_risk'
  | 'flower_drop'
  | 'fruit_split'
  | 'staking_needed'
  | 'slug_risk'
  | 'wind_damage'
  | 'bulb_rot';

export interface Plant {
  id: string;
  name: string;
  category: PlantCategory;
  origin: PlantOrigin;
  plantedAt: string; // ISO 8601 date
  heightCm: number | null;
  bedNumber: 1 | 2 | 3 | 4;
  soilType: SoilType;
  notes: string;
  harvestWindowStart: string | null;
  harvestWindowEnd: string | null;
  updatedAt: string;
}

export interface Warning {
  id: string;
  plantId: string;
  alertType: AlertType;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  triggeredBy: 'static' | 'weather';
  expiresAt: string | null;
}

export interface WeatherData {
  fetchedAt: string;
  current: {
    time: string;
    temperature_2m: number;
    weathercode: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

export interface WateringRecommendation {
  plantId: string;
  frequencyDays: number;
  amountMl: number | null;
  notes: string;
  reducedDueToRain: boolean;
}

export interface AppState {
  plants: Plant[];
  lastWeatherFetch: string | null;
  weatherCache: WeatherData | null;
  schemaVersion: number;
}

export interface PlantCatalogEntry {
  category: PlantCategory;
  displayName: string;
  icon: string;
  harvestDaysMin: number;
  harvestDaysMax: number;
  frostSensitive: boolean;
  minGerminationTempC: number | null;
  wateringFrequencyDays: { dry: number; normal: number; wet: number };
  claySoilNotes: string | null;
}
