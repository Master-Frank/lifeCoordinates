import type { BirthInput } from "@life-coordinates/core";

export function genderLabel(g: BirthInput["gender"]) {
  return g === "male" ? "男" : "女";
}

export function calendarLabel(c: BirthInput["calendar"]) {
  return c === "solar" ? "公历" : "农历";
}

export function formatDateYmd(d: BirthInput["date"]) {
  const y = String(d.year).padStart(4, "0");
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  const leap = d.isLeapMonth ? "(闰月)" : "";
  return `${y}-${m}-${day}${leap}`;
}

export function formatTimeLabel(t: BirthInput["time"]) {
  if (t.mode === "exact") {
    const hh = String(t.hour).padStart(2, "0");
    const mm = String(t.minute).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return t.label;
}

