import { Plant, Warning, WeatherData, RiskLevel, AlertType } from './types';
import { isSnowOrFreezeCode } from './weather';
import { isBefore, differenceInDays, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let alertCounter = 0;
function makeId() {
  return `alert-${++alertCounter}-${Date.now()}`;
}

function w(
  plantId: string,
  alertType: AlertType,
  riskLevel: RiskLevel,
  title: string,
  description: string,
  recommendation: string,
  triggeredBy: 'static' | 'weather' = 'static'
): Warning {
  return { id: makeId(), plantId, alertType, riskLevel, title, description, recommendation, triggeredBy, expiresAt: null };
}

function avgTemp(weather: WeatherData) {
  const arr = weather.daily.temperature_2m_max;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function maxTemp(weather: WeatherData) {
  return Math.max(...weather.daily.temperature_2m_max);
}

function minTemp(weather: WeatherData) {
  return Math.min(...weather.daily.temperature_2m_min);
}

function totalRain(weather: WeatherData) {
  return weather.daily.precipitation_sum.reduce((a, b) => a + b, 0);
}

function maxDailyRain(weather: WeatherData) {
  return Math.max(...weather.daily.precipitation_sum);
}

function maxWind(weather: WeatherData) {
  return Math.max(...(weather.daily.wind_speed_10m_max ?? [0]));
}

/** Detecta lluvia muy irregular: días secos alternando con días lluviosos */
function isIrregularRain(weather: WeatherData): boolean {
  const rain = weather.daily.precipitation_sum;
  let swings = 0;
  for (let i = 1; i < rain.length; i++) {
    if ((rain[i - 1] < 2 && rain[i] > 10) || (rain[i - 1] > 10 && rain[i] < 2)) swings++;
  }
  return swings >= 2;
}

const FROST_SAFE_DATE = new Date('2026-05-15');
const today = () => new Date();

// ---------------------------------------------------------------------------
// SHARED: nieve/granizo en curso
// ---------------------------------------------------------------------------

function checkSnow(plant: Plant, weather: WeatherData): Warning[] {
  if (!isSnowOrFreezeCode(weather.current.weathercode)) return [];
  return [
    w(plant.id, 'frost_risk', 'alto',
      'Nevada o granizo en curso',
      'Se están produciendo precipitaciones de nieve o granizo en Urretxu.',
      'Cubre o protege todas las plantas inmediatamente.',
      'weather'),
  ];
}

// ---------------------------------------------------------------------------
// SHARED: viento fuerte
// ---------------------------------------------------------------------------

function checkWind(plant: Plant, weather: WeatherData): Warning[] {
  const wind = maxWind(weather);
  if (wind < 45) return [];
  // Solo plantas jóvenes o sensibles
  const isSmall = (plant.heightCm ?? 0) < 25 || plant.origin === 'siembra_directa';
  if (!isSmall) return [];
  return [
    w(plant.id, 'wind_damage', 'medio',
      `Viento fuerte previsto (${wind.toFixed(0)} km/h)`,
      `Rachas de hasta ${wind.toFixed(0)} km/h pueden romper o doblar plantas jóvenes o recién germinadas.`,
      'Coloca tutores o protectores antivienta. Si la planta es muy pequeña, cúbrela temporalmente.',
      'weather'),
  ];
}

// ---------------------------------------------------------------------------
// 🍅 TOMATE
// ---------------------------------------------------------------------------

function alertsTomate(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];
  const t = today();

  // --- Estáticas ---

  // Riesgo helada por temporada (hasta 15 mayo)
  if (isBefore(t, FROST_SAFE_DATE)) {
    if (plant.origin === 'autogerminated' && (plant.heightCm ?? 0) < 10) {
      alerts.push(w(plant.id, 'frost_risk', 'alto',
        'Plántula muy pequeña — riesgo de helada',
        'Con solo 4 cm el tomate germinado tiene nula resistencia al frío. En Urretxu puede helar hasta mediados de mayo.',
        'No la dejes al exterior en noches frías (< 5 °C). Usa túnel de plástico o llévala dentro.'));
    } else {
      alerts.push(w(plant.id, 'frost_risk', 'medio',
        'Riesgo de helada hasta mediados de mayo',
        'Los tomates no toleran las heladas. En el clima oceánico de Urretxu el riesgo persiste hasta el 15 de mayo.',
        'Cubre con agrofilm o vellón en noches frías. Retira la cubierta durante el día para favorecer la polinización.'));
    }
  }

  // Tutoraje necesario
  if ((plant.heightCm ?? 0) > 30) {
    alerts.push(w(plant.id, 'staking_needed', 'medio',
      'Tutoraje necesario',
      `Con ${plant.heightCm} cm la planta ya necesita soporte. Sin tutor el tallo puede doblarse o romperse con el viento.`,
      'Coloca una estaca o red de tutoraje. Ata el tallo con cuerda de rafia dejando algo de holgura.'));
  }

  if (!weather) return alerts;

  // --- Dinámicas ---

  const tMin = minTemp(weather);
  const tMax = maxTemp(weather);
  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);

  // Helada real prevista
  if (tMin <= 0) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      `Helada prevista (${tMin.toFixed(1)} °C)`,
      `Se prevén temperaturas bajo cero en Urretxu. El tomate muere con heladas.`,
      'Lleva la planta al interior o protégela con doble capa de agrofilm antes de la noche.',
      'weather'));
  } else if (tMin <= 2 && isBefore(t, FROST_SAFE_DATE)) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      `Temperatura nocturna muy baja (${tMin.toFixed(1)} °C)`,
      'Temperaturas tan cercanas a 0 °C dañan los tejidos tiernos del tomate.',
      'Protege con agrofilm durante la noche. Retira al amanecer.',
      'weather'));
  }

  // Calor extremo → caída de flores
  if (tMax > 32) {
    alerts.push(w(plant.id, 'flower_drop', 'medio',
      `Calor extremo — riesgo de caída de flores (${tMax.toFixed(0)} °C)`,
      'Por encima de 32 °C el tomate deja de cuajar: el polen pierde viabilidad y las flores abortan.',
      'Riega más frecuente (mañana y tarde). Sombrea parcialmente al mediodía. Mulching para mantener la humedad del suelo.',
      'weather'));
  }

  // Temperatura nocturna fría en verano → mal cuaje
  if (!isBefore(t, FROST_SAFE_DATE) && tMin < 10) {
    alerts.push(w(plant.id, 'flower_drop', 'bajo',
      `Noches frías — polinización afectada (mín. ${tMin.toFixed(1)} °C)`,
      'Con temperaturas nocturnas < 10 °C el cuaje se reduce significativamente.',
      'Cubre con agrofilm por las noches hasta que las mínimas suban.',
      'weather'));
  }

  // Lluvia intensa → hongos
  if (maxRain > 10 || (rain > 30 && avgTemp(weather) > 15)) {
    alerts.push(w(plant.id, 'fungal_risk', 'medio',
      'Riesgo de mildiu / botrytis',
      `La combinación de lluvia (${rain.toFixed(0)} mm / 7 días) y temperatura favorece el mildiu y el tizón en tomate.`,
      'Revisa las hojas inferiores. Aplica cobre o fungicida preventivo. Evita mojar el follaje al regar.',
      'weather'));
  }

  alerts.push(...checkWind(plant, weather));
  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🍓 FRESA
