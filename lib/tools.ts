// Campus Buddy's tools. A tool is a name, a description, a schema, and a function.
// The model only ever sees the first three.
import { tool } from "langchain";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { ROOT, env } from "./env.ts";

// ---------------------------------------------------------------------------
// getWeather: live weather from Open-Meteo (free, no key)
// ---------------------------------------------------------------------------

const WEATHER_CODES: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 80: "light showers",
  81: "showers", 82: "violent showers", 95: "thunderstorm", 96: "thunderstorm with hail",
  99: "thunderstorm with hail",
};

const FALLBACK_WEATHER =
  "Moratuwa now: 29°C, light rain, wind 14 km/h. " +
  "Next days: mostly 28-31°C with afternoon showers (60-80% chance of rain).";

const cache = new Map<string, { at: number; text: string }>();
const TEN_MINUTES = 10 * 60 * 1000;

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<any>;
}

async function weatherFor(city: string): Promise<string> {
  const geo = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`,
  );
  const place = geo.results?.[0];
  if (!place) return `I couldn't find a place called "${city}".`;

  const w = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      "&current=temperature_2m,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=7",
  );
  const now = `${place.name} now: ${Math.round(w.current.temperature_2m)}°C, ` +
    `${WEATHER_CODES[w.current.weather_code] ?? "unknown"}, wind ${Math.round(w.current.wind_speed_10m)} km/h.`;
  const days = w.daily.time.map((date: string, i: number) =>
    `${date}: ${WEATHER_CODES[w.daily.weather_code[i]] ?? "unknown"}, ` +
    `${Math.round(w.daily.temperature_2m_min[i])}-${Math.round(w.daily.temperature_2m_max[i])}°C, ` +
    `${w.daily.precipitation_probability_max[i]}% chance of rain`,
  );
  return [now, "Forecast:", ...days].join("\n");
}

export const getWeather = tool(
  async ({ city }) => {
    if (env.fake) return FALLBACK_WEATHER; // `npm run check` works offline
    const key = city.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TEN_MINUTES) return hit.text;
    try {
      const text = await weatherFor(city);
      cache.set(key, { at: Date.now(), text });
      return text;
    } catch {
      console.warn("⚠️  Open-Meteo is unreachable, using sample weather instead.");
      return FALLBACK_WEATHER;
    }
  },
  {
    name: "getWeather",
    description:
      "Get the current weather and a 7-day forecast (temperature, rain chance) for a city. " +
      "Use this for any question about weather, rain, or whether to walk or take the bus.",
    schema: z.object({
      city: z.string().describe("City name, for example 'Moratuwa'"),
    }),
  },
);

// ---------------------------------------------------------------------------
// getTimetable: reads data/timetable.json (works offline)
// ---------------------------------------------------------------------------

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Session = { time: string; module: string; type: string; venue: string };
type Timetable = {
  student: string;
  week: Record<string, Session[]>;
  midSem: { startsInDays: number; exams: { module: string; dayOffset: number; time: string }[] };
};

export function loadTimetable(): Timetable {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data", "timetable.json"), "utf8"));
}

/** e.g. "Thursday, 25 September 2026". Put this in system prompts so "tomorrow" makes sense. */
export function todayText(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Mid-sem exams with real dates. They start on the first Monday at least `startsInDays`
 * from today, so the demo never goes stale and exams never land on a weekend.
 */
export function midSemExams() {
  const { midSem } = loadTimetable();
  let start = midSem.startsInDays;
  while (addDays(start).getDay() !== 1) start++;
  return midSem.exams.map((exam) => {
    const days = start + exam.dayOffset;
    return { module: exam.module, date: todayText(addDays(days)), time: exam.time, daysAway: days };
  });
}

export const getTimetable = tool(
  async ({ day }) => {
    const { student, week } = loadTimetable();
    const wanted = day.trim().toLowerCase();

    let days: string[];
    if (wanted === "today") days = [DAYS[new Date().getDay()]];
    else if (wanted === "tomorrow") days = [DAYS[addDays(1).getDay()]];
    else if (wanted === "week") days = DAYS.slice(1).concat("Sunday");
    else {
      const match = DAYS.find((d) => d.toLowerCase() === wanted);
      if (!match) return `Unknown day "${day}". Use a weekday name, "today", "tomorrow" or "week".`;
      days = [match];
    }

    const lines = days.map((d) => {
      const sessions = week[d] ?? [];
      if (sessions.length === 0) return `${d}: no classes`;
      return `${d}:\n` + sessions.map((s) => `  ${s.time}  ${s.module} (${s.type}) @ ${s.venue}`).join("\n");
    });
    const exams = midSemExams()
      .map((e) => `  ${e.date} ${e.time}  ${e.module} (in ${e.daysAway} days)`)
      .join("\n");

    return `Timetable for ${student}\n${lines.join("\n")}\n\nMid-semester exams:\n${exams}`;
  },
  {
    name: "getTimetable",
    description:
      "Get the student's lecture and lab timetable, plus their mid-semester exam dates. " +
      "Pass a weekday name, 'today', 'tomorrow', or 'week' for the whole week.",
    schema: z.object({
      day: z.string().describe("A weekday like 'Monday', or 'today', 'tomorrow', or 'week'"),
    }),
  },
);
