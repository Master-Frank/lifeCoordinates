import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BirthInput, BirthTimeInput } from "@life-coordinates/core";
import { BirthInputSchema } from "@life-coordinates/core";
import { computePaipan, geoGeocode, geoSuggest } from "../lib/api";
import { saveSession } from "../lib/storage";

const timeSegments: Extract<BirthTimeInput, { mode: "segment" }>[] = [
  { mode: "segment", label: "子时" },
  { mode: "segment", label: "丑时" },
  { mode: "segment", label: "寅时" },
  { mode: "segment", label: "卯时" },
  { mode: "segment", label: "辰时" },
  { mode: "segment", label: "巳时" },
  { mode: "segment", label: "午时" },
  { mode: "segment", label: "未时" },
  { mode: "segment", label: "申时" },
  { mode: "segment", label: "酉时" },
  { mode: "segment", label: "戌时" },
  { mode: "segment", label: "亥时" },
  { mode: "segment", label: "上午" },
  { mode: "segment", label: "下午" }
];

const provinces = [
  "北京市",
  "天津市",
  "上海市",
  "重庆市",
  "河北省",
  "山西省",
  "辽宁省",
  "吉林省",
  "黑龙江省",
  "江苏省",
  "浙江省",
  "安徽省",
  "福建省",
  "江西省",
  "山东省",
  "河南省",
  "湖北省",
  "湖南省",
  "广东省",
  "海南省",
  "四川省",
  "贵州省",
  "云南省",
  "陕西省",
  "甘肃省",
  "青海省",
  "台湾省",
  "内蒙古自治区",
  "广西壮族自治区",
  "西藏自治区",
  "宁夏回族自治区",
  "新疆维吾尔自治区",
  "香港特别行政区",
  "澳门特别行政区"
];

