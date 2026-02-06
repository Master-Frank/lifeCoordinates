import type { BirthInput } from "@life-coordinates/core";
import { normalizeBirthTime } from "@life-coordinates/core";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { astro, util } from "iztro";
import { formatDateYmd, formatTimeLabel, genderLabel } from "../lib/format";
import type { SessionState } from "../lib/storage";

astro.config({
  yearDivide: "normal",
  horoscopeDivide: "exact",
  ageDivide: "normal",
  dayDivide: "current",
  algorithm: "default",
});

function IconChevronRight() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function toDateStr(input: BirthInput) {
  const { year, month, day } = input.date;
  return `${year}-${month}-${day}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return {
    y: Number.isFinite(y) ? y : 1970,
    m: Number.isFinite(m) ? m : 1,
    d: Number.isFinite(d) ? d : 1,
  };
}

function shiftYmd(ymd: string, delta: { years?: number; months?: number; days?: number }) {
  const { y, m, d } = parseYmd(ymd);
  const date = new Date(y, Math.max(0, m - 1), d);
  if (delta.years) date.setFullYear(date.getFullYear() + delta.years);
  if (delta.months) date.setMonth(date.getMonth() + delta.months);
  if (delta.days) date.setDate(date.getDate() + delta.days);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function timeLabelByIndex(timeIndex: number) {
  const labels = ["早子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时", "晚子时"];
  return labels[timeIndex] ?? "";
}

const cnHeavenlyStemByPinyin: Record<string, string> = {
  jia: "甲",
  yi: "乙",
  bing: "丙",
  ding: "丁",
  wu: "戊",
  ji: "己",
  geng: "庚",
  xin: "辛",
  ren: "壬",
  gui: "癸",
};

const cnEarthlyBranchByPinyin: Record<string, string> = {
  zi: "子",
  chou: "丑",
  yin: "寅",
  mao: "卯",
  chen: "辰",
  si: "巳",
  wu: "午",
  wei: "未",
  shen: "申",
  you: "酉",
  xu: "戌",
  hai: "亥",
};

const heavenlyStemPinyins = Object.keys(cnHeavenlyStemByPinyin).sort((a, b) => b.length - a.length);
const earthlyBranchPinyins = Object.keys(cnEarthlyBranchByPinyin).sort((a, b) => b.length - a.length);

function toCnHeavenlyStem(v: unknown) {
  const raw = typeof v === "string" ? v : String(v ?? "");
  const s = raw.trim();
  if (!s) return "";
  if (!/[a-zA-Z]/.test(s)) return s;
  const lower = s.toLowerCase();
  const key = lower.endsWith("heavenly") ? lower.slice(0, -"heavenly".length) : lower;
  return cnHeavenlyStemByPinyin[key] ?? s;
}

function toCnEarthlyBranch(v: unknown) {
  const raw = typeof v === "string" ? v : String(v ?? "");
  const s = raw.trim();
  if (!s) return "";
  if (!/[a-zA-Z]/.test(s)) return s;
  const lower = s.toLowerCase();
  const key = lower.endsWith("earthly") ? lower.slice(0, -"earthly".length) : lower;
  return cnEarthlyBranchByPinyin[key] ?? s;
}

function toCnGanzhiText(v: unknown) {
  const raw = typeof v === "string" ? v : String(v ?? "");
  const s = raw.trim();
  if (!s) return "";
  if (!/[a-zA-Z]/.test(s)) return s;

  const lower = s.toLowerCase();
  let out = "";
  let i = 0;
  while (i < lower.length) {
    const stem = heavenlyStemPinyins.find((k) => lower.startsWith(k, i));
    if (stem) {
      const afterStem = i + stem.length;
      const branch = earthlyBranchPinyins.find((k) => lower.startsWith(k, afterStem));
      if (branch) {
        out += (cnHeavenlyStemByPinyin[stem] ?? "") + (cnEarthlyBranchByPinyin[branch] ?? "");
        i = afterStem + branch.length;
        continue;
      }
    }
    out += s[i] ?? "";
    i += 1;
  }
  return out;
}


function buildAstrolabe(input: BirthInput) {
  const dateStr = toDateStr(input);
  const gender = input.gender === "male" ? ("男" as const) : ("女" as const);
  const { hour } = normalizeBirthTime(input.time);
  const timeIndex = util.timeToIndex(hour);
  if (input.calendar === "solar") {
    return astro.bySolar(dateStr, timeIndex, gender, true, "zh-CN");
  }
  return astro.byLunar(dateStr, timeIndex, gender, Boolean(input.date.isLeapMonth), true, "zh-CN");
}

const gridPalaceBranchIndexes: Array<number | null> = (() => {
  const out: Array<number | null> = Array.from({ length: 16 }, () => null);
  const ringCellIndexes = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4];
  const startBranchIndex = 3;
  ringCellIndexes.forEach((cellIndex, step) => {
    out[cellIndex] = (startBranchIndex + step) % 12;
  });
  return out;
})();

function PalaceCell({
  palace,
  horoscope,
  onSelect,
  showFlyRow,
}: {
  palace: any;
  horoscope: any;
  onSelect: (palaceName: string) => void;
  showFlyRow: boolean;
}) {
  const decadalRange = Array.isArray(palace?.decadal?.range) ? palace.decadal.range.join(" - ") : "";
  const palaceIndex = typeof palace?.index === "number" && Number.isInteger(palace.index) ? palace.index : -1;
  const hs = toCnHeavenlyStem(palace?.heavenlyStem);
  const eb = toCnEarthlyBranch(palace?.earthlyBranch);
  const nameSuffix = palace?.isBodyPalace ? "·身宫" : palace?.isOriginalPalace ? "·来因" : "";

  const majors: any[] = Array.isArray(palace?.majorStars) ? palace.majorStars : [];
  const minors: any[] = Array.isArray(palace?.minorStars) ? palace.minorStars : [];
  const adjs: any[] = Array.isArray(palace?.adjectiveStars) ? palace.adjectiveStars : [];

  const starNameSet = useMemo(() => {
    const names = new Set<string>();
    [...majors, ...minors, ...adjs].forEach((s) => {
      const n = typeof s?.name === "string" ? s.name : "";
      if (n) names.add(n);
    });
    return names;
  }, [majors, minors, adjs]);

  const flyMutagens = useMemo(() => {
    if (!showFlyRow) return { items: [], selfByStar: {} as Record<string, Array<"禄" | "权" | "科" | "忌">> };

    const mutagens: Array<"禄" | "权" | "科" | "忌"> = ["禄", "权", "科", "忌"];
    const palaceName = typeof palace?.name === "string" ? palace.name : "";
    const stem = palace?.heavenlyStem;
    if (!stem || !palaceName) return { items: [], selfByStar: {} as Record<string, Array<"禄" | "权" | "科" | "忌">> };

    try {
      const stars = util.getMutagensByHeavenlyStem(stem) as any[];
      const places = typeof palace?.mutagedPlaces === "function" ? (palace.mutagedPlaces() as any[]) : [];
      const items = mutagens.map((m, i) => {
        const starName = typeof stars?.[i] === "string" ? stars[i] : String(stars?.[i] ?? "");
        const toName = typeof places?.[i]?.name === "string" ? places[i].name : "";
        return {
          mutagen: m,
          star: starName,
          to: toName,
          isSelf: Boolean(toName && palaceName && toName === palaceName),
        };
      });

      const selfByStar: Record<string, Array<"禄" | "权" | "科" | "忌">> = {};
      items.forEach((it) => {
        if (!it.isSelf) return;
        if (!it.star) return;
        if (!starNameSet.has(it.star)) return;
        (selfByStar[it.star] ||= []).push(it.mutagen);
      });

      return { items, selfByStar };
    } catch {
      return { items: [], selfByStar: {} as Record<string, Array<"禄" | "权" | "科" | "忌">> };
    }
  }, [palace, showFlyRow, starNameSet]);

  const getStarsAt = (item: any) => {
    if (!item) return [];
    const starsByPalace: any[] | undefined = item?.stars;
    if (palaceIndex < 0) return [];
    if (!Array.isArray(starsByPalace)) return [];
    const starsAt: any[] | undefined = starsByPalace[palaceIndex];
    return Array.isArray(starsAt) ? starsAt : [];
  };

  const isScopeActiveOnThisPalace = (item: any) => {
    if (palaceIndex < 0) return false;
    const idx = typeof item?.index === "number" ? item.index : Number(item?.index);
    return Number.isInteger(idx) && idx === palaceIndex;
  };

  const decadalStars = getStarsAt(horoscope?.decadal);
  const yearlyStars = getStarsAt(horoscope?.yearly);

  const labelByScope = (item: any, kind: "fortune" | "flow" | "age") => {
    if (!item) return "";
    const n = typeof item?.name === "string" ? item.name : "";
    if (!n) return "";
    if (kind === "age") return n;
    const hs = toCnHeavenlyStem(item?.heavenlyStem);
    return hs ? `${n}·${hs}` : n;
  };

  const dynamicItems: Array<{ key: string; label: string; kind: "fortune" | "flow" | "age" }> = [
    isScopeActiveOnThisPalace(horoscope?.yearly) ? { key: "yearly", label: labelByScope(horoscope?.yearly, "flow"), kind: "flow" } : null,
    isScopeActiveOnThisPalace(horoscope?.monthly) ? { key: "monthly", label: labelByScope(horoscope?.monthly, "flow"), kind: "flow" } : null,
    isScopeActiveOnThisPalace(horoscope?.daily) ? { key: "daily", label: labelByScope(horoscope?.daily, "flow"), kind: "flow" } : null,
    isScopeActiveOnThisPalace(horoscope?.hourly) ? { key: "hourly", label: labelByScope(horoscope?.hourly, "flow"), kind: "flow" } : null,
    isScopeActiveOnThisPalace(horoscope?.age) ? { key: "age", label: labelByScope(horoscope?.age, "age") || "小限", kind: "age" } : null,
    isScopeActiveOnThisPalace(horoscope?.decadal) ? { key: "decadal", label: labelByScope(horoscope?.decadal, "fortune"), kind: "fortune" } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; kind: "fortune" | "flow" | "age" }>;

  const renderStar = (s: any, key: string) => {
    const name = typeof s?.name === "string" ? s.name : "";
    const mutagen = typeof s?.mutagen === "string" ? s.mutagen : null;
    const brightness = typeof s?.brightness === "string" ? s.brightness : null;
    const selfBars = showFlyRow ? (flyMutagens.selfByStar[name] ?? []) : [];
    return (
      <span key={key} className={mutagen ? "luxZiweiStar luxZiweiStarMut" : "luxZiweiStar"}>
        {selfBars.length ? (
          <span className="luxZiweiMutagenBars" aria-label="self mutagen">
            {selfBars.map((m) => (
              <span key={m} className={`luxZiweiMutagenBar luxZiweiMutagenBar${m}`} aria-hidden="true" />
            ))}
          </span>
        ) : null}
        <span className="luxZiweiStarName">{name}</span>
        {brightness ? <span className="luxZiweiStarSub">{brightness}</span> : null}
        {mutagen ? <span className="luxZiweiStarSub">{mutagen}</span> : null}
      </span>
    );
  };

  return (
    <div className="luxZiweiPalace" aria-label={palace?.name ?? "palace"}>
      <div className="luxZiweiStars" aria-label="stars">
        {majors.length ? <div className="luxZiweiStarsRow luxZiweiStarsRowMajor">{majors.map((s, i) => renderStar(s, `maj-${i}`))}</div> : null}
        {minors.length ? <div className="luxZiweiStarsRow luxZiweiStarsRowMinor">{minors.map((s, i) => renderStar(s, `min-${i}`))}</div> : null}
        {adjs.length ? <div className="luxZiweiStarsRow luxZiweiStarsRowAdj">{adjs.map((s, i) => renderStar(s, `adj-${i}`))}</div> : null}
      </div>

      {showFlyRow && flyMutagens.items.length ? (
        <div className="luxZiweiFlyRow" aria-label="palace mutagen">
          {flyMutagens.items.map((it) => (
            <span key={it.mutagen} className={`luxZiweiMutagenChip luxZiweiMutagenChip${it.mutagen}`}>
              {it.isSelf ? "自" : ""}
              {it.mutagen}
              {it.star || ""}
              {it.to ? `→${it.to}` : ""}
            </span>
          ))}
        </div>
      ) : null}

      <div className="luxZiweiHoroStars" aria-label="horoscope stars">
        <div className="luxZiweiHoroCol">
          {decadalStars.map((s, i) => (
            <span key={`d-${i}`} className="luxZiweiHoroStar luxZiweiHoroStarFortune">
              {String(s?.name ?? "")}
            </span>
          ))}
        </div>
        <div className="luxZiweiHoroCol">
          {yearlyStars.map((s, i) => (
            <span key={`f-${i}`} className="luxZiweiHoroStar luxZiweiHoroStarFlow">
              {String(s?.name ?? "")}
            </span>
          ))}
        </div>
      </div>

      <div className="luxZiweiPalaceFooter" aria-label="footer">
        <div className="luxZiweiPalaceFooterSide">
          <div className="luxZiweiPalaceFooterMini">{String(palace?.changsheng12 ?? "")}</div>
          <div className="luxZiweiPalaceFooterMini">{String(palace?.boshi12 ?? "")}</div>
        </div>
        <div className="luxZiweiPalaceFooterCenter">
          <div className="luxZiweiPalaceFooterName">
            {palace?.name ?? ""}
            {nameSuffix}
          </div>
          <div className="luxZiweiPalaceFooterScope">
            <span className="luxZiweiPalaceFooterAges">{Array.isArray(palace?.ages) ? palace.ages.join(" ") : ""}</span>
            {decadalRange ? <span className="luxZiweiPalaceFooterDecadal">{decadalRange}</span> : null}
          </div>
          {dynamicItems.length ? (
            <div className="luxZiweiPalaceFooterDynamic" aria-label="scope">
              {dynamicItems.map((it) => (
                <span
                  key={it.key}
                  className={`luxZiweiScopeBtn luxZiweiScopeBtn${it.kind}`}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(String(palace?.name ?? ""));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(String(palace?.name ?? ""));
                    }
                  }}
                >
                  {it.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="luxZiweiPalaceFooterSide">
          <div className="luxZiweiPalaceFooterMini">{String(palace?.jiangqian12 ?? "")}</div>
          <div className="luxZiweiPalaceFooterMini">{String(palace?.suiqian12 ?? "")}</div>
          <div className="luxZiweiPalaceFooterGz">
            {hs}
            {eb}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ZiweiStep2Page({ session, go }: { session: SessionState; go: (path: string) => void }) {
  const input = session.ziweiInput;
  const astrolabe = useMemo(() => {
    if (!input) return null;
    try {
      return buildAstrolabe(input);
    } catch {
      return null;
    }
  }, [input]);

  const [horoDate, setHoroDate] = useState(() => todayYmd());
  const [horoTimeIndex, setHoroTimeIndex] = useState(() => 0);

  const navRef = useRef<HTMLDivElement | null>(null);
  const [navWidth, setNavWidth] = useState(0);
  const [hideLevel, setHideLevel] = useState(0);

  const [hoveredPalaceName, setHoveredPalaceName] = useState<string | null>(null);
  const [selectedPalaceName, setSelectedPalaceName] = useState<string | null>(null);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const palaceCellEls = useRef<Record<string, HTMLDivElement | null>>({});
  const [surroundNames, setSurroundNames] = useState<string[]>([]);
  const [centerLines, setCenterLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [centerSize, setCenterSize] = useState(() => ({ width: 0, height: 0 }));

  if (!input) {
    return (
      <main className="luxMain">
        <section className="luxSection">
          <div className="luxContainer">
            <div className="luxPanel">
              <div className="luxPanelTitle">未找到星盘输入信息</div>
              <div className="luxPanelLead">请先完成 Step 1 输入并生成星盘。</div>
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/ziwei")}
              >
                返回输入
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!astrolabe) {
    return (
      <main className="luxMain">
        <section className="luxSection">
          <div className="luxContainer">
            <div className="luxPanel">
              <div className="luxPanelTitle">星盘排盘失败</div>
              <div className="luxPanelLead">请检查日期、时间与闰月信息是否正确。</div>
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/ziwei")}
              >
                返回修改
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const palaces: any[] = Array.isArray(astrolabe.palaces) ? astrolabe.palaces : [];

  const horoscope = useMemo(() => {
    try {
      return astrolabe.horoscope(horoDate, horoTimeIndex);
    } catch {
      return null;
    }
  }, [astrolabe, horoDate, horoTimeIndex]);

  const solarIsToday = horoscope?.solarDate === todayYmd();

  const palaceNameByIndex = (idx: unknown) => {
    const n = typeof idx === "number" ? idx : Number(idx);
    if (!Number.isInteger(n) || n < 0 || n > 11) return "";
    try {
      const p = astrolabe.palace(n as any);
      return p?.name ? String(p.name) : "";
    } catch {
      return "";
    }
  };

  const palaceNameByHoroscopeItem = (item: any) => {
    return palaceNameByIndex(item?.index);
  };

  const formatHoroscopeItem = (item: any) => {
    if (!item) return "";
    const hs = toCnHeavenlyStem(item.heavenlyStem);
    const eb = toCnEarthlyBranch(item.earthlyBranch);
    const pName = palaceNameByHoroscopeItem(item);
    return `${pName}${pName ? "·" : ""}${hs}${eb}`;
  };

  const formatMutagen = (mutagen: any) => {
    if (!Array.isArray(mutagen)) return "";
    const names = mutagen.map((v) => String(v ?? "")).filter(Boolean);
    return names.length ? names.join(" ") : "";
  };

  const onBtn = (delta: { years?: number; months?: number; days?: number }) => {
    setHoroDate((v) => shiftYmd(v, delta));
  };
  const onHour = (dir: -1 | 1) => {
    setHoroTimeIndex((v) => {
      const next = (v + dir + 13) % 13;
      return next;
    });
  };

  const onKeyPress = (handler: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect?.width ?? 0);
      setNavWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    setHideLevel(0);
  }, [navWidth]);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    if (hideLevel >= 4) return;
    const raf = requestAnimationFrame(() => {
      const cur = navRef.current;
      if (!cur) return;
      const overflow = cur.scrollWidth > cur.clientWidth + 1;
      if (overflow) setHideLevel((v) => Math.min(4, v + 1));
    });
    return () => cancelAnimationFrame(raf);
  }, [hideLevel, navWidth]);

  const activePalaceName = hoveredPalaceName ?? selectedPalaceName;

  useLayoutEffect(() => {
    if (!activePalaceName) {
      setSurroundNames([]);
      setCenterLines([]);
      return;
    }
    try {
      const sur = astrolabe.surroundedPalaces(activePalaceName as any);
      // San Fang (Wealth, Career) + Si Zheng (Opposite)
      const rawNames = [sur?.wealth?.name, sur?.career?.name, sur?.opposite?.name].filter(Boolean) as string[];
      setSurroundNames(Array.from(new Set(rawNames)));
    } catch {
      setSurroundNames([]);
    }
  }, [activePalaceName, astrolabe]);

  useLayoutEffect(() => {
    const wrap = boardWrapRef.current;
    const center = centerRef.current;
    if (!wrap) return;
    if (!center) return;

    const update = () => {
      const cRect = center.getBoundingClientRect();
      setCenterSize({ width: Math.round(cRect.width), height: Math.round(cRect.height) });

      if (!activePalaceName) {
        setCenterLines([]);
        return;
      }

      const getPoint = (name: string) => {
        const el = palaceCellEls.current[name] ?? null;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };

      const cx = cRect.left + cRect.width / 2;
      const cy = cRect.top + cRect.height / 2;
      const halfW = cRect.width / 2;
      const halfH = cRect.height / 2;

      let pTarget: { x: number; y: number } | null = null;
      let pWealth: { x: number; y: number } | null = null;
      let pCareer: { x: number; y: number } | null = null;
      let pOpposite: { x: number; y: number } | null = null;

      try {
        const sur = astrolabe.surroundedPalaces(activePalaceName as any);
        pTarget = getPoint(activePalaceName);
        pWealth = sur?.wealth?.name ? getPoint(sur.wealth.name) : null;
        pCareer = sur?.career?.name ? getPoint(sur.career.name) : null;
        pOpposite = sur?.opposite?.name ? getPoint(sur.opposite.name) : null;
      } catch {
        // ignore
      }

      // Project point onto the bounding box of the center palace (inset by padding)
      // The line from (cx, cy) to p intersects the box edge.
      const projectToEdge = (p: { x: number; y: number }) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: halfW, y: halfH }; // should not happen

        // Calculate intersection with box [-halfW, halfW] x [-halfH, halfH]
        // Line: (0,0) + t * (dx, dy)
        // t_x = +/- halfW / dx
        // t_y = +/- halfH / dy
        
        // Use a slightly smaller box to avoid edge clipping issues
        const boxW = halfW;
        const boxH = halfH;

        let t = Number.POSITIVE_INFINITY;

        if (dx !== 0) {
          const tx = (dx > 0 ? boxW : -boxW) / dx;
          if (tx > 0) t = Math.min(t, tx);
        }
        if (dy !== 0) {
          const ty = (dy > 0 ? boxH : -boxH) / dy;
          if (ty > 0) t = Math.min(t, ty);
        }

        return {
          x: halfW + dx * t,
          y: halfH + dy * t,
        };
      };

      const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

      const addLine = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        const t1 = projectToEdge(p1);
        const t2 = projectToEdge(p2);
        lines.push({ x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y });
      };

      // Triangle: Target -> Wealth -> Career -> Target
      if (pTarget && pWealth) addLine(pTarget, pWealth);
      if (pWealth && pCareer) addLine(pWealth, pCareer);
      if (pCareer && pTarget) addLine(pCareer, pTarget);
      
      // Opposition: Target -> Opposite
      if (pTarget && pOpposite) addLine(pTarget, pOpposite);

      setCenterLines(lines);
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(wrap);
    ro.observe(center);
    wrap.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      wrap.removeEventListener("scroll", update);
    };
  }, [activePalaceName, astrolabe]);

  return (
    <main className="luxMain">
      <section className="luxSection" aria-label="Ziwei confirm">
        <div className="luxContainer">
          <div className="luxSectionHeader luxSectionHeaderRow">
            <div>
              <div className="luxSectionKicker">STEP 2</div>
              <h2 className="luxH2">紫微斗数星盘确认</h2>
              <p className="luxP">核对日期、时辰与性别信息后，查看十二宫星曜分布。</p>
            </div>
            <div className="luxStepTrail" aria-label="Trail">
              <span className="luxStepTrailItem">输入</span>
              <IconChevronRight />
              <span className="luxStepTrailItem luxStepTrailItemOn">星盘</span>
            </div>
          </div>

          <div className="luxConfirmStack">
            <div className="luxConfirmHero luxGradientA" aria-label="Case header">
              <div className="luxConfirmHeroTop">
                <div>
                  <div className="luxConfirmHeroKicker">CASE PROFILE</div>
                  <div className="luxConfirmHeroTitle">
                    {input.name || "命主"}
                    <span className="luxConfirmHeroGender"> 性别 {genderLabel(input.gender)}</span>
                  </div>
                  <div className="luxConfirmHeroSub">紫微斗数星盘确认</div>
                </div>
              </div>
              <div className="luxConfirmMetaGrid">
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">输入历法</div>
                  <div className="luxConfirmMetaValue">
                    {input.calendar === "solar" ? "阳历" : "阴历"} {formatDateYmd(input.date)} {formatTimeLabel(input.time)}
                    {input.calendar === "lunar" && input.date.isLeapMonth ? " (闰月)" : ""}
                  </div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">星盘阳历</div>
                  <div className="luxConfirmMetaValue">{astrolabe.solarDate}</div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">星盘阴历</div>
                  <div className="luxConfirmMetaValue">{astrolabe.lunarDate}</div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">出生地</div>
                  <div className="luxConfirmMetaValue">
                    {String((input as any)?.location?.province ?? "")} {String((input as any)?.location?.city ?? "")} (经度 {String((input as any)?.location?.longitude ?? "")})
                  </div>
                </div>
              </div>
            </div>

            <div className="luxCardGrid">
              <div className="luxCard luxCardBlock luxCardSpan luxCardHero luxGradientB">
                <div className="luxCardTitle">星盘排盘信息</div>
                <div className="luxZiweiBoardWrap" ref={boardWrapRef}>
                  <div className="luxZiweiBoard" aria-label="Ziwei astrolabe">
                    <div className="luxZiweiCenter" aria-label="center" ref={centerRef}>
                      {centerLines.length > 0 ? (
                        <svg
                          className="luxZiweiCenterLines"
                          aria-hidden="true"
                          width="100%"
                          height="100%"
                          viewBox={`0 0 ${centerSize.width || 1} ${centerSize.height || 1}`}
                          preserveAspectRatio="none"
                        >
                          {centerLines.map((l, i) => (
                            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
                          ))}
                        </svg>
                      ) : null}
                      <div className="luxZiweiCenterSectionTitle">{input.gender === "male" ? "♂" : "♀"} 基本信息</div>
                      <div className="luxZiweiCenterList" aria-label="basic">
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">姓名：</div>
                          <div className="luxZiweiCenterVal">{input.name || "命主"}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">五行局：</div>
                          <div className="luxZiweiCenterVal">{String(astrolabe.fiveElementsClass)}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">年龄(虚岁)：</div>
                          <div className="luxZiweiCenterVal">{horoscope ? `${horoscope.age.nominalAge} 岁` : ""}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">四柱：</div>
                          <div className="luxZiweiCenterVal">{toCnGanzhiText(astrolabe.chineseDate)}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">阳历：</div>
                          <div className="luxZiweiCenterVal">{astrolabe.solarDate}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">农历：</div>
                          <div className="luxZiweiCenterVal">{astrolabe.lunarDate}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">时辰：</div>
                          <div className="luxZiweiCenterVal">
                            {astrolabe.time}({astrolabe.timeRange})
                          </div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">生肖：</div>
                          <div className="luxZiweiCenterVal">{astrolabe.zodiac}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">星座：</div>
                          <div className="luxZiweiCenterVal">{astrolabe.sign}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">命主：</div>
                          <div className="luxZiweiCenterVal">{String(astrolabe.soul)}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">身主：</div>
                          <div className="luxZiweiCenterVal">{String(astrolabe.body)}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">命宫：</div>
                          <div className="luxZiweiCenterVal">{toCnEarthlyBranch(astrolabe.earthlyBranchOfSoulPalace)}</div>
                        </div>
                        <div className="luxZiweiCenterRow">
                          <div className="luxZiweiCenterKey">身宫：</div>
                          <div className="luxZiweiCenterVal">{toCnEarthlyBranch(astrolabe.earthlyBranchOfBodyPalace)}</div>
                        </div>
                      </div>

                      <div className="luxZiweiCenterDivider" aria-hidden="true" />
                      <div className="luxZiweiCenterSectionTitle">运限信息</div>
                      {horoscope ? (
                        <div className="luxZiweiHoro" aria-label="horoscope">
                          <div className="luxZiweiHoroGrid" aria-label="horo-grid">
                            <div className="luxZiweiHoroBlock" aria-label="horo-left">
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">农历：</div>
                                <div className="luxZiweiCenterVal">{horoscope.lunarDate}</div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">阳历：</div>
                                <div className="luxZiweiCenterVal">
                                  {horoscope.solarDate}
                                  {solarIsToday ? <span className="luxZiweiHoroMark">今</span> : null}
                                </div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">大限：</div>
                                <div className="luxZiweiCenterVal">{formatHoroscopeItem(horoscope.decadal)}</div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">小限：</div>
                                <div className="luxZiweiCenterVal">{`${horoscope.age.nominalAge} 岁 ${formatHoroscopeItem(horoscope.age)}`.trim()}</div>
                              </div>
                            </div>

                            <div className="luxZiweiHoroBlock" aria-label="horo-right">
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">流年：</div>
                                <div className="luxZiweiCenterVal">{formatHoroscopeItem(horoscope.yearly)}</div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">流月：</div>
                                <div className="luxZiweiCenterVal">{formatHoroscopeItem(horoscope.monthly)}</div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">流日：</div>
                                <div className="luxZiweiCenterVal">{formatHoroscopeItem(horoscope.daily)}</div>
                              </div>
                              <div className="luxZiweiCenterRow">
                                <div className="luxZiweiCenterKey">流时：</div>
                                <div className="luxZiweiCenterVal">{formatHoroscopeItem(horoscope.hourly)}</div>
                              </div>
                              {formatMutagen(horoscope.decadal?.mutagen) ? (
                                <div className="luxZiweiCenterRow">
                                  <div className="luxZiweiCenterKey">大限四化：</div>
                                  <div className="luxZiweiCenterVal">{formatMutagen(horoscope.decadal.mutagen)}</div>
                                </div>
                              ) : null}
                              {formatMutagen(horoscope.yearly?.mutagen) ? (
                                <div className="luxZiweiCenterRow">
                                  <div className="luxZiweiCenterKey">流年四化：</div>
                                  <div className="luxZiweiCenterVal">{formatMutagen(horoscope.yearly.mutagen)}</div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="luxZiweiHoroNav" aria-label="nav" ref={navRef}>
                            {hideLevel < 1 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ years: -10 })}
                                onKeyDown={onKeyPress(() => onBtn({ years: -10 }))}
                              >
                                ◀限
                              </span>
                            ) : null}
                            {hideLevel < 2 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ years: -1 })}
                                onKeyDown={onKeyPress(() => onBtn({ years: -1 }))}
                              >
                                ◀年
                              </span>
                            ) : null}
                            {hideLevel < 3 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ months: -1 })}
                                onKeyDown={onKeyPress(() => onBtn({ months: -1 }))}
                              >
                                ◀月
                              </span>
                            ) : null}
                            {hideLevel < 4 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ days: -1 })}
                                onKeyDown={onKeyPress(() => onBtn({ days: -1 }))}
                              >
                                ◀日
                              </span>
                            ) : null}
                            <span
                              className="luxZiweiHoroBtn"
                              role="button"
                              tabIndex={0}
                              onClick={() => onHour(-1)}
                              onKeyDown={onKeyPress(() => onHour(-1))}
                            >
                              ◀时
                            </span>
                            <span className="luxZiweiHoroHour">{timeLabelByIndex(horoTimeIndex)}</span>
                            <span
                              className="luxZiweiHoroBtn"
                              role="button"
                              tabIndex={0}
                              onClick={() => onHour(1)}
                              onKeyDown={onKeyPress(() => onHour(1))}
                            >
                              时▶
                            </span>
                            {hideLevel < 4 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ days: 1 })}
                                onKeyDown={onKeyPress(() => onBtn({ days: 1 }))}
                              >
                                日▶
                              </span>
                            ) : null}
                            {hideLevel < 3 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ months: 1 })}
                                onKeyDown={onKeyPress(() => onBtn({ months: 1 }))}
                              >
                                月▶
                              </span>
                            ) : null}
                            {hideLevel < 2 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ years: 1 })}
                                onKeyDown={onKeyPress(() => onBtn({ years: 1 }))}
                              >
                                年▶
                              </span>
                            ) : null}
                            {hideLevel < 1 ? (
                              <span
                                className="luxZiweiHoroBtn"
                                role="button"
                                tabIndex={0}
                                onClick={() => onBtn({ years: 10 })}
                                onKeyDown={onKeyPress(() => onBtn({ years: 10 }))}
                              >
                                限▶
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {gridPalaceBranchIndexes.map((branchIndex, cellIndex) => {
                      if (branchIndex === null) return null;
                      const palace = palaces[branchIndex];
                      const palaceName = typeof palace?.name === "string" ? palace.name : "";
                      if (!palaceName) return null;

                      const isFocused = Boolean(activePalaceName) && palaceName === activePalaceName;
                      const isSurrounded = Boolean(activePalaceName) && surroundNames.includes(palaceName);
                      const isDim = Boolean(activePalaceName) && !isFocused && !isSurrounded;
                      return (
                        <div
                          key={cellIndex}
                          className={`luxZiweiCell luxZiweiCell${cellIndex}${isDim ? " luxZiweiCellDim" : ""}${isFocused ? " luxZiweiCellFocused" : ""}${isSurrounded ? " luxZiweiCellSurrounded" : ""}`}
                          ref={(el) => {
                            palaceCellEls.current[palaceName] = el;
                          }}
                          onMouseEnter={() => setHoveredPalaceName(palaceName)}
                          onMouseLeave={() => setHoveredPalaceName(null)}
                          onClick={() => setSelectedPalaceName((v) => (v === palaceName ? null : palaceName))}
                          role="button"
                          tabIndex={0}
                          onKeyDown={onKeyPress(() => setSelectedPalaceName((v) => (v === palaceName ? null : palaceName)))}
                        >
                          <PalaceCell
                            palace={palace}
                            horoscope={horoscope}
                            showFlyRow={Boolean(activePalaceName) && palaceName === activePalaceName}
                            onSelect={(name) => setSelectedPalaceName((v) => (v === name ? null : name))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="luxCardGrid luxCardGridSplit">
                <div className="luxCard luxCardBlock luxCardHero luxGradientC">
                  <div className="luxCardTitle">核心摘要</div>
                  <div className="luxMetaList">
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">干支</div>
                      <div className="luxMetaVal">{toCnGanzhiText(astrolabe.chineseDate)}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">时辰</div>
                      <div className="luxMetaVal">
                        {astrolabe.time} ({astrolabe.timeRange})
                      </div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">命宫地支</div>
                      <div className="luxMetaVal">{toCnEarthlyBranch(astrolabe.earthlyBranchOfSoulPalace)}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">身宫地支</div>
                      <div className="luxMetaVal">{toCnEarthlyBranch(astrolabe.earthlyBranchOfBodyPalace)}</div>
                    </div>
                  </div>
                </div>

                <div className="luxCard luxCardBlock luxCardHero luxGradientD">
                  <div className="luxCardTitle">操作</div>
                  <div className="luxActions luxActionsStack">
                    <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => go("#/ziwei")}
                    >
                      返回修改信息
                    </button>
                    <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/ziwei/confirm")}
                    >
                      刷新星盘
                    </button>
                  </div>
                  <div className="luxHint">提示：星盘页面当前仅用于展示十二宫与星曜分布，后续可扩展运限与解读。</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