// ---------------------------------------------------------------------------

function alertsFresa(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Suelo arcilloso → riesgo pudrición raíz
  if (plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'overwatering_clay', 'bajo',
      'Suelo arcilloso — riesgo de pudrición de raíz',
      'Las fresas en suelo arcilloso son muy sensibles al encharcamiento. El exceso de agua pudre las raíces y el cuello de la planta.',
      'Planta en ligero montículo elevado. Espera a que la superficie se seque entre riegos. Añade perlita si el drenaje es lento.'));
  }

  if (!weather) return alerts;

  const tMin = minTemp(weather);
  const tMax = maxTemp(weather);
  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);

  // Helada leve → daño en flores (fresa aguanta la planta pero no las flores)
  if (tMin < -1) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      `Helada prevista — flores en riesgo (${tMin.toFixed(1)} °C)`,
      'La fresa aguanta el frío pero sus flores mueren a partir de -1 °C, perdiendo toda la cosecha de esa flor.',
      'Cubre con vellón vegetal las noches de helada. Retira al amanecer para que los insectos puedan polinizar.',
      'weather'));
  } else if (tMin < 2) {
    alerts.push(w(plant.id, 'frost_risk', 'medio',
      `Temperatura muy baja — flores en riesgo (${tMin.toFixed(1)} °C)`,
      'Las flores de fresa son sensibles al frío extremo. Una helada tardía puede eliminar toda la cosecha.',
      'Cubre con vellón en las noches más frías como precaución.',
      'weather'));
  }

  // Calor + lluvia → botrytis (moho gris)
  if (maxRain > 5 && avgTemp(weather) > 15) {
    alerts.push(w(plant.id, 'fungal_risk', 'medio',
      'Riesgo de botrytis (moho gris)',
      `Lluvia de ${rain.toFixed(0)} mm con temperaturas de ${avgTemp(weather).toFixed(0)} °C crea condiciones ideales para el moho gris, la enfermedad más grave de la fresa.`,
      'Revisa los frutos diariamente. Retira cualquier fruto podrido inmediatamente. Evita mojar las flores y frutos al regar. Ventila bien el bancal.',
      'weather'));
  }

  // Calor extremo → reduce fructificación
  if (tMax > 28) {
    alerts.push(w(plant.id, 'heat_stress', 'bajo',
      `Calor elevado — fructificación reducida (${tMax.toFixed(0)} °C)`,
      'Por encima de 28 °C las fresas reducen la fructificación y los frutos maduran demasiado rápido, perdiendo sabor.',
      'Riega en las horas más frescas. Aplica mulching para mantener el suelo fresco. Cosecha seguido para evitar sobremaduración.',
      'weather'));
  }

  alerts.push(...checkWind(plant, weather));
  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🧄 AJO
