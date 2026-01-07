import { z } from "zod";
import type { BirthInput, BirthTimeInput } from "./types";

export const BirthInputSchema = z.object({
  name: z.string().trim().min(1),
  gender: z.union([z.literal("male"), z.literal("female")]),
  calendar: z.union([z.literal("solar"), z.literal("lunar")]),
  date: z.object({
    year: z.number().int().min(1800).max(2200),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    isLeapMonth: z.boolean().optional()
  }),
  time: z.union([
    z.object({
      mode: z.literal("exact"),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59)
    }),
    z.object({
      mode: z.literal("segment"),
      label: z.union([
        z.literal("子时"),
        z.literal("丑时"),
        z.literal("寅时"),
        z.literal("卯时"),
        z.literal("辰时"),
        z.literal("巳时"),
        z.literal("午时"),
        z.literal("未时"),
        z.literal("申时"),
        z.literal("酉时"),
        z.literal("戌时"),
        z.literal("亥时"),
        z.literal("上午"),
        z.literal("下午")
      ])
    })
  ]),
  location: z.object({
    province: z.string().trim().min(1),
    city: z.string().trim().min(1),
    longitude: z.number().min(70).max(140)
  })
});

export function normalizeBirthTime(time: BirthTimeInput): { hour: number; minute: number; note?: string } {
  if (time.mode === "exact") {
    return { hour: time.hour, minute: time.minute };
  }

  const table: Record<string, { hour: number; minute: number; range: string }> = {
    子时: { hour: 0, minute: 0, range: "23:00-01:00" },
    丑时: { hour: 2, minute: 0, range: "01:00-03:00" },
    寅时: { hour: 4, minute: 0, range: "03:00-05:00" },
    卯时: { hour: 6, minute: 0, range: "05:00-07:00" },
    辰时: { hour: 8, minute: 0, range: "07:00-09:00" },
    巳时: { hour: 10, minute: 0, range: "09:00-11:00" },
    午时: { hour: 12, minute: 0, range: "11:00-13:00" },
    未时: { hour: 14, minute: 0, range: "13:00-15:00" },
    申时: { hour: 16, minute: 0, range: "15:00-17:00" },
    酉时: { hour: 18, minute: 0, range: "17:00-19:00" },
    戌时: { hour: 20, minute: 0, range: "19:00-21:00" },
    亥时: { hour: 22, minute: 0, range: "21:00-23:00" },
    上午: { hour: 10, minute: 0, range: "06:00-12:00" },
    下午: { hour: 16, minute: 0, range: "12:00-18:00" }
  };

  const pick = table[time.label];
  return { hour: pick.hour, minute: pick.minute, note: `${time.label}(${pick.range}, 取${String(pick.hour).padStart(2, "0")}:${String(pick.minute).padStart(2, "0")})` };
}

export function correctToTrueSolarTime(params: {
  y: number;
  m: number;
  d: number;
  hour: number;
  minute: number;
  longitude: number;
}): { corrected: Date; deltaMinutes: number } {
  const standardMeridian = 120;
  const deltaMinutes = ((params.longitude - standardMeridian) * 4);
  const local = new Date(params.y, params.m - 1, params.d, params.hour, params.minute, 0);
  const corrected = new Date(local.getTime() + deltaMinutes * 60_000);
  return { corrected, deltaMinutes };
}

export function formatYmdHms(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export function parseBirthInput(raw: unknown): BirthInput {
  return BirthInputSchema.parse(raw);
}

