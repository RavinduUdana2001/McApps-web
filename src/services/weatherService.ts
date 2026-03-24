import axios from "axios";

type OpenWeatherPayload = {
  weather?: Array<{
    main?: string;
    description?: string;
    icon?: string;
  }>;
  main: {
    temp: number;
  };
  name?: string;
  sys?: {
    country?: string;
  };
};

export type WeatherSummary = {
  locationLabel: string;
  condition: string;
  description: string;
  temperatureC: number;
  weatherMain: string;
  iconCode: string;
};

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();
const DEFAULT_WEATHER_LOCATION =
  import.meta.env.VITE_OPENWEATHER_LOCATION?.trim() || "Colombo,LK";
const CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

function normalizeLocation(location?: string | null) {
  const value = location?.trim();
  if (!value) return null;

  return value.replace(/\s+/g, " ");
}

function titleCase(text: string) {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLocationCandidates(location?: string | null) {
  return [...new Set([normalizeLocation(location), DEFAULT_WEATHER_LOCATION, "Colombo,LK"].filter((value): value is string => Boolean(value)))];
}

export function isWeatherConfigured() {
  return Boolean(OPENWEATHER_API_KEY);
}

export async function getCurrentWeather(
  location?: string | null
): Promise<WeatherSummary | null> {
  if (!OPENWEATHER_API_KEY) {
    return null;
  }

  let lastError: unknown = null;

  for (const candidate of getLocationCandidates(location)) {
    try {
      const { data } = await axios.get<OpenWeatherPayload>(CURRENT_WEATHER_URL, {
        params: {
          q: candidate,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
        },
        timeout: 20000,
      });

      const weather = data.weather?.[0];
      const description = weather?.description || weather?.main || "Weather";
      const locationLabel =
        data.name ||
        candidate.split(",")[0]?.trim() ||
        candidate;

      return {
        locationLabel: locationLabel || candidate,
        condition: titleCase(weather?.main || "Weather"),
        description: titleCase(description),
        temperatureC: Math.round(data.main.temp),
        weatherMain: weather?.main || "",
        iconCode: weather?.icon || "",
      };
    } catch (error) {
      lastError = error;

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        continue;
      }

      break;
    }
  }

  if (axios.isAxiosError(lastError)) {
    if (lastError.response?.status === 401 || lastError.response?.status === 404) {
      return null;
    }
  }

  throw new Error("Failed to load weather.");
}