// ---------------------------------------------------------------------------

function alertsAjo(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Siembra tardía (siempre activa)
  alerts.push(w(plant.id, 'late_planting', 'medio',
    'Siembra tardía — bulbos más pequeños',
    'El ajo se planta entre noviembre y febrero. Plantado en abril el bulbo tendrá menos tiempo de desarrollo y será más pequeño.',
    'Riega regularmente y mantén el suelo sin malas hierbas. Cosecha cuando 3-4 hojas basales estén secas (previsiblemente julio-agosto 2026).'));

  if (!weather) return alerts;

  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);
  const tMax = maxTemp(weather);

  // Lluvia excesiva → pudrición del bulbo
  if (maxRain > 15 || rain > 50) {
    alerts.push(w(plant.id, 'bulb_rot', 'alto',
      `Riesgo de pudrición del bulbo (${rain.toFixed(0)} mm / 7 días)`,
      'El ajo es muy sensible al exceso de humedad. Con tanta lluvia el bulbo puede pudrirse por hongos del suelo (Fusarium, Sclerotium).',
      'Suspende completamente el riego. Asegúrate de que el bancal drena bien. Si el suelo se encharca, haz un pequeño surco de drenaje lateral.',
      'weather'));
  }

  // Calor elevado sostenido → entrada en dormancia prematura
  if (tMax > 26) {
    alerts.push(w(plant.id, 'heat_stress', 'medio',
      `Calor elevado — desarrollo del bulbo afectado (${tMax.toFixed(0)} °C)`,
      'Con más de 26 °C el ajo puede entrar en dormancia antes de completar el desarrollo del bulbo. Resultado: bulbos pequeños y mal formados.',
      'Mantén el suelo fresco con mulching. Riega por la mañana temprano para compensar la evapotranspiración.',
      'weather'));
  }

  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🥬 ACELGA
// ---------------------------------------------------------------------------

