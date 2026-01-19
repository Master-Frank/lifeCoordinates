import type { BirthInput, KLineResult, PaipanResult } from "@life-coordinates/core";

export type SessionState = {
  input?: BirthInput;
  paipan?: PaipanResult;
  kline?: KLineResult;
};

const SESSION_KEY = "life-coordinates.web.session.v1";

export function loadSession(): SessionState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SessionState;
  } catch {
    return {};
  }
}

export function saveSession(next: SessionState) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

