import { Solar, Lunar } from "lunar-javascript";
import type { BirthInput, PaipanResult, PillarDetail, PillarKey } from "./types";
import { correctToTrueSolarTime, formatYmdHms, normalizeBirthTime } from "./birth";

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

const ZhiChong: Record<string, string> = {
  子: "午",
  丑: "未",
  寅: "申",
  卯: "酉",
  辰: "戌",
  巳: "亥",
  午: "子",
  未: "丑",
  申: "寅",
  酉: "卯",
  戌: "辰",
  亥: "巳"
};

const ZhiSha: Record<string, "南" | "东" | "北" | "西"> = {
  子: "南",
  丑: "东",
  寅: "北",
  卯: "西",
  辰: "南",
  巳: "东",
  午: "北",
  未: "西",
  申: "南",
  酉: "东",
  戌: "北",
  亥: "西"
};

function safeArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return v.split(/\s+/g);
  return [];
}

function pick(obj: any, candidates: string[]): any {
  for (const k of candidates) {
    if (obj && typeof obj[k] === "function") return obj[k].bind(obj);
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

function getLunarIsLeapMonth(lunar: any): boolean {
  const fn = lunar?.isLeap;
  if (typeof fn === "function") return Boolean(fn.call(lunar));

  const prop = lunar?.isLeapMonth ?? lunar?.leap ?? lunar?.isLeap;
  if (typeof prop === "boolean") return prop;

  const pMonth = lunar?._p?.month;
  if (typeof pMonth === "number") return pMonth < 0;

  const m = typeof lunar?.getMonth === "function" ? Number(lunar.getMonth()) : undefined;
  if (typeof m === "number" && Number.isFinite(m)) return m < 0;

  return false;
}

function buildPillarDetail(eightChar: any, key: PillarKey): PillarDetail {
  const caps = key === "hour" ? ["Time", "Hour"] : [key[0].toUpperCase() + key.slice(1)];
  const getGan = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}Gan`])
  );
  const getZhi = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}Zhi`])
  );
  const gan = typeof getGan === "function" ? getGan() : "";
  const zhi = typeof getZhi === "function" ? getZhi() : "";

  const getTenGodGan = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}ShiShenGan`, `get${cap}ShiShen`])
  );
  const getTenGodZhi = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}ShiShenZhi`])
  );
  const ganTenGod = typeof getTenGodGan === "function" ? String(getTenGodGan()) : "";
  const zhiTenGods = typeof getTenGodZhi === "function" ? safeArray(getTenGodZhi()) : [];
  const zhiTenGod = zhiTenGods[0] ?? ganTenGod;

  const getHiddenStems = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}HideGan`, `get${cap}HiddenGan`, `get${cap}CangGan`])
  );
  const hiddenStems = typeof getHiddenStems === "function" ? safeArray(getHiddenStems()) : [];

  const hiddenStemTenGods = zhiTenGods;

  const getStarLuck = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}DiShi`])
  );
  const starLuck = typeof getStarLuck === "function" ? String(getStarLuck()) : "";

  const getSelfSeat = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}ZiZuo`])
  );
  const selfSeat = typeof getSelfSeat === "function" ? String(getSelfSeat()) : "";

  const getKongWang = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}XunKong`, `get${cap}KongWang`])
  );
  const kongWang = typeof getKongWang === "function" ? String(getKongWang()) : "";

  const getNaYin = pick(
    eightChar,
    caps.flatMap((cap) => [`get${cap}NaYin`])
  );
  const naYin = typeof getNaYin === "function" ? String(getNaYin()) : "";

  const shenSha: string[] = [];
  if (zhi) {
    const c = ZhiChong[zhi];
    const s = ZhiSha[zhi];
    if (c) shenSha.push(`冲${c}`);
    if (s) shenSha.push(`煞${s}`);
  }

  return {
    pillar: key,
    gan,
    zhi,
    ganTenGod,
    zhiTenGod,
    hiddenStems,
    hiddenStemTenGods,
    starLuck,
    selfSeat: selfSeat || zhiTenGod,
    kongWang,
    naYin,
    shenSha
  };
}