function alertsAcelga(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Suelo arcilloso genérico
  if (plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'overwatering_clay', 'bajo',
      'Suelo arcilloso — mantén buen drenaje',
      'La acelga tolera bien el suelo pesado pero el encharcamiento prolongado pudre el cuello de la planta.',
      'Riega cuando la superficie esté seca. Si llueve mucho, no riegues durante días.'));
  }

  if (!weather) return alerts;

  const tMax = maxTemp(weather);
  const rain = totalRain(weather);

  // Calor extremo → espigado (bolting)
  if (tMax > 30) {
    alerts.push(w(plant.id, 'bolting_risk', 'medio',
      `Riesgo de espigado por calor (${tMax.toFixed(0)} °C)`,
      'Por encima de 28-30 °C sostenidos la acelga puede espigar (subir a flor). Las hojas se vuelven duras y amargas y la planta deja de ser comestible.',
      'Cosecha hojas exteriores con frecuencia para retrasar el espigado. Riega abundantemente para mantener la temperatura del suelo baja. Sombrea parcialmente al mediodía.',
      'weather'));
  }

  // Lluvia intensa continua → babosas
  if (rain > 40) {
    alerts.push(w(plant.id, 'slug_risk', 'bajo',
      `Alta humedad — riesgo de babosas (${rain.toFixed(0)} mm / 7 días)`,
      'Las semanas muy lluviosas disparan la población de babosas y caracoles, que devoran las hojas de acelga de noche.',
      'Revisa las plantas al amanecer. Coloca trampas de cerveza o barrera de ceniza seca alrededor del bancal. El ferramol es eficaz y seguro en huertos.',
      'weather'));
  }

  // Sequía + calor → estrés hídrico
  if (rain < 5 && tMax > 20) {
    alerts.push(w(plant.id, 'drought_stress', 'bajo',
      'Poca lluvia — riego necesario para hojas tiernas',
      'La acelga necesita humedad constante para producir hojas grandes y tiernas. La sequía provoca hojas pequeñas, duras y amargas.',
      'Riega cada 2-3 días. El mulching con paja mantiene la humedad y reduce la temperatura del suelo.',
      'weather'));
  }

  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🥕 ZANAHORIA
// ---------------------------------------------------------------------------

