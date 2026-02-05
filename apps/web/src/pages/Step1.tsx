import type { BirthInput } from "@life-coordinates/core";
import { BirthInputSchema } from "@life-coordinates/core";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { postJson, readJson } from "../lib/api";
import type { SessionState } from "../lib/storage";
import { saveSession } from "../lib/storage";
import type { PaipanResult } from "@life-coordinates/core";
import chinaAreaData from "china-area-data";

type GeoCandidate = {
  displayName: string;
  name: string;
  province?: string;
  city?: string;
  district?: string;
  longitude?: number;
};

type GeoGeocodeRes = { candidate: GeoCandidate | null };
type GeoRegionItem = { name: string; province?: string; city?: string; district?: string };
type GeoRegionRes = { items: GeoRegionItem[] };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function daysInSolarMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function buildRange(min: number, max: number) {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

function Sheet({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="luxSheetBackdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="luxSheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="luxSheetTop">
          <div className="luxSheetTitle">{title}</div>
          <button type="button" className="luxSheetClose" onClick={onClose} aria-label="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function WheelColumn({
  header,
  options,
  value,
  onValue
}: {
  header: string;
  options: string[];
  value: string;
  onValue: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const itemH = 40;

  const lastWheelTimeRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, options.indexOf(value));
    // 确保选中项在中间位置
    const centerOffset = (el.clientHeight - itemH) / 2;
    const paddingTop = 86; // padding-top 值
    let targetScrollTop = idx * itemH - centerOffset + paddingTop;
    // 确保第一项和最后一项也能正确对齐
    const maxScrollTop = (options.length - 1) * itemH + paddingTop - centerOffset;
    const minScrollTop = Math.max(0, paddingTop - centerOffset); // 确保不为负数
    targetScrollTop = Math.max(minScrollTop, Math.min(maxScrollTop, targetScrollTop));
    // 只在位置需要调整时才滚动
    if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
      isScrollingRef.current = true;
      el.scrollTop = targetScrollTop;
      // 重置标志
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  }, [options, value]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el || !options.length) return;

    const now = Date.now();
    // 节流：防止滚动过快
    if (timerRef.current && now - (lastWheelTimeRef.current || 0) < 60) return;
    lastWheelTimeRef.current = now;

    // 清除之前的对齐定时器
    if (timerRef.current) window.clearTimeout(timerRef.current);
    isScrollingRef.current = true;

    const direction = Math.sign(e.deltaY);
    const currentScrollTop = el.scrollTop;
    const currentIndex = Math.round(currentScrollTop / itemH);
    
    let targetIndex = currentIndex + direction;
    targetIndex = Math.max(0, Math.min(options.length - 1, targetIndex));

    const targetScrollTop = targetIndex * itemH;

    el.scrollTo({
      top: targetScrollTop,
      behavior: "smooth"
    });

    // 触发值更新
    onValue(options[targetIndex]);

    // 滚动结束后释放锁
    timerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
      // 再次强制对齐，防止 smooth 滚动未完全到位
      if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
        el.scrollTop = targetScrollTop;
      }
    }, 250);
  };

  return (
    <div className="luxWheelCol">
      <div className="luxWheelHeader">{header}</div>
      <div className="luxWheelBody">
        <div className="luxWheelScroller" ref={ref} onWheel={onWheel}>
          {options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={"luxWheelItem" + (opt === value ? " luxWheelItemOn" : "")}
              onClick={() => {
                const idx = options.indexOf(opt);
                if (ref.current && idx >= 0) {
                  isScrollingRef.current = true;
                  if (timerRef.current) window.clearTimeout(timerRef.current);
                  
                  const targetScrollTop = idx * 40;
                  ref.current.scrollTo({ top: targetScrollTop, behavior: "smooth" });
                  
                  timerRef.current = window.setTimeout(() => {
                    isScrollingRef.current = false;
                  }, 250);
                }
                onValue(opt);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegionColumn({
  header,
  options,
  value,
  onValue,
  emptyText
}: {
  header: string;
  options: string[];
  value: string;
  onValue: (v: string) => void;
  emptyText?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const itemH = 40;

  const lastWheelTimeRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !options.length) return;
    
    if (isScrollingRef.current) return;

    const idx = Math.max(0, options.indexOf(value));
    const targetScrollTop = idx * itemH; 

    if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
      el.scrollTop = targetScrollTop;
    }
  }, [options, value]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el || !options.length) return;

    const now = Date.now();
    if (timerRef.current && now - (lastWheelTimeRef.current || 0) < 60) return;
    lastWheelTimeRef.current = now;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    isScrollingRef.current = true;

    const direction = Math.sign(e.deltaY);
    const currentScrollTop = el.scrollTop;
    const currentIndex = Math.round(currentScrollTop / itemH);
    
    let targetIndex = currentIndex + direction;
    targetIndex = Math.max(0, Math.min(options.length - 1, targetIndex));

    const targetScrollTop = targetIndex * itemH;

    el.scrollTo({
      top: targetScrollTop,
      behavior: "smooth"
    });

    onValue(options[targetIndex]);

    timerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
      if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
        el.scrollTop = targetScrollTop;
      }
    }, 250);
  };

  return (
    <div className="luxPickerCol">
      <div className="luxPickerHead">{header}</div>
      <div className="luxPickerBody">
        <div className="luxPickerList" ref={ref} onWheel={onWheel}>
          {options.length ? (
            options.map((opt) => (
              <button
                type="button"
                key={opt}
                className={"luxPickerItem" + (opt === value ? " luxPickerItemOn" : "")}
                onClick={() => {
                  const idx = options.indexOf(opt);
                  if (ref.current && idx >= 0) {
                    isScrollingRef.current = true;
                    if (timerRef.current) window.clearTimeout(timerRef.current);
                    
                    const targetScrollTop = idx * itemH;
                    ref.current.scrollTo({ top: targetScrollTop, behavior: "smooth" });
                    
                    timerRef.current = window.setTimeout(() => {
                      isScrollingRef.current = false;
                    }, 250);
                  }
                  onValue(opt);
                }}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="luxPickerEmpty">{emptyText ?? "暂无"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Step1Page({
  session,
  onSession,
  go
}: {
  session: SessionState;
  onSession: (next: SessionState) => void;
  go: (path: string) => void;
}) {
  const initial = session.input;
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<BirthInput["gender"]>(initial?.gender ?? "male");

  const [calendar, setCalendar] = useState<BirthInput["calendar"]>(initial?.calendar ?? "solar");
  const [year, setYear] = useState<number>(() => initial?.date.year ?? new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => initial?.date.month ?? new Date().getMonth() + 1);
  const [day, setDay] = useState<number>(() => initial?.date.day ?? new Date().getDate());
  const [isLeapMonth, setIsLeapMonth] = useState(Boolean(initial?.date.isLeapMonth));

  const [timeMode, setTimeMode] = useState<BirthInput["time"]["mode"]>(initial?.time.mode ?? "exact");
  const [hour, setHour] = useState<number>(() => (initial?.time.mode === "exact" ? initial.time.hour : new Date().getHours()));
  const [minute, setMinute] = useState<number>(() => (initial?.time.mode === "exact" ? initial.time.minute : new Date().getMinutes()));
  const [timeLabel, setTimeLabel] = useState<Extract<BirthInput["time"], { mode: "segment" }>["label"]>(
    initial?.time.mode === "segment" ? initial.time.label : "子时"
  );

  const [province, setProvince] = useState(initial?.location.province ?? "");
  const [city, setCity] = useState(initial?.location.city ?? "");
  const [district, setDistrict] = useState("");
  const [longitude, setLongitude] = useState<number | null>(initial?.location.longitude ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);

  const [tmpCalendar, setTmpCalendar] = useState<BirthInput["calendar"]>("solar");
  const [tmpYear, setTmpYear] = useState<number>(year);
  const [tmpMonth, setTmpMonth] = useState<number>(month);
  const [tmpDay, setTmpDay] = useState<number>(day);
  const [tmpLeap, setTmpLeap] = useState<boolean>(isLeapMonth);
  const [tmpTimeMode, setTmpTimeMode] = useState<BirthInput["time"]["mode"]>(timeMode);
  const [tmpHour, setTmpHour] = useState<number>(hour);
  const [tmpMinute, setTmpMinute] = useState<number>(minute);
  const [tmpLabel, setTmpLabel] = useState(timeLabel);

  const [addrTab, setAddrTab] = useState<"domestic" | "overseas">("domestic");
  const [addrQuery, setAddrQuery] = useState("");
  const [addrCandidates, setAddrCandidates] = useState<GeoCandidate[]>([]);
  const [regionProvinces, setRegionProvinces] = useState<string[]>([]);
  const [regionCities, setRegionCities] = useState<string[]>([]);
  const [regionDistricts, setRegionDistricts] = useState<string[]>([]);
  const [tmpProvince, setTmpProvince] = useState("");
  const [tmpCity, setTmpCity] = useState("");
  const [tmpDistrict, setTmpDistrict] = useState("");
  const [addrSearchMode, setAddrSearchMode] = useState(false); // 是否显示搜索模式

  // 使用本地数据进行地址搜索
  const searchAddressLocal = useMemo(() => {
    // 构建扁平化的地址数据，便于搜索
    const addressList: Array<{ province: string; city: string; district: string }> = [];
    
    // china-area-data 的数据结构：{ "86": { "110000": "北京市", "120000": "天津市", ... } }
    const provinces = chinaAreaData["86"] || {};
    
    for (const [provinceCode, provinceName] of Object.entries(provinces)) {
      const cities = chinaAreaData[provinceCode] || {};
      
      for (const [cityCode, cityName] of Object.entries(cities)) {
        const districts = chinaAreaData[cityCode] || {};
        
        // 如果有区县数据
        if (Object.keys(districts).length > 0) {
          for (const districtName of Object.values(districts)) {
            addressList.push({
              province: String(provinceName),
              city: String(cityName),
              district: String(districtName)
            });
          }
        } else {
          // 如果没有区县数据，只添加城市
          addressList.push({
            province: String(provinceName),
            city: String(cityName),
            district: ""
          });
        }
      }
    }
    
    return (keyword: string): GeoCandidate[] => {
      if (!keyword.trim()) return [];
      
      const keywordLower = keyword.toLowerCase().trim();
      const results: GeoCandidate[] = [];
      const seen = new Set<string>();
      
      for (const addr of addressList) {
        // 只检查非空字段是否包含搜索词（不使用反向包含，避免误匹配）
        const provinceMatch = addr.province && addr.province.toLowerCase().includes(keywordLower);
        const cityMatch = addr.city && addr.city.toLowerCase().includes(keywordLower);
        const districtMatch = addr.district && addr.district.toLowerCase().includes(keywordLower);
        
        // 只有当省份、城市或区县名称包含搜索词时才匹配
        if (provinceMatch || cityMatch || districtMatch) {
          const parts: string[] = [];
          if (addr.province) parts.push(addr.province);
          if (addr.city) parts.push(addr.city);
          if (addr.district) parts.push(addr.district);
          
          const displayName = parts.join(" - ");
          const key = displayName;
          
          // 去重
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              displayName,
              name: addr.district || addr.city || addr.province,
              province: addr.province || undefined,
              city: addr.city || undefined,
              district: addr.district || undefined
            });
          }
        }
      }
      
      return results;
    };
  }, []);

  const segmentOptions: Extract<BirthInput["time"], { mode: "segment" }>["label"][] = useMemo(
    () => ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时", "上午", "下午"],
    []
  );

  const years = useMemo(() => buildRange(1800, 2200).map(String), []);
  const months = useMemo(() => buildRange(1, 12).map((n) => pad2(n)), []);
  const hours = useMemo(() => buildRange(0, 23).map((n) => pad2(n)), []);
  const minutes = useMemo(() => buildRange(0, 59).map((n) => pad2(n)), []);

  const tmpDayOptions = useMemo(() => {
    const maxDay = tmpCalendar === "solar" ? daysInSolarMonth(tmpYear, tmpMonth) : 30;
    return buildRange(1, maxDay).map((n) => pad2(n));
  }, [tmpCalendar, tmpYear, tmpMonth]);

  const openDateSheet = () => {
    setTmpCalendar(calendar);
    setTmpYear(year);
    setTmpMonth(month);
    setTmpDay(day);
    setTmpLeap(isLeapMonth);
    setTmpTimeMode(timeMode);
    setTmpHour(hour);
    setTmpMinute(minute);
    setTmpLabel(timeLabel);
    setDateOpen(true);
  };

  const confirmDateSheet = () => {
    const y = clampInt(tmpYear, 1800, 2200);
    const m = clampInt(tmpMonth, 1, 12);
    const maxDay = tmpCalendar === "solar" ? daysInSolarMonth(y, m) : 30;
    const d = clampInt(tmpDay, 1, maxDay);
    setCalendar(tmpCalendar);
    setYear(y);
    setMonth(m);
    setDay(d);
    setIsLeapMonth(Boolean(tmpLeap));
    setTimeMode(tmpTimeMode);
    if (tmpTimeMode === "exact") {
      setHour(clampInt(tmpHour, 0, 23));
      setMinute(clampInt(tmpMinute, 0, 59));
    } else {
      setTimeLabel(tmpLabel);
    }
    setDateOpen(false);
  };

  const openAddrSheet = () => {
    setAddrTab("domestic");
    const currentAddr = [province, city, district].filter(Boolean).join(" ");
    setAddrQuery(currentAddr);
    setTmpProvince(province);
    setTmpCity(city);
    setTmpDistrict(district);
    setAddrSearchMode(false); // 默认显示选择器模式
    setAddrOpen(true);
  };

  useEffect(() => {
    if (!addrOpen) return;
    if (addrTab !== "domestic") return;
    const q = addrQuery.trim();
    if (!q) {
      setAddrCandidates([]);
      return;
    }
    // 只有在搜索模式下才进行搜索
    if (!addrSearchMode) return;
    
    const t = window.setTimeout(() => {
      // 使用本地数据进行搜索
      const candidates = searchAddressLocal(q);
      setAddrCandidates(candidates);
    }, 240);
    return () => window.clearTimeout(t);
  }, [addrOpen, addrQuery, addrTab, addrSearchMode, searchAddressLocal]);

  useEffect(() => {
    if (!addrOpen) return;
    if (addrTab !== "domestic") return;
    const t = window.setTimeout(async () => {
      try {
        const res = await readJson<GeoRegionRes>("/api/geo/regions?level=province");
        setRegionProvinces(res.items.map((i) => i.name).filter(Boolean));
      } catch {
        setRegionProvinces([]);
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [addrOpen, addrTab]);

  useEffect(() => {
    if (!addrOpen) return;
    if (addrTab !== "domestic") return;
    if (!tmpProvince) {
      setRegionCities([]);
      setRegionDistricts([]);
      return;
    }
    // 从本地数据加载城市列表
    const provinces = chinaAreaData["86"] || {};
    let provinceCode = "";
    for (const [code, name] of Object.entries(provinces)) {
      if (String(name) === tmpProvince) {
        provinceCode = code;
        break;
      }
    }
    if (provinceCode) {
      const cities = chinaAreaData[provinceCode] || {};
      const cityNames = Object.values(cities).map(String).filter(Boolean);
      setRegionCities(cityNames);
    } else {
      setRegionCities([]);
    }
  }, [addrOpen, addrTab, tmpProvince]);

  useEffect(() => {
    if (!addrOpen) return;
    if (addrTab !== "domestic") return;
    if (!tmpProvince || !tmpCity) {
      setRegionDistricts([]);
      return;
    }
    // 从本地数据加载区县列表
    const provinces = chinaAreaData["86"] || {};
    let provinceCode = "";
    for (const [code, name] of Object.entries(provinces)) {
      if (String(name) === tmpProvince) {
        provinceCode = code;
        break;
      }
    }
    if (provinceCode) {
      const cities = chinaAreaData[provinceCode] || {};
      let cityCode = "";
      for (const [code, name] of Object.entries(cities)) {
        if (String(name) === tmpCity) {
          cityCode = code;
          break;
        }
      }
      if (cityCode) {
        const districts = chinaAreaData[cityCode] || {};
        const districtNames = Object.values(districts).map(String).filter(Boolean);
        setRegionDistricts(districtNames);
      } else {
        setRegionDistricts([]);
      }
    } else {
      setRegionDistricts([]);
    }
  }, [addrOpen, addrTab, tmpProvince, tmpCity]);

  const isSearch = addrQuery.trim().length > 0;

  // 省份选项：始终显示所有省份，如果有搜索则高亮匹配的省份
  const provinceOptions = useMemo(() => {
    return regionProvinces;
  }, [regionProvinces]);

  // 城市选项：如果选择了省份，显示该省份的所有城市；只有在搜索模式下才过滤匹配的城市
  const cityOptions = useMemo(() => {
    if (!tmpProvince) return [];
    // 如果不在搜索模式，或者搜索模式已关闭，显示该省份的所有城市
    if (!addrSearchMode) {
      return regionCities;
    }
    
    // 在搜索模式下，检查输入框内容是否完全匹配当前选择（说明是用户通过列表选择的，不是手动输入的）
    const currentSelection = [tmpProvince, tmpCity, tmpDistrict].filter(Boolean).join(" ");
    const isSelectionMatch = addrQuery.trim() === currentSelection;
    
    // 如果输入框内容与当前选择匹配，说明用户已从搜索结果中选择，显示所有城市
    if (isSelectionMatch) {
      return regionCities;
    }
    
    // 只有当输入框内容与当前选择不匹配时（说明用户在手动输入搜索），才使用搜索过滤
    if (isSearch && addrQuery.trim() && !isSelectionMatch) {
      const set = new Set<string>();
      const queryLower = addrQuery.toLowerCase();
      for (const c of addrCandidates) {
        if (c.province !== tmpProvince) continue;
        const name = c.city || (c.name && c.name !== c.province ? c.name : null);
        if (name && name !== c.province && (!c.province || !name.startsWith(c.province))) {
          if (name.toLowerCase().includes(queryLower)) {
            set.add(name);
          }
        }
      }
      // 如果搜索结果中有匹配的城市，返回搜索结果；否则返回所有城市
      if (set.size > 0) {
        return Array.from(set);
      }
    }
    // 返回该省份的所有城市（保持显示，不因选择而消失）
    return regionCities;
  }, [regionCities, tmpProvince, tmpCity, tmpDistrict, isSearch, addrSearchMode, addrCandidates, addrQuery]);

  // 区县选项：如果选择了城市，显示该城市的所有区县；只有在搜索模式下才过滤匹配的区县
  const districtOptions = useMemo(() => {
    if (!tmpProvince || !tmpCity) return [];
    // 如果不在搜索模式，或者搜索模式已关闭，显示该城市的所有区县
    if (!addrSearchMode) {
      return regionDistricts;
    }
    
    // 在搜索模式下，检查输入框内容是否完全匹配当前选择（说明是用户通过列表选择的，不是手动输入的）
    const currentSelection = [tmpProvince, tmpCity, tmpDistrict].filter(Boolean).join(" ");
    const isSelectionMatch = addrQuery.trim() === currentSelection;
    
    // 如果输入框内容与当前选择匹配，说明用户已从搜索结果中选择，显示所有区县
    if (isSelectionMatch) {
      return regionDistricts;
    }
    
    // 只有当输入框内容与当前选择不匹配时（说明用户在手动输入搜索），才使用搜索过滤
    if (isSearch && addrQuery.trim() && !isSelectionMatch) {
      const set = new Set<string>();
      const queryLower = addrQuery.toLowerCase();
      for (const c of addrCandidates) {
        if (c.province !== tmpProvince) continue;
        const name = c.city || c.name;
        if (name !== tmpCity) continue;
        if (c.district) {
          if (c.district.toLowerCase().includes(queryLower)) {
            set.add(c.district);
          }
        }
      }
      // 如果搜索结果中有匹配的区县，返回搜索结果；否则返回所有区县
      if (set.size > 0) {
        return Array.from(set);
      }
    }
    // 返回该城市的所有区县（保持显示，不因选择而消失）
    return regionDistricts;
  }, [regionDistricts, tmpProvince, tmpCity, tmpDistrict, isSearch, addrSearchMode, addrCandidates, addrQuery]);

  useEffect(() => {
    if (!addrOpen) return;
    if (provinceOptions.length && !provinceOptions.includes(tmpProvince)) setTmpProvince(provinceOptions[0]);
  }, [addrOpen, provinceOptions, tmpProvince]);

  useEffect(() => {
    if (!addrOpen) return;
    if (cityOptions.length && !cityOptions.includes(tmpCity)) setTmpCity(cityOptions[0]);
  }, [addrOpen, cityOptions, tmpCity]);

  useEffect(() => {
    if (!addrOpen) return;
    if (districtOptions.length && tmpDistrict && !districtOptions.includes(tmpDistrict)) setTmpDistrict("");
  }, [addrOpen, districtOptions, tmpDistrict]);


  const confirmAddrSheet = async () => {
    // 如果不在搜索模式，直接使用选择器中的值
    if (!addrSearchMode) {
      if (tmpProvince) setProvince(tmpProvince);
      if (tmpCity) setCity(tmpCity);
      setDistrict(tmpDistrict);
      const q = [tmpCity, tmpProvince].filter(Boolean).join(" ");
      if (!q) {
        setAddrOpen(false);
        return;
      }
      try {
        const res = await readJson<GeoGeocodeRes>(`/api/geo/geocode?q=${encodeURIComponent(q)}`);
        const cand = res.candidate;
        if (cand?.longitude != null && Number.isFinite(cand.longitude)) {
          setLongitude(Math.round(cand.longitude * 10000) / 10000);
        }
      } finally {
        setAddrOpen(false);
      }
      return;
    }
    
    // 在搜索模式下，尝试从搜索结果中找到匹配的候选项
    const pick = addrCandidates.find((c) => {
      const name = c.city || c.name;
      if (tmpProvince && c.province !== tmpProvince) return false;
      if (tmpCity && name !== tmpCity) return false;
      if (tmpDistrict && c.district !== tmpDistrict) return false;
      return true;
    });
    
    // 如果找到了匹配的候选项，使用候选项的值
    if (pick) {
      if (pick.province) setProvince(pick.province);
      setCity(pick.city || pick.name);
      setDistrict(tmpDistrict || pick.district || "");
      if (pick.longitude != null && Number.isFinite(pick.longitude)) {
        setLongitude(Math.round(pick.longitude * 10000) / 10000);
        setAddrOpen(false);
        return;
      }
    } else {
      // 如果没有找到匹配的候选项，使用当前选择的值
      if (tmpProvince) setProvince(tmpProvince);
      if (tmpCity) setCity(tmpCity);
      setDistrict(tmpDistrict);
    }
    
    // 获取经纬度
    const q = [tmpCity, tmpProvince].filter(Boolean).join(" ");
    if (!q) {
      setAddrOpen(false);
      return;
    }
    try {
      const res = await readJson<GeoGeocodeRes>(`/api/geo/geocode?q=${encodeURIComponent(q)}`);
      const cand = res.candidate;
      if (cand?.longitude != null && Number.isFinite(cand.longitude)) {
        setLongitude(Math.round(cand.longitude * 10000) / 10000);
      }
    } finally {
      setAddrOpen(false);
    }
  };

  const dateText = useMemo(() => {
    const leap = calendar === "lunar" && isLeapMonth ? "（闰）" : "";
    return `${calendar === "solar" ? "公历" : "农历"} ${year}-${pad2(month)}-${pad2(day)}${leap}`;
  }, [calendar, year, month, day, isLeapMonth]);

  const timeText = useMemo(() => {
    return timeMode === "exact" ? `${pad2(hour)}:${pad2(minute)}` : timeLabel;
  }, [timeMode, hour, minute, timeLabel]);

  const addrText = useMemo(() => {
    if (!province || !city) return "请选择";
    return [province, city, district].filter(Boolean).join(" ");
  }, [province, city, district]);

  const addrSubText = useMemo(() => {
    if (longitude != null && Number.isFinite(longitude)) return `已自动获取经度 ${longitude}`;
    return "用于真太阳时修正（自动取经度）";
  }, [longitude]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const lon = longitude == null ? NaN : Number(longitude);
    const input: BirthInput = {
      name,
      gender,
      calendar,
      date: {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        ...(calendar === "lunar" ? { isLeapMonth } : {})
      },
      time: timeMode === "exact" ? { mode: "exact", hour: Number(hour), minute: Number(minute) } : { mode: "segment", label: timeLabel },
      location: {
        province: province.trim(),
        city: city.trim(),
        longitude: lon
      }
    };

    const parsed = BirthInputSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ? `输入有误：${first.message}` : "输入有误，请检查后再试");
      return;
    }

    setBusy(true);
    try {
      const res = await postJson<{ paipan: PaipanResult }>("/api/paipan", parsed.data);
      const next: SessionState = { input: parsed.data, paipan: res.paipan };
      saveSession(next);
      onSession(next);
      go("#/confirm");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "排盘失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="luxMain">
      <section className="luxHero" aria-label="Input">
        <div className="luxHeroMedia" aria-hidden="true" />
        <div className="luxContainer luxHeroInner">
          <div className="luxHeroContent luxHeroContentWide">
            <div className="luxHeroKickerRow">
              <span className="luxHeroKickerDash" aria-hidden="true" />
              <span className="luxHeroKickerText">LIFE COORDINATES</span>
            </div>
            <h1 className="luxHeroTitle">
              <span className="luxHeroTitleLine">人生K线</span>
              <span className="luxHeroTitleLine luxHeroTitleEm">Life Destiny K-Line</span>
            </h1>
            <p className="luxHeroLead">基于专业排盘与量化模型，把人生起伏转换为可视化的百年K线。</p>

            <div className="luxPanel luxPanelWide">
              <div className="luxPanelTitle">生成我的命盘</div>
              <div className="luxPanelLead">信息越完整，修正与结果越稳定。文案理性克制，不夸张。</div>

              {error ? (
                <div className="luxAlert" role="alert">
                  {error}
                </div>
              ) : null}

              <form className="luxForm" onSubmit={onSubmit}>
                <div className="luxFormList" role="group" aria-label="Birth input">
                  <div className="luxFormRow">
                    <div className="luxFormLabel">命主姓名</div>
                    <input className="luxFormInput" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" />
                  </div>

                  <div className="luxFormRow">
                    <div className="luxFormLabel">性别</div>
                    <div className="luxFormInline">
                      <button type="button" className={gender === "male" ? "luxToggleBtn luxToggleBtnOn" : "luxToggleBtn"} onClick={() => setGender("male")}>
                        男
                      </button>
                      <button type="button" className={gender === "female" ? "luxToggleBtn luxToggleBtnOn" : "luxToggleBtn"} onClick={() => setGender("female")}>
                        女
                      </button>
                    </div>
                  </div>

                  <button type="button" className="luxPickRow" onClick={openDateSheet}>
                    <div className="luxPickLabel">出生时间</div>
                    <div className="luxPickValue">
                      <div className="luxPickPrimary">{dateText}</div>
                      <div className="luxPickSecondary">{timeText}</div>
                    </div>
                    <div className="luxPickChevron" aria-hidden="true">
                      ›
                    </div>
                  </button>

                  <button type="button" className="luxPickRow" onClick={openAddrSheet}>
                    <div className="luxPickLabel">出生地址</div>
                    <div className="luxPickValue">
                      <div className="luxPickPrimary">{addrText}</div>
                      <div className="luxPickSecondary">{addrSubText}</div>
                    </div>
                    <div className="luxPickChevron" aria-hidden="true">
                      ›
                    </div>
                  </button>
                  <div className="luxPickNote">出生地点用于真太阳时修正，信息越精确，时间修正越可靠。</div>
                </div>

                <button className="luxBtn luxBtnInkSolid luxBtnBlock" type="submit" disabled={busy}>
                  {busy ? "排盘生成中..." : "生成我的命盘"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Sheet open={dateOpen} onClose={() => setDateOpen(false)} title="出生时间">
        <div className="luxSheetTabs" role="tablist" aria-label="calendar">
          <button type="button" className={"luxSheetTab" + (tmpCalendar === "solar" ? " luxSheetTabOn" : "")} onClick={() => setTmpCalendar("solar")}>
            公历
          </button>
          <button type="button" className={"luxSheetTab" + (tmpCalendar === "lunar" ? " luxSheetTabOn" : "")} onClick={() => setTmpCalendar("lunar")}>
            农历
          </button>
        </div>

        {tmpCalendar === "lunar" ? (
          <div className="luxSheetRow">
            <label className="luxCheck luxCheckInline">
              <input type="checkbox" checked={tmpLeap} onChange={(e) => setTmpLeap(e.target.checked)} />
              <span>闰月</span>
            </label>
          </div>
        ) : null}

        <div className="luxSheetTabs luxSheetTabsSlim" role="tablist" aria-label="time mode">
          <button type="button" className={"luxSheetTab" + (tmpTimeMode === "exact" ? " luxSheetTabOn" : "")} onClick={() => setTmpTimeMode("exact")}>
            精确
          </button>
          <button type="button" className={"luxSheetTab" + (tmpTimeMode === "segment" ? " luxSheetTabOn" : "")} onClick={() => setTmpTimeMode("segment")}>
            时辰
          </button>
        </div>

        <div className="luxWheelGrid">
          <WheelColumn header="年" options={years} value={String(tmpYear)} onValue={(v) => setTmpYear(Number(v))} />
          <WheelColumn header="月" options={months} value={pad2(tmpMonth)} onValue={(v) => setTmpMonth(Number(v))} />
          <WheelColumn header="日" options={tmpDayOptions} value={pad2(tmpDay)} onValue={(v) => setTmpDay(Number(v))} />
          {tmpTimeMode === "exact" ? (
            <>
              <WheelColumn header="时" options={hours} value={pad2(tmpHour)} onValue={(v) => setTmpHour(Number(v))} />
              <WheelColumn header="分" options={minutes} value={pad2(tmpMinute)} onValue={(v) => setTmpMinute(Number(v))} />
            </>
          ) : (
            <WheelColumn header="时段" options={segmentOptions} value={tmpLabel} onValue={(v) => setTmpLabel(v as any)} />
          )}
        </div>

        <div className="luxSheetActions">
          <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => setDateOpen(false)}>
            取消
          </button>
          <button type="button" className="luxBtn luxBtnInkSolid" onClick={confirmDateSheet}>
            确定
          </button>
        </div>
      </Sheet>

      <Sheet open={addrOpen} onClose={() => setAddrOpen(false)} title="出生地址">
        <div className="luxSheetTabs" role="tablist" aria-label="region">
          <button type="button" className={"luxSheetTab" + (addrTab === "domestic" ? " luxSheetTabOn" : "")} onClick={() => setAddrTab("domestic")}>
            国内
          </button>
          <button type="button" className={"luxSheetTab" + (addrTab === "overseas" ? " luxSheetTabOn" : "")} onClick={() => setAddrTab("overseas")} disabled>
            海外
          </button>
        </div>

        <div className="luxSheetRow">
          <div className="luxSearchWrapper">
            <div className="luxSearchIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              className="luxText luxSearchInput" 
              value={addrQuery} 
              onFocus={() => {
                // 点击输入框时，切换到搜索模式
                setAddrSearchMode(true);
              }}
              onChange={(e) => {
                const value = e.target.value;
                setAddrQuery(value);
                // 切换到搜索模式
                setAddrSearchMode(true);
                // 用户输入时，如果输入框被清空，也清空选择
                if (!value.trim()) {
                  setTmpProvince("");
                  setTmpCity("");
                  setTmpDistrict("");
                  setAddrCandidates([]);
                }
              }} 
              placeholder="搜索全国城市及地区" 
            />
          </div>
        </div>

        {/* 搜索模式：显示搜索结果列表 */}
        {addrSearchMode && addrQuery.trim() ? (
          addrCandidates.length > 0 ? (
            <div className="luxSearchResults">
              {(() => {
                // 去重搜索结果：使用 displayText 作为唯一标识
                const seen = new Set<string>();
                const uniqueCandidates: GeoCandidate[] = [];
                
                for (const candidate of addrCandidates) {
                  const parts: string[] = [];
                  if (candidate.province) parts.push(candidate.province);
                  if (candidate.city) parts.push(candidate.city);
                  if (candidate.district) parts.push(candidate.district);
                  const displayText = parts.join(" - ");
                  
                  if (!seen.has(displayText)) {
                    seen.add(displayText);
                    uniqueCandidates.push(candidate);
                  }
                }
                
                return uniqueCandidates.map((candidate, idx) => {
                  const parts: string[] = [];
                  if (candidate.province) parts.push(candidate.province);
                  if (candidate.city) parts.push(candidate.city);
                  if (candidate.district) parts.push(candidate.district);
                  const displayText = parts.join(" - ");
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="luxSearchResultItem"
                      onClick={async () => {
                        // 选中搜索结果后，设置对应的省/市/区县
                        if (candidate.province) {
                          setTmpProvince(candidate.province);
                          // 如果选择了省份，需要加载该省份的城市列表
                          if (candidate.city) {
                            // 先设置城市，这会触发城市列表的加载
                            setTmpCity(candidate.city);
                            // 如果选择了城市，需要加载该城市的区县列表
                            if (candidate.district) {
                              // 等待区县列表加载后再设置区县（通过 useEffect 自动加载）
                              setTimeout(() => {
                                setTmpDistrict(candidate.district!);
                              }, 300);
                            } else {
                              setTmpDistrict("");
                            }
                          } else {
                            setTmpCity("");
                            setTmpDistrict("");
                          }
                        }
                        // 更新输入框显示为空格分隔的格式，以便 isSelectionMatch 能正确识别
                        const selectionText = [candidate.province, candidate.city, candidate.district].filter(Boolean).join(" ");
                        setAddrQuery(selectionText);
                        // 切换到选择器模式
                        setAddrSearchMode(false);
                      }}
                    >
                      <div className="luxSearchResultText">{displayText}</div>
                    </button>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="luxSearchEmpty">
              <div className="luxSearchEmptyText">未找到匹配结果</div>
            </div>
          )
        ) : null}

        {/* 选择器模式：显示三列选择器 */}
        {!addrSearchMode || !addrQuery.trim() ? (
          <div className="luxPickerColumns" aria-label="picker columns">
            <RegionColumn 
              header="省份" 
              options={provinceOptions} 
              value={tmpProvince} 
              onValue={(v) => {
                setTmpProvince(v);
                setTmpCity(""); // 选择省份时清空城市和区县
                setTmpDistrict("");
                setAddrQuery(v); // 更新输入框显示
              }} 
            />
            <RegionColumn 
              header="城市" 
              options={cityOptions} 
              value={tmpCity} 
              onValue={(v) => {
                setTmpCity(v);
                setTmpDistrict(""); // 选择城市时清空区县
                setAddrQuery([tmpProvince, v].filter(Boolean).join(" ")); // 更新输入框显示
              }} 
            />
            <RegionColumn 
              header="区县" 
              options={districtOptions} 
              value={tmpDistrict} 
              onValue={(v) => {
                setTmpDistrict(v);
                setAddrQuery([tmpProvince, tmpCity, v].filter(Boolean).join(" ")); // 更新输入框显示
              }} 
            />
          </div>
        ) : null}

        <div className="luxSheetActions">
          <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => setAddrOpen(false)}>
            取消
          </button>
          <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => void confirmAddrSheet()} disabled={addrSearchMode ? !addrCandidates.length : !tmpProvince || !tmpCity}>
            确定
          </button>
        </div>
      </Sheet>
    </main>
  );
}
