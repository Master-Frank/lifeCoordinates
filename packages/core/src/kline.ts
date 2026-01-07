import type { KLineResult, PaipanResult, YearKLine } from "./types";

const GanToElement: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};

const ZhiToElement: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水"
};

function clamp01(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function relationScore(params: {
  favorable: Set<string>;
  unfavorable: Set<string>;
  gan?: string;
  zhi?: string;
}): { label: "favorable" | "neutral" | "unfavorable"; score: number } {
  const parts: string[] = [];
  if (params.gan) parts.push(GanToElement[params.gan] ?? "土");
  if (params.zhi) parts.push(ZhiToElement[params.zhi] ?? "土");

  let hitFav = 0;
  let hitUnfav = 0;
  for (const el of parts) {
    if (params.favorable.has(el)) hitFav += 1;
    if (params.unfavorable.has(el)) hitUnfav += 1;
  }

  if (hitFav >= 2) return { label: "favorable", score: 85 };
  if (hitUnfav >= 2) return { label: "unfavorable", score: 35 };
  if (hitFav === 1 && hitUnfav === 0) return { label: "favorable", score: 75 };
  if (hitUnfav === 1 && hitFav === 0) return { label: "unfavorable", score: 50 };
  if (hitFav === 1 && hitUnfav === 1) return { label: "neutral", score: 65 };
  return { label: "neutral", score: 65 };
}

function countBranchClash(a: string, b: string): 0 | 1 {
  const pairs = new Set([
    "子午",
    "午子",
    "丑未",
    "未丑",
    "寅申",
    "申寅",
    "卯酉",
    "酉卯",
    "辰戌",
    "戌辰",
    "巳亥",
    "亥巳"
  ]);
  return pairs.has(`${a}${b}`) ? 1 : 0;
}

function countBranchSixHe(a: string, b: string): 0 | 1 {
  const pairs = new Set([
    "子丑",
    "丑子",
    "寅亥",
    "亥寅",
    "卯戌",
    "戌卯",
    "辰酉",
    "酉辰",
    "巳申",
    "申巳",
    "午未",
    "未午"
  ]);
  return pairs.has(`${a}${b}`) ? 1 : 0;
}

function estimateBaseScore(paipan: PaipanResult): number {
  const strength = paipan.overall.dayMasterStrength;
  if (strength === "强") return 80;
  if (strength === "中") return 70;
  return 58;
}

function estimateClashFactor(params: {
  natalZhis: string[];
  luckZhi: string;
  yearZhi: string;
}): { score: number; delta: number; tags: string[] } {
  let he = 0;
  let chong = 0;
  for (const z of params.natalZhis) {
    he += countBranchSixHe(z, params.yearZhi);
    chong += countBranchClash(z, params.yearZhi);
    he += countBranchSixHe(z, params.luckZhi);
    chong += countBranchClash(z, params.luckZhi);
  }
  he += countBranchSixHe(params.luckZhi, params.yearZhi);
  chong += countBranchClash(params.luckZhi, params.yearZhi);

  const tags: string[] = [];
  if (he > 0) tags.push("合");
  if (chong > 0) tags.push("冲");

  if (chong >= 2) return { score: 35, delta: -15, tags };
  if (chong === 1) return { score: 50, delta: -10, tags };
  if (he >= 2) return { score: 70, delta: 5, tags };
  if (he === 1) return { score: 65, delta: 5, tags };
  return { score: 60, delta: 0, tags };
}

function estimatePatternAdjust(paipan: PaipanResult): number {
  const elements: string[] = [];
  const pillars = [paipan.fourPillars.year, paipan.fourPillars.month, paipan.fourPillars.day, paipan.fourPillars.hour];
  for (const p of pillars) {
    if (p.gan) elements.push(GanToElement[p.gan] ?? "土");
    if (p.zhi) elements.push(ZhiToElement[p.zhi] ?? "土");
  }
  const counts = new Map<string, number>();
  for (const e of elements) counts.set(e, (counts.get(e) ?? 0) + 1);
  const arr = Array.from(counts.values());
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  if (max - min <= 1) return 65;
  if (max >= 5) return 50;
  return 60;
}

function calcYearGanZhiBySolarYear(y: number): string {
  const gans = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const zhis = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const baseYear = 1984;
  const idx = (y - baseYear) % 60;
  const i = (idx + 60) % 60;
  return `${gans[i % 10]}${zhis[i % 12]}`;
}

export function generateKLine(paipan: PaipanResult): KLineResult {
  const base = estimateBaseScore(paipan);
  const favorable = new Set(paipan.overall.favorableElements);
  const unfavorable = new Set(paipan.overall.unfavorableElements);
  const natalZhis = [paipan.fourPillars.year.zhi, paipan.fourPillars.month.zhi, paipan.fourPillars.day.zhi, paipan.fourPillars.hour.zhi].filter(Boolean);
  const patternScore = estimatePatternAdjust(paipan);

  const years: YearKLine[] = [];
  let prevClose = clamp01(base);

  const firstSolarYear = paipan.daYun[0]?.startYear ? paipan.daYun[0].startYear - (paipan.daYun[0].startAge - 1) : new Date(paipan.solar.correctedYmdHms.replace(" ", "T")).getFullYear();

  const dayBranch = paipan.fourPillars.day.zhi;

  const dyByAge = (age: number) => paipan.daYun.find((d) => age >= d.startAge && age <= d.endAge) ?? paipan.daYun[paipan.daYun.length - 1];

  for (let age = 1; age <= 100; age++) {
    const year = firstSolarYear + age - 1;
    const gz = calcYearGanZhiBySolarYear(year);
    const yearGan = gz.slice(0, 1);
    const yearZhi = gz.slice(1);
    const dy = dyByAge(age);
    const luckGan = dy.ganZhi.slice(0, 1);
    const luckZhi = dy.ganZhi.slice(1);

    const natalBase = base;
    const luckRel = relationScore({ favorable, unfavorable, gan: luckGan, zhi: luckZhi });
    const yearRel = relationScore({ favorable, unfavorable, gan: yearGan, zhi: yearZhi });
    const clash = estimateClashFactor({ natalZhis, luckZhi, yearZhi });

    let yearFactor = yearRel.score;
    const tags: string[] = [...clash.tags];
    if (countBranchClash(yearZhi, dayBranch)) {
      yearFactor = clamp01(yearFactor - 18);
      tags.push("冲日支");
    }
    if (dy.ganZhi === gz) {
      tags.push("岁运并临");
      yearFactor = clamp01(yearFactor + (yearRel.label === "favorable" ? 15 : -15));
    }
    const total = clamp01(
      natalBase * 0.2 +
        luckRel.score * 0.35 +
        yearFactor * 0.3 +
        clash.score * 0.1 +
        patternScore * 0.05
    );

    const open = prevClose;
    const close = total;

    const luckVol = Math.min(8, Math.round(Math.abs(luckRel.score - 65) / 5));
    const yearVol = Math.min(12, Math.round(Math.abs(clash.delta) + (countBranchClash(yearZhi, dayBranch) ? 6 : 0)));
    const vol = luckVol + yearVol;
    const high = clamp01(Math.max(open, close) + vol);
    const low = clamp01(Math.min(open, close) - vol);
    const trend = close >= open ? "up" : "down";

    const brief = trend === "up" ? "上行" : "回撤";

    years.push({
      age,
      year,
      ganZhi: gz,
      open,
      high,
      low,
      close,
      score: close,
      trend,
      tags,
      brief
    });

    prevClose = close;
  }

  const daYunStages = paipan.daYun
    .filter((d) => d.startAge >= 1 && d.startAge <= 100)
    .map((d) => {
      const slice = years.filter((y) => y.age >= d.startAge && y.age <= d.endAge);
      const avg = slice.length ? slice.reduce((s, x) => s + x.score, 0) / slice.length : 60;
      const score = clamp01(Math.round(avg));
      const summary = score >= 75 ? "偏强" : score >= 60 ? "平稳" : "偏弱";
      const advice = score >= 75 ? "把握节奏，顺势布局" : score >= 60 ? "稳健推进，重视复利" : "控制风险，先守后攻";
      const risks = score >= 60 ? [] : ["情绪波动", "决策保守"];
      return { startAge: d.startAge, endAge: d.endAge, ganZhi: d.ganZhi, score, summary, advice, risks };
    });

  const sorted = [...years].sort((a, b) => b.score - a.score);
  const peaks = sorted.slice(0, 6).map((y) => ({ age: y.age, year: y.year, score: y.score, ganZhi: y.ganZhi }));
  const troughs = [...years].sort((a, b) => a.score - b.score).slice(0, 6).map((y) => ({ age: y.age, year: y.year, score: y.score, ganZhi: y.ganZhi }));

  const avgAll = years.reduce((s, x) => s + x.score, 0) / years.length;
  const firstAvg = years.slice(0, 34).reduce((s, x) => s + x.score, 0) / 34;
  const midAvg = years.slice(34, 67).reduce((s, x) => s + x.score, 0) / 33;
  const lastAvg = years.slice(67).reduce((s, x) => s + x.score, 0) / 33;
  let overallTrend: KLineResult["insight"]["overallTrend"] = "波动";
  if (firstAvg > midAvg && firstAvg > lastAvg) overallTrend = "前高";
  else if (midAvg > firstAvg && midAvg > lastAvg) overallTrend = "中高";
  else if (lastAvg > firstAvg && lastAvg > midAvg) overallTrend = "后高";

  const tenGodFocus = [paipan.fourPillars.year.ganTenGod, paipan.fourPillars.month.ganTenGod, paipan.fourPillars.day.ganTenGod, paipan.fourPillars.hour.ganTenGod]
    .filter(Boolean)
    .slice(0, 4);

  const totalScore = clamp01(Math.round(avgAll));
  const summary = totalScore >= 75 ? "整体偏强，波段与趋势并存" : totalScore >= 60 ? "整体平稳，关键在于节奏" : "整体偏弱，需要以稳为先";

  return {
    years,
    daYunStages,
    insight: {
      overallTrend,
      peaks,
      troughs,
      tenGodFocus,
      totalScore,
      summary
    }
  };
}