function alertsZanahoria(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Suelo arcilloso → deformación (siempre activa)
  if (plant.soilType === 'jardin_arcilloso' || plant.soilType === 'mixto') {
    alerts.push(w(plant.id, 'soil_compaction', 'medio',
      'Suelo arcilloso — riesgo de raíces deformadas',
      'La zanahoria necesita suelo suelto y profundo. En arcilla el suelo resiste el crecimiento de la raíz y se bifurca o retuerce.',
      'Afloja el suelo al menos 30 cm de profundidad con bidente. Incorpora arena gruesa o compost. Es lo más importante que puedes hacer por esta planta.'));
  }

  if (!weather) return alerts;

  const tMax = maxTemp(weather);
  const rain = totalRain(weather);

  // Lluvia irregular → rajado de raíces
  if (isIrregularRain(weather)) {
    alerts.push(w(plant.id, 'fruit_split', 'medio',
      'Riego irregular — riesgo de rajado de raíces',
      'Los ciclos de sequía seguidos de lluvia intensa provocan que la raíz de la zanahoria se raje al absorber agua de golpe.',
      'Mantén la humedad del suelo lo más constante posible. Riega un poco cada 2-3 días en lugar de mucho de vez en cuando.',
      'weather'));
  }

  // Calor → raíces fibrosas
  if (tMax > 28) {
    alerts.push(w(plant.id, 'heat_stress', 'medio',
      `Calor elevado — raíces fibrosas y amargas (${tMax.toFixed(0)} °C)`,
      'Por encima de 28 °C las zanahorias desarrollan raíces fibrosas, leñosas y con sabor amargo. La calidad de la cosecha se reduce.',
      'Riega por la mañana. Aplica mulching grueso (paja) para mantener el suelo fresco. Cosecha antes si el calor persiste.',
      'weather'));
  }

  // Sequía en germinación
  if (plant.heightCm === null && rain < 5) {
    alerts.push(w(plant.id, 'germination_risk', 'medio',
      'Semilla en germinación — necesita humedad constante',
      'La zanahoria tarda 2-3 semanas en germinar y la semilla es muy sensible a la sequía superficial. Si la capa de tierra se seca, la semilla muere.',
      'Riega suave y frecuente (cada 1-2 días) solo la capa superficial. Cubre con una tela de sombreo o una tabla hasta que asomen los brotes.',
      'weather'));
  }

  alerts.push(...checkWind(plant, weather));
  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🌿 PEREJIL
// ---------------------------------------------------------------------------

function alertsPerejil(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Germinación lenta (aviso informativo siempre que no haya brotado)
  if (plant.heightCm === null) {
    const daysSincePlanting = differenceInDays(today(), parseISO(plant.plantedAt));
    if (daysSincePlanting < 28) {
      alerts.push(w(plant.id, 'germination_risk', 'bajo',
        'Germinación lenta — es normal',
        `El perejil tarda entre 2 y 4 semanas en germinar. Han pasado ${daysSincePlanting} días desde la siembra, sigue siendo normal no ver brotes todavía.`,
        'Mantén el suelo ligeramente húmedo. No lo encharcues. No te preocupes si no ves nada en las primeras 3 semanas.'));
    } else if (daysSincePlanting >= 28) {
      alerts.push(w(plant.id, 'germination_risk', 'medio',
        'Sin germinación tras 4 semanas',
        `Han pasado ${daysSincePlanting} días y no hay brotes registrados. Puede que la semilla no haya germinado.`,
        'Rasca suavemente la superficie. Si no hay señal de vida, considera resembrar. Asegúrate de que el suelo no se ha secado del todo.'));
    }
  }

  if (!weather) return alerts;

  const tMax = maxTemp(weather);
  const rain = totalRain(weather);

  // Calor → espigado
  if (tMax > 28) {
    alerts.push(w(plant.id, 'bolting_risk', 'bajo',
      `Calor — posible espigado (${tMax.toFixed(0)} °C)`,
      'El perejil puede subir a flor con el calor, especialmente si el suelo se seca. Al espigar las hojas se reducen y pierden aroma.',
      'Riega con frecuencia. Corta el tallo floral en cuanto aparezca para prolongar la producción de hojas.',
      'weather'));
  }

  // Sequía en germinación
  if (plant.heightCm === null && rain < 5) {
    alerts.push(w(plant.id, 'germination_risk', 'medio',
      'Sequía durante germinación — riego urgente',
      'La semilla de perejil necesita que la capa superficial se mantenga húmeda para germinar. Con esta sequía la semilla puede morir.',
      'Riega suavemente la superficie cada día o cada dos días. Usa una regadera de roseta fina para no desenterrar la semilla.',
      'weather'));
  }

  // Lluvia continua → babosas
  if (rain > 40) {
    alerts.push(w(plant.id, 'slug_risk', 'bajo',
      `Lluvia continua — riesgo de babosas (${rain.toFixed(0)} mm / 7 días)`,
      'Con tanta humedad las babosas son una amenaza real para las plántulas de perejil recién brotadas.',
      'Revisa al amanecer. Coloca barrera de ceniza seca o ferramol granulado alrededor del bancal.',
      'weather'));
  }

  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🫑 PIMIENTO
// ---------------------------------------------------------------------------

function alertsPimiento(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];
  const t = today();

  // Riesgo helada hasta 15 mayo (igual de sensible que el tomate)
  if (isBefore(t, FROST_SAFE_DATE)) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      'Riesgo de helada hasta mediados de mayo',
      'El pimiento es tan sensible a las heladas como el tomate. Una noche bajo 0 °C mata la planta. En Urretxu el riesgo persiste hasta el 15 de mayo.',
      'Cubre con agrofilm o vellón en noches frías (< 5 °C). Retira durante el día para que reciba sol y se airee.'));
  }

  // Tutoraje cuando supera cierta altura
  if ((plant.heightCm ?? 0) > 35) {
    alerts.push(w(plant.id, 'staking_needed', 'bajo',
      'Tutoraje recomendado',
      `Con ${plant.heightCm} cm el pimiento puede doblarse con el viento o el peso de los frutos.`,
      'Coloca una estaca o anillo de soporte. Los pimientos de Gernika especialmente tienden a abrirse hacia los lados.'));
  }

  if (!weather) return alerts;

  const tMin = minTemp(weather);
  const tMax = maxTemp(weather);
  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);

  // Helada real prevista
  if (tMin <= 0) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      `Helada prevista (${tMin.toFixed(1)} °C)`,
      'Temperatura bajo cero prevista. El pimiento muere irremediablemente con heladas.',
      'Lleva la planta al interior o cúbrela con doble capa de agrofilm antes de la noche.',
      'weather'));
  } else if (tMin <= 3 && isBefore(t, FROST_SAFE_DATE)) {
    alerts.push(w(plant.id, 'frost_risk', 'alto',
      `Temperatura nocturna muy baja (${tMin.toFixed(1)} °C)`,
      'Temperaturas tan próximas a 0 °C dañan los tejidos del pimiento, especialmente flores y puntos de crecimiento.',
      'Protege con agrofilm o vellón durante la noche.',
      'weather'));
  }

  // Calor elevado → caída de flores
  if (tMax > 35) {
    alerts.push(w(plant.id, 'flower_drop', 'medio',
      `Calor extremo — caída de flores (${tMax.toFixed(0)} °C)`,
      'Por encima de 35 °C el pimiento deja de cuajar: las flores abortan y el fruto no se forma.',
      'Riega abundantemente. Sombrea al mediodía. El pimiento de Gernika es especialmente sensible al calor extremo.',
      'weather'));
  }

  // Frío nocturno en verano → mal cuaje
  if (!isBefore(t, FROST_SAFE_DATE) && tMin < 12) {
    alerts.push(w(plant.id, 'flower_drop', 'bajo',
      `Noches frescas — cuaje reducido (${tMin.toFixed(1)} °C)`,
      'El pimiento necesita noches de al menos 15 °C para cuajar bien. Por debajo de 12 °C el cuaje se reduce notablemente.',
      'Si las noches son frías de forma prolongada, cubre con agrofilm por la noche para mantener el calor acumulado.',
      'weather'));
  }

  // Lluvia excesiva → hongos
  if (maxRain > 10 || rain > 35) {
    alerts.push(w(plant.id, 'fungal_risk', 'medio',
      'Humedad elevada — riesgo de botrytis y podredumbre',
      `Con ${rain.toFixed(0)} mm en 7 días y temperaturas suaves, el pimiento puede desarrollar botrytis (podredumbre gris) en flores y frutos.`,
      'Revisa flores y frutos. Retira cualquier parte afectada. Evita mojar el follaje al regar. Buena ventilación entre plantas.',
      'weather'));
  }

  // Encharcamiento con suelo arcilloso
  if (maxRain > 15 && plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'overwatering_clay', 'medio',
      `Lluvia intensa — riesgo de asfixia radicular (${maxRain.toFixed(0)} mm / día)`,
      'El pimiento es muy sensible a la asfixia radicular. El suelo arcilloso empapado puede matar la planta en 24-48h.',
      'Comprueba que el bancal drena correctamente. Si el agua se estanca más de 1 hora, haz un surco de drenaje lateral.',
      'weather'));
  }

  alerts.push(...checkWind(plant, weather));
  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🥗 LECHUGA