export default function Step1() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [cityCandidates, setCityCandidates] = useState<string[]>([]);
  const [citySuggesting, setCitySuggesting] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [form, setForm] = useState<BirthInput>(() => {
    const now = new Date();
    return {
      name: "",
      gender: "male",
      calendar: "solar",
      date: { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
      time: { mode: "exact", hour: 12, minute: 0 },
      location: { province: "", city: "", longitude: 120 }
    };
  });

  const timeMode = form.time.mode;
  const dateStr = useMemo(() => {
    const y = String(form.date.year).padStart(4, "0");
    const m = String(form.date.month).padStart(2, "0");
    const d = String(form.date.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [form.date]);

  useEffect(() => {
    let active = true;
    setGeoHint(null);
    const province = form.location.province.trim();
    const city = form.location.city.trim();
    if (!province || city.length < 1) {
      setCityCandidates([]);
      return;
    }

    const t = window.setTimeout(async () => {
      setCitySuggesting(true);
      try {
        const { candidates } = await geoSuggest({ province, city });
        if (active) {
          const names = Array.from(new Set(candidates.map((c) => c.name))).slice(0, 8);
          setCityCandidates(names);
        }
      } catch {
        if (active) setCityCandidates([]);
      } finally {
        if (active) setCitySuggesting(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [form.location.province, form.location.city]);

  const filteredProvinces = useMemo(() => {
    const q = form.location.province.trim();
    const list = q ? provinces.filter((p) => p.includes(q)) : provinces;
    return list.slice(0, 16);
  }, [form.location.province]);

  const filteredCities = useMemo(() => {
    const q = form.location.city.trim();
    const list = q ? cityCandidates.filter((c) => c.includes(q)) : cityCandidates;
    return list.slice(0, 16);
  }, [form.location.city, cityCandidates]);

  useEffect(() => {
    let active = true;
    const province = form.location.province.trim();
    const city = form.location.city.trim();
    if (!province || !city) {
      setGeoHint(null);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        const { candidate } = await geoGeocode({ province, city });
        if (!active) return;
        if (!candidate) {
          setGeoHint(null);
          return;
        }
        setGeoHint(candidate.displayName);
        setForm((f: BirthInput) => ({
          ...f,
          location: {
            ...f.location,
            longitude: Number(candidate.longitude)
          }
        }));
      } catch {
        if (!active) return;
        setGeoHint(null);
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [form.location.province, form.location.city]);

  async function onSubmit() {
    setError(null);
    const parsed = BirthInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "表单校验失败");
      return;
    }
    setLoading(true);
    try {
      const { paipan } = await computePaipan(parsed.data);
      saveSession({ input: parsed.data, paipan });
      nav("/confirm");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="step-layout">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Step 1 · 填写你的出生信息</h2>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "#475569" }}>
          <div>这一页只做一件事：把你的基础出生信息填写完整。</div>
          <div>后续所有排盘与人生K线，都基于这里的输入进行计算。</div>
          <div>可随时返回修改，不会影响之前已经生成的分享链接。</div>
        </div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>详细信息</h2>
        <div className="row">
        <div>
          <label>名字（必填）</label>
          <input value={form.name} onChange={(e) => setForm((f: BirthInput) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label>性别</label>
          <select value={form.gender} onChange={(e) => setForm((f: BirthInput) => ({ ...f, gender: e.target.value as any }))}>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>历法类型</label>
          <select value={form.calendar} onChange={(e) => setForm((f: BirthInput) => ({ ...f, calendar: e.target.value as any }))}>
            <option value="solar">公历</option>
            <option value="lunar">农历</option>
          </select>
        </div>
        <div>
          <label>出生日期</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              const v = e.target.value;
              const [y, m, d] = v.split("-").map((x) => Number(x));
              setForm((f: BirthInput) => ({ ...f, date: { ...f.date, year: y, month: m, day: d } }));
            }}
          />
        </div>
      </div>

      {form.calendar === "lunar" ? (
        <div style={{ marginTop: 12 }}>
          <label>闰月</label>
          <select
            value={String(Boolean(form.date.isLeapMonth))}
            onChange={(e) => setForm((f: BirthInput) => ({ ...f, date: { ...f.date, isLeapMonth: e.target.value === "true" } }))}
          >
            <option value="false">非闰月</option>
            <option value="true">闰月</option>
          </select>
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>出生时间模式</label>
          <select
            value={timeMode}
            onChange={(e) => {
              const mode = e.target.value as BirthTimeInput["mode"];
              setForm((f: BirthInput) => ({
                ...f,
                time:
                  mode === "exact" ? { mode: "exact", hour: 12, minute: 0 } : { mode: "segment", label: "子时" }
              }));
            }}
          >
            <option value="exact">精确到时:分</option>
            <option value="segment">时间不确定（时辰/上午/下午）</option>
          </select>
        </div>
        <div>
          <label>出生时间</label>
          {timeMode === "exact" ? (
            <input
              type="time"
              value={`${String(form.time.hour).padStart(2, "0")}:${String(form.time.minute).padStart(2, "0")}`}
              onChange={(e) => {
                const [hh, mm] = e.target.value.split(":").map((x) => Number(x));
                setForm((f: BirthInput) => ({ ...f, time: { mode: "exact", hour: hh, minute: mm } }));
              }}
            />
          ) : (
            <select value={form.time.label} onChange={(e) => setForm((f: BirthInput) => ({ ...f, time: { mode: "segment", label: e.target.value as any } }))}>
              {timeSegments.map((t) => (
                <option key={t.label} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>出生地点（省）</label>
          <div style={{ position: "relative" }}>
            <input
              value={form.location.province}
              placeholder="输入或下拉选择"
              onFocus={() => setProvinceOpen(true)}
              onBlur={() => window.setTimeout(() => setProvinceOpen(false), 120)}
              onChange={(e) =>
                setForm((f: BirthInput) => ({
                  ...f,
                  location: { ...f.location, province: e.target.value, city: "" }
                }))
              }
            />
            {provinceOpen && filteredProvinces.length ? (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: 10,
                  maxHeight: 220,
                  overflow: "auto"
                }}
              >
                {filteredProvinces.map((p) => (
                  <div
                    key={p}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm((f: BirthInput) => ({ ...f, location: { ...f.location, province: p, city: "" } }));
                      setProvinceOpen(false);
                    }}
                    style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #e2e8f0" }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <label>出生地点（市）</label>
          <div style={{ position: "relative" }}>
            <input
              value={form.location.city}
              placeholder={form.location.province ? "输入或下拉选择" : "先填写省"}
              onFocus={() => setCityOpen(true)}
              onBlur={() => window.setTimeout(() => setCityOpen(false), 120)}
              onChange={(e) => setForm((f: BirthInput) => ({ ...f, location: { ...f.location, city: e.target.value } }))}
            />
            {cityOpen ? (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: 10,
                  maxHeight: 220,
                  overflow: "auto"
                }}
              >
                {filteredCities.map((c) => (
                  <div
                    key={c}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm((f: BirthInput) => ({ ...f, location: { ...f.location, city: c } }));
                      setCityOpen(false);
                    }}
                    style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #e2e8f0" }}
                  >
                    {c}
                  </div>
                ))}
                {!form.location.province.trim() ? (
                  <div style={{ padding: "10px 12px", opacity: 0.8 }}>请先填写省份</div>
                ) : citySuggesting ? (
                  <div style={{ padding: "10px 12px", opacity: 0.8 }}>正在匹配…</div>
                ) : !filteredCities.length ? (
                  <div style={{ padding: "10px 12px", opacity: 0.8 }}>请输入城市名以匹配下拉选项</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>城市经度（自动填充，用于真太阳时修正）</label>
          <input
            type="number"
            step="0.000001"
            value={String(form.location.longitude)}
            onChange={(e) => setForm((f: BirthInput) => ({ ...f, location: { ...f.location, longitude: Number(e.target.value) } }))}
          />
          {geoHint ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>匹配：{geoHint}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <button disabled={loading} onClick={onSubmit}>
            生成我的命盘
          </button>
        </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
        <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>
          输入的历法类型会在后续页面始终明确展示；真太阳时按经度修正。
        </div>
      </div>
    </div>
  );
}
