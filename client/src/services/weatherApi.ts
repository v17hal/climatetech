export interface LiveWeather {
  location: string
  temp: number
  feelsLike: number
  humidity: number
  rainfall: number
  windSpeed: number
  condition: string
  icon: string
  riskScore: number
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
  forecast: ForecastDay[]
}

export interface ForecastDay {
  date: string
  day: string
  high: number
  low: number
  rain: number
  condition: string
  emoji: string
}

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY ?? ''

/* Coordinates for SA provinces */
const PROVINCE_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  'Limpopo':        { lat: -23.9045, lon: 29.4689, label: 'Polokwane' },
  'KwaZulu-Natal':  { lat: -29.8587, lon: 31.0218, label: 'Durban' },
  'North West':     { lat: -25.6544, lon: 27.2343, label: 'Rustenburg' },
  'Mpumalanga':     { lat: -25.4753, lon: 30.9694, label: 'Nelspruit' },
  'Eastern Cape':   { lat: -33.0153, lon: 27.9116, label: 'East London' },
  'Western Cape':   { lat: -33.9249, lon: 18.4241, label: 'Cape Town' },
  'Free State':     { lat: -29.1179, lon: 26.2340, label: 'Bloemfontein' },
  'Gauteng':        { lat: -26.2041, lon: 28.0473, label: 'Johannesburg' },
  'Northern Cape':  { lat: -28.7282, lon: 24.7499, label: 'Kimberley' },
}

function calcRisk(temp: number, humidity: number, windSpeed: number, rain: number): { score: number; level: 'low' | 'moderate' | 'high' | 'extreme' } {
  let score = 0
  if (temp > 38) score += 30; else if (temp > 33) score += 20; else if (temp > 28) score += 10
  if (humidity > 85) score += 20; else if (humidity > 70) score += 10
  if (windSpeed > 40) score += 25; else if (windSpeed > 25) score += 15; else if (windSpeed > 15) score += 5
  if (rain > 30) score += 25; else if (rain > 15) score += 15; else if (rain > 5) score += 5
  score = Math.min(100, score)
  const level = score >= 75 ? 'extreme' : score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low'
  return { score, level }
}

const CONDITION_EMOJI: Record<string, string> = {
  'Clear': '☀️', 'Clouds': '⛅', 'Rain': '🌧️', 'Thunderstorm': '⛈️',
  'Drizzle': '🌦️', 'Snow': '❄️', 'Mist': '🌫️', 'Haze': '🌫️',
  'Dust': '💨', 'Fog': '🌫️', 'Sand': '💨', 'Smoke': '🌫️',
  'Squall': '💨', 'Tornado': '🌪️',
}

export async function fetchWeather(province: string): Promise<LiveWeather> {
  const coords = PROVINCE_COORDS[province]
  if (!coords || !API_KEY) return getMockWeather(province)

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&cnt=7`),
    ])

    if (!currentRes.ok) return getMockWeather(province)

    const current = await currentRes.json()
    const forecastData = forecastRes.ok ? await forecastRes.json() : { list: [] }

    const rain = current.rain?.['1h'] ?? 0
    const { score, level } = calcRisk(current.main.temp, current.main.humidity, current.wind.speed * 3.6, rain)

    const forecast: ForecastDay[] = (forecastData.list ?? []).slice(0, 7).map((item: {
      dt: number; main: { temp_max: number; temp_min: number }; pop: number; weather: { main: string; description: string }[]
    }) => {
      const date = new Date(item.dt * 1000)
      return {
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-ZA', { weekday: 'short' }),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        rain: Math.round((item.pop ?? 0) * 100),
        condition: item.weather[0]?.description ?? '',
        emoji: CONDITION_EMOJI[item.weather[0]?.main] ?? '🌤️',
      }
    })

    return {
      location: coords.label,
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      rainfall: rain,
      windSpeed: Math.round((current.wind?.speed ?? 0) * 3.6),
      condition: current.weather[0]?.description ?? '',
      icon: `https://openweathermap.org/img/wn/${current.weather[0]?.icon}@2x.png`,
      riskScore: score,
      riskLevel: level,
      forecast,
    }
  } catch {
    return getMockWeather(province)
  }
}

/* Fallback mock — used when no API key or request fails */
function getMockWeather(province: string): LiveWeather {
  const base: Record<string, Partial<LiveWeather>> = {
    'Limpopo':       { temp: 32, humidity: 48, rainfall: 8,  windSpeed: 14, condition: 'Partly cloudy' },
    'KwaZulu-Natal': { temp: 27, humidity: 78, rainfall: 22, windSpeed: 19, condition: 'Thunderstorms' },
    'North West':    { temp: 29, humidity: 42, rainfall: 4,  windSpeed: 22, condition: 'Sunny' },
    'Mpumalanga':    { temp: 24, humidity: 72, rainfall: 18, windSpeed: 11, condition: 'Overcast' },
    'Eastern Cape':  { temp: 22, humidity: 65, rainfall: 12, windSpeed: 28, condition: 'Windy and cloudy' },
    'Western Cape':  { temp: 19, humidity: 58, rainfall: 5,  windSpeed: 32, condition: 'Strong winds' },
    'Free State':    { temp: 26, humidity: 35, rainfall: 2,  windSpeed: 16, condition: 'Sunny' },
    'Gauteng':       { temp: 28, humidity: 55, rainfall: 14, windSpeed: 12, condition: 'Afternoon storm risk' },
    'Northern Cape': { temp: 36, humidity: 18, rainfall: 0,  windSpeed: 25, condition: 'Hot and dry' },
  }
  const w = { temp: 25, humidity: 55, rainfall: 5, windSpeed: 15, condition: 'Clear', ...base[province] }
  const { score, level } = calcRisk(w.temp!, w.humidity!, w.windSpeed!, w.rainfall!)
  const coords = PROVINCE_COORDS[province]

  return {
    location: coords?.label ?? province,
    temp: w.temp!, feelsLike: w.temp! - 2, humidity: w.humidity!,
    rainfall: w.rainfall!, windSpeed: w.windSpeed!, condition: w.condition!,
    icon: '', riskScore: score, riskLevel: level,
    forecast: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-ZA', { weekday: 'short' }),
        high: w.temp! + Math.round(Math.random() * 4 - 2),
        low: w.temp! - 8 + Math.round(Math.random() * 3),
        rain: Math.round(Math.random() * 30),
        condition: 'Partly cloudy',
        emoji: ['☀️', '⛅', '🌧️', '⛈️', '🌦️', '☀️', '⛅'][i],
      }
    }),
  }
}