// ---------------------------------------------------------------------------

function alertsLechuga(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  if (!weather) return alerts;

  const tMax = maxTemp(weather);
  const tMin = minTemp(weather);
  const rain = totalRain(weather);

  // Espigado por calor (umbral más bajo que acelga)
  if (tMax > 23) {
    const level = tMax > 28 ? 'alto' : 'medio';
    alerts.push(w(plant.id, 'bolting_risk', level,
      `Riesgo de espigado por calor (${tMax.toFixed(0)} °C)`,
      `La lechuga espiga (sube a flor) con temperaturas por encima de 22-24 °C sostenidas, especialmente si el suelo se seca. Las hojas se vuelven amargas e inconsumibles.`,
      'Cosecha las lechugas más desarrolladas antes de que espiguen. Riega frecuentemente para mantener el suelo fresco. Sombrea con malla al mediodía si el calor persiste.',
      'weather'));
  }

  // Helada: la lechuga aguanta heladas suaves pero no intensas
  if (tMin < -3) {
    alerts.push(w(plant.id, 'frost_risk', 'medio',
      `Helada intensa — lechuga en riesgo (${tMin.toFixed(1)} °C)`,
      'La lechuga tolera heladas suaves (-1, -2 °C) pero por debajo de -3 °C las hojas se queman y la planta puede morir.',
      'Cubre con vellón o agrofilm en las noches más frías. Retira durante el día.',
      'weather'));
  }

  // Lluvia continua → babosas (gran amenaza para lechuga)
  if (rain > 30) {
    alerts.push(w(plant.id, 'slug_risk', 'medio',
      `Lluvia continua — babosas (${rain.toFixed(0)} mm / 7 días)`,
      'Las babosas son el enemigo número uno de la lechuga, especialmente con plantas pequeñas. Atacan de noche y pueden devorar una planta entera en pocas horas.',
      'Revisa al amanecer. Coloca ferramol granulado alrededor del bancal. Una barrera de ceniza seca o cáscaras de huevo también ayuda si no llueve.',
      'weather'));
  }

  // Sequía → estrés hídrico rápido (planta pequeña con raíz superficial)
  if (rain < 3 && tMax > 18) {
    alerts.push(w(plant.id, 'drought_stress', 'medio',
      'Sin lluvia — la lechuga necesita riego frecuente',
      'La lechuga tiene raíces superficiales y se estrés rápidamente sin agua, lo que acelera el espigado.',
      'Riega cada 1-2 días. Aplica mulching de paja para mantener la humedad del suelo.',
      'weather'));
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// 🌱 PUERRO
// ---------------------------------------------------------------------------

function alertsPuerro(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Suelo arcilloso: en realidad el puerro lo tolera, aviso informativo
  if (plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'overwatering_clay', 'bajo',
      'Suelo arcilloso — aporcar para blanquear',
      'El puerro tolera bien el suelo pesado, pero recuerda aporcar (cubrir con tierra el tallo blanco) a medida que crece para obtener más parte comestible.',
      'Aporcar cada 2-3 semanas añadiendo tierra alrededor del tallo. El puerro agradece un riego regular pero no el encharcamiento.'));
  }

  if (!weather) return alerts;

  const rain = totalRain(weather);
  const tMax = maxTemp(weather);

  // Lluvia excesiva + calor → roya del puerro
  if (rain > 40 && tMax > 16) {
    alerts.push(w(plant.id, 'fungal_risk', 'medio',
      'Humedad + calor — riesgo de roya del puerro',
      `Con ${rain.toFixed(0)} mm de lluvia y temperaturas de ${tMax.toFixed(0)} °C aparecen manchas anaranjadas en las hojas (roya). No destruye la planta pero reduce la cosecha.`,
      'Revisa las hojas. Si ves manchas anaranjadas, retira las hojas afectadas. Evita mojar el follaje al regar. Buena separación entre plantas para ventilar.',
      'weather'));
  }

  // Sequía en verano → crecimiento lento
  if (rain < 3 && tMax > 20) {
    alerts.push(w(plant.id, 'drought_stress', 'bajo',
      'Poca lluvia — riego necesario para el desarrollo',
      'El puerro en su fase de engorde necesita humedad constante. La sequía ralentiza el crecimiento y reduce el tamaño del tallo.',
      'Riega cada 3-4 días. El mulching ayuda mucho a conservar la humedad en verano.',
      'weather'));
  }

  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// 🧅 CEBOLLA
// ---------------------------------------------------------------------------

function alertsCebolla(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  // Suelo arcilloso → riesgo pudrición bulbo
  if (plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'bulb_rot', 'medio',
      'Suelo arcilloso — riesgo de pudrición del bulbo',
      'La cebolla es muy sensible al exceso de humedad en el suelo. La arcilla retiene agua y puede provocar la pudrición del bulbo por hongos (Fusarium, Botrytis).',
      'Asegura buen drenaje. Incorpora arena gruesa o perlita. No riegues en exceso, especialmente en la fase de bulbificación (julio).'));
  }

  if (!weather) return alerts;

  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);
  const tMax = maxTemp(weather);

  // Lluvia excesiva → pudrición del bulbo
  if (maxRain > 15 || rain > 50) {
    alerts.push(w(plant.id, 'bulb_rot', 'alto',
      `Lluvia excesiva — riesgo de pudrición del bulbo (${rain.toFixed(0)} mm / 7 días)`,
      'El exceso de agua es el mayor peligro para la cebolla. Con suelo arcilloso empapado el bulbo puede pudrirse en pocos días.',
      'Suspende el riego completamente. Si el bancal se encharca, crea un surco de drenaje. Revisa que el cuello de la planta no esté en contacto con suelo muy húmedo.',
      'weather'));
  }

  // Mildiu con humedad y calor moderado
  if (rain > 25 && tMax > 14 && tMax < 25) {
    alerts.push(w(plant.id, 'fungal_risk', 'medio',
      'Humedad — riesgo de mildiu de la cebolla',
      `Las condiciones de lluvia (${rain.toFixed(0)} mm) y temperatura suave favorecen el mildiu, que aparece como manchas blancas-violáceas en las hojas.`,
      'Revisa las hojas. Si ves síntomas, aplica cobre preventivo. Evita regar por las hojas. Buena ventilación entre plantas.',
      'weather'));
  }

  // Calor en bulbificación → maduración precoz
  if (tMax > 28) {
    alerts.push(w(plant.id, 'heat_stress', 'bajo',
      `Calor elevado — maduración acelerada (${tMax.toFixed(0)} °C)`,
      'Con calor intenso la cebolla entra antes en maduración. Las hojas se doblarán antes de lo previsto.',
      'Cuando las hojas se doblen solas por la mitad, es señal de cosecha. No riegues las últimas 2 semanas antes de cosechar.',
      'weather'));
  }

  alerts.push(...checkSnow(plant, weather));

  return alerts;
}