function evaluateDayMasterStrength(params: {
  dayGan: string;
  monthZhi: string;
  hiddenStems: string[];
}): "强" | "中" | "弱" {
  const dmEl = GanToElement[params.dayGan] ?? "土";

  const zhiSeasonEl: Record<string, "木" | "火" | "土" | "金" | "水"> = {
    寅: "木",
    卯: "木",
    辰: "土",
    巳: "火",
    午: "火",
    未: "土",
    申: "金",
    酉: "金",
    戌: "土",
    亥: "水",
    子: "水",
    丑: "土"
  };
  const seasonEl = zhiSeasonEl[params.monthZhi];
  let score = 0;

  if (seasonEl === dmEl) score += 2;
  if (params.hiddenStems.some((g) => GanToElement[g] === dmEl)) score += 2;

  const support: Record<string, string[]> = {
    木: ["水", "木"],
    火: ["木", "火"],
    土: ["火", "土"],
    金: ["土", "金"],
    水: ["金", "水"]
  };
  if (seasonEl && support[dmEl].includes(seasonEl)) score += 1;

  if (score >= 4) return "强";
  if (score >= 2) return "中";
  return "弱";
}

function pickFavorableElements(strength: "强" | "中" | "弱", dayElement: "木" | "火" | "土" | "金" | "水") {
  const sheng: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const beSheng: Record<string, string> = { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" };
  const ke: Record<string, string> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
  const beKe: Record<string, string> = { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" };

  if (strength === "强") {
    return {
      favorable: [sheng[dayElement], ke[dayElement]] as any,
      unfavorable: [dayElement, beSheng[dayElement]] as any
    };
  }

  if (strength === "弱") {
    return {
      favorable: [dayElement, beSheng[dayElement]] as any,
      unfavorable: [sheng[dayElement], beKe[dayElement]] as any
    };
  }

  return {
    favorable: [dayElement, sheng[dayElement]] as any,
    unfavorable: [beKe[dayElement]] as any
  };
}

function getLuckDirection(eightChar: any, gender: "male" | "female"): "顺" | "逆" {
  const getYun = pick(eightChar, ["getYun"]);
  if (typeof getYun === "function") {
    const yun = getYun(gender === "male" ? 1 : 0);
    const isForward = pick(yun, ["isForward"]) as any;
    if (typeof isForward === "function") return isForward() ? "顺" : "逆";
  }

  const getYearGan = pick(eightChar, ["getYearGan"]);
  const yg = typeof getYearGan === "function" ? String(getYearGan()) : "";
  const yangGans = new Set(["甲", "丙", "戊", "庚", "壬"]);
  const isYang = yangGans.has(yg);
  if ((isYang && gender === "male") || (!isYang && gender === "female")) return "顺";
  return "逆";
}

function getStartLuckAge(eightChar: any, gender: "male" | "female"): number {
  const getYun = pick(eightChar, ["getYun"]);
  if (typeof getYun === "function") {
    const yun = getYun(gender === "male" ? 1 : 0);
    const getStartAge = pick(yun, ["getStartAge"]);
    if (typeof getStartAge === "function") return Number(getStartAge());
  }
  return 1;
}

function getDaYunList(params: {
  solarYear: number;
  eightChar: any;
  gender: "male" | "female";
}): PaipanResult["daYun"] {
  const getYun = pick(params.eightChar, ["getYun"]);
  if (typeof getYun === "function") {
    const yun = getYun(params.gender === "male" ? 1 : 0);
    const getDaYun = pick(yun, ["getDaYun"]);
    if (typeof getDaYun === "function") {
      const list = getDaYun() as any[];
      const startAge = getStartLuckAge(params.eightChar, params.gender);
      return (list || []).map((dy) => {
        const getStartYear = pick(dy, ["getStartYear"]);
        const getEndYear = pick(dy, ["getEndYear"]);
        const getStartAgeFn = pick(dy, ["getStartAge"]);
        const getEndAgeFn = pick(dy, ["getEndAge"]);
        const getGanZhi = pick(dy, ["getGanZhi", "getName"]);

        const sAge = typeof getStartAgeFn === "function" ? Number(getStartAgeFn()) : startAge;
        const eAge = typeof getEndAgeFn === "function" ? Number(getEndAgeFn()) : sAge + 9;
        const sYear = typeof getStartYear === "function" ? Number(getStartYear()) : params.solarYear + sAge - 1;
        const eYear = typeof getEndYear === "function" ? Number(getEndYear()) : sYear + 9;
        const gz = typeof getGanZhi === "function" ? String(getGanZhi()) : "";
        return {
          startYear: sYear,
          endYear: eYear,
          startAge: sAge,
          endAge: eAge,
          ganZhi: gz
        };
      });
    }
  }

  const startAge = getStartLuckAge(params.eightChar, params.gender);
  const direction = getLuckDirection(params.eightChar, params.gender);
  const getMonthGanZhi = pick(params.eightChar, ["getMonth"]) as any;
  const monthGz = typeof getMonthGanZhi === "function" ? String(getMonthGanZhi()) : "";
  const gans = "甲乙丙丁戊己庚辛壬癸";
  const zhis = "子丑寅卯辰巳午未申酉戌亥";
  const next = (gz: string, step: 1 | -1) => {
    const g = gz.slice(0, 1);
    const z = gz.slice(1);
    const gi = gans.indexOf(g);
    const zi = zhis.indexOf(z);
    const ng = gans[(gi + step + 10) % 10];
    const nz = zhis[(zi + step + 12) % 12];
    return `${ng}${nz}`;
  };
  const base = monthGz || "甲子";
  const list: PaipanResult["daYun"] = [];
  for (let i = 0; i < 11; i++) {
    const sAge = startAge + i * 10;
    const eAge = sAge + 9;
    const sYear = params.solarYear + sAge - 1;
    const eYear = sYear + 9;
    const gz = i === 0 ? base : next(list[i - 1].ganZhi || base, direction === "顺" ? 1 : -1);
    list.push({ startYear: sYear, endYear: eYear, startAge: sAge, endAge: eAge, ganZhi: gz });
  }
  return list;
}

export function paipan(input: BirthInput): PaipanResult {
  const { hour, minute } = normalizeBirthTime(input.time);
  const trueSolar = correctToTrueSolarTime({
    y: input.date.year,
    m: input.date.month,
    d: input.date.day,
    hour,
    minute,
    longitude: input.location.longitude
  });
  const corrected = trueSolar.corrected;

  let solar: any;
  let lunar: any;
  if (input.calendar === "solar") {
    solar = Solar.fromYmdHms(
      input.date.year,
      input.date.month,
      input.date.day,
      corrected.getHours(),
      corrected.getMinutes(),
      corrected.getSeconds()
    );
    lunar = solar.getLunar();
  } else {
    lunar = Lunar.fromYmdHms(
      input.date.year,
      input.date.month,
      input.date.day,
      corrected.getHours(),
      corrected.getMinutes(),
      corrected.getSeconds(),
      Boolean(input.date.isLeapMonth)
    );
    solar = lunar.getSolar();
  }

  const eightChar = lunar.getEightChar();
  const year = buildPillarDetail(eightChar, "year");
  const month = buildPillarDetail(eightChar, "month");
  const day = buildPillarDetail(eightChar, "day");
  const hourP = buildPillarDetail(eightChar, "hour");

  const dayMasterGan = day.gan;
  const dayMasterEl = GanToElement[dayMasterGan] ?? "土";
  const strength = evaluateDayMasterStrength({
    dayGan: dayMasterGan,
    monthZhi: month.zhi,
    hiddenStems: [...year.hiddenStems, ...month.hiddenStems, ...day.hiddenStems, ...hourP.hiddenStems]
  });
  const fav = pickFavorableElements(strength, dayMasterEl);
  const startLuckAge = getStartLuckAge(eightChar, input.gender);
  const direction = getLuckDirection(eightChar, input.gender);
  const daYun = getDaYunList({
    solarYear: solar.getYear(),
    eightChar,
    gender: input.gender
  });

  const lunarYear = typeof lunar?.getYear === "function" ? Number(lunar.getYear()) : Number(input.date.year);
  const lunarMonthRaw = typeof lunar?.getMonth === "function" ? Number(lunar.getMonth()) : Number(input.date.month);
  const lunarDay = typeof lunar?.getDay === "function" ? Number(lunar.getDay()) : Number(input.date.day);
  const lunarMonth = Math.abs(lunarMonthRaw);
  const lunarIsLeapMonth = getLunarIsLeapMonth(lunar);

  return {
    input,
    solar: {
      ymdHms: formatYmdHms(new Date(input.date.year, input.date.month - 1, input.date.day, hour, minute, 0)),
      correctedYmdHms: formatYmdHms(corrected),
      longitudeDeltaMinutes: Number(trueSolar.deltaMinutes.toFixed(1))
    },
    lunar: {
      ymd: `${lunarYear}-${String(lunarMonth).padStart(2, "0")}-${String(lunarDay).padStart(2, "0")}`,
      isLeapMonth: lunarIsLeapMonth
    },
    fourPillars: {
      year,
      month,
      day,
      hour: hourP,
      dayMaster: { gan: dayMasterGan, element: dayMasterEl }
    },
    overall: {
      dayMasterStrength: strength,
      favorableElements: fav.favorable,
      unfavorableElements: fav.unfavorable,
      startLuckAge,
      luckDirection: direction
    },
    daYun
  };
}
