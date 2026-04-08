export interface WmoInfo {
  label: string;
  icon: string;
}

const WMO_CODES: Record<number, WmoInfo> = {
  0: { label: 'Despejado', icon: '☀️' },
  1: { label: 'Mayormente despejado', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Niebla', icon: '🌫️' },
  48: { label: 'Niebla con escarcha', icon: '🌫️' },
  51: { label: 'Llovizna ligera', icon: '🌦️' },
  53: { label: 'Llovizna moderada', icon: '🌦️' },
  55: { label: 'Llovizna intensa', icon: '🌧️' },
  61: { label: 'Lluvia ligera', icon: '🌧️' },
  63: { label: 'Lluvia moderada', icon: '🌧️' },
  65: { label: 'Lluvia fuerte', icon: '🌧️' },
  71: { label: 'Nevada ligera', icon: '🌨️' },
  73: { label: 'Nevada moderada', icon: '❄️' },
  75: { label: 'Nevada intensa', icon: '❄️' },
  77: { label: 'Granizo', icon: '🌨️' },
  80: { label: 'Chubascos ligeros', icon: '🌦️' },
  81: { label: 'Chubascos moderados', icon: '🌧️' },
  82: { label: 'Chubascos fuertes', icon: '⛈️' },
  85: { label: 'Chubascos de nieve', icon: '🌨️' },
  86: { label: 'Chubascos de nieve fuertes', icon: '❄️' },
  95: { label: 'Tormenta', icon: '⛈️' },
  96: { label: 'Tormenta con granizo', icon: '⛈️' },
  99: { label: 'Tormenta fuerte con granizo', icon: '⛈️' },
};

export function getWeatherInfo(code: number): WmoInfo {
  return WMO_CODES[code] ?? { label: 'Desconocido', icon: '🌡️' };
}

export function isSnowOrFreezeCode(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}
