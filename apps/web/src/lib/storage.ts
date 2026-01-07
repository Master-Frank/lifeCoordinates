import type { BirthInput, KLineResult, PaipanResult } from "@life-coordinates/core";

const KEY = "lifeCoordinates:last";

export function saveSession(data: { input: BirthInput; paipan?: PaipanResult; kline?: KLineResult }) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadSession(): { input: BirthInput; paipan?: PaipanResult; kline?: KLineResult } | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