// ---------------------------------------------------------------------------
// GENÉRICAS (aplican a cualquier planta)
// ---------------------------------------------------------------------------

function alertsGenericas(plant: Plant, weather: WeatherData | null): Warning[] {
  const alerts: Warning[] = [];

  if (!weather) return alerts;

  const rain = totalRain(weather);
  const maxRain = maxDailyRain(weather);

  // Nieve en curso (para todas)
  alerts.push(...checkSnow(plant, weather));

  // Lluvia intensa + suelo arcilloso
  if (maxRain > 15 && plant.soilType === 'jardin_arcilloso') {
    alerts.push(w(plant.id, 'overwatering_clay', 'medio',
      `Lluvia intensa prevista (${maxRain.toFixed(0)} mm / día)`,
      `Con suelo arcilloso, ${maxRain.toFixed(0)} mm en un solo día puede encharcar el bancal y asfixiar las raíces.`,
      'Comprueba que el bancal tiene salida de agua. Si el agua no drena en 1 hora tras la lluvia, haz un surco lateral.',
      'weather'));
  }

  // Semana seca con calor
  if (rain < 3 && weather.current.temperature_2m > 18) {
    alerts.push(w(plant.id, 'drought_stress', 'bajo',
      'Sin lluvia esta semana — revisa el riego',
      `No se prevé lluvia significativa con temperaturas de ${weather.current.temperature_2m.toFixed(0)} °C. El suelo se secará más rápido.`,
      'Riega según la frecuencia recomendada para tu planta. Comprueba la humedad introduciendo el dedo 3 cm en el suelo.',
      'weather'));
  }

  // Semana muy lluviosa
  if (rain > 70) {
    alerts.push(w(plant.id, 'rain_excess', 'bajo',
      `Semana muy lluviosa (${rain.toFixed(0)} mm / 7 días)`,
      'Con tanta lluvia el suelo se saturará. Suspende el riego y vigila el drenaje.',
      'No riegues esta semana. Si el bancal tiene tendencia a encharcarse, crea un pequeño canal de drenaje.',
      'weather'));
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// ENTRADA PRINCIPAL
// ---------------------------------------------------------------------------

export function generateAlerts(plants: Plant[], weather: WeatherData | null): Warning[] {
  const all: Warning[] = [];

  for (const plant of plants) {
    switch (plant.category) {
      case 'tomate':    all.push(...alertsTomate(plant, weather)); break;
      case 'fresa':     all.push(...alertsFresa(plant, weather)); break;
      case 'ajo':       all.push(...alertsAjo(plant, weather)); break;
      case 'acelga':    all.push(...alertsAcelga(plant, weather)); break;
      case 'zanahoria': all.push(...alertsZanahoria(plant, weather)); break;
      case 'perejil':   all.push(...alertsPerejil(plant, weather)); break;
      case 'pimiento':  all.push(...alertsPimiento(plant, weather)); break;
      case 'lechuga':   all.push(...alertsLechuga(plant, weather)); break;
      case 'puerro':    all.push(...alertsPuerro(plant, weather)); break;
      case 'cebolla':   all.push(...alertsCebolla(plant, weather)); break;
      default:          all.push(...alertsGenericas(plant, weather)); break;
    }
  }

  return all.sort((a, b) => riskOrder(b.riskLevel) - riskOrder(a.riskLevel));
}

function riskOrder(r: RiskLevel): number {
  return { alto: 3, medio: 2, bajo: 1, ok: 0 }[r];
}
