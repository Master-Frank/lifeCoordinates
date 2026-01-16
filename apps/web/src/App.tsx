import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, Link, useNavigate } from "react-router-dom";
import type { BirthInput, KLineResult, PaipanResult } from "@life-coordinates/core";
import { computePaipan, computeAll } from "./lib/api";
import { saveSession, loadSession } from "./lib/storage";
import { KLineChart } from "./components/KLineChart";

type StepKey = "step1" | "step2" | "step3";

function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
      <path d="M7 18L12 23L19 10L25 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 10V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="app-footer no-print">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <Logo size={24} />
            <span>人生坐标</span>
          </div>
          <div className="footer-desc">
            结合传统八字命理与现代数据可视化，探索人生起伏轨迹，把握关键决策时机。
          </div>
        </div>
        <div className="footer-links-group">
          <div>
            <div className="footer-col-title">产品</div>
            <Link to="/" className="footer-link">八字排盘</Link>
            <Link to="/result" className="footer-link">人生K线</Link>
            <Link to="/" className="footer-link">使用教程</Link>
          </div>
          <div>
            <div className="footer-col-title">关于</div>
            <a href="#" className="footer-link">关于我们</a>
            <a href="#" className="footer-link">隐私政策</a>
            <a href="#" className="footer-link">服务条款</a>
          </div>
          <div>
            <div className="footer-col-title">资源</div>
            <a href="https://6tail.cn/calendar/api.html" target="_blank" rel="noreferrer" className="footer-link">lunar-javascript</a>
            <a href="#" className="footer-link">命理知识库</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2024 Life Coordinates. All rights reserved.</div>
        <div style={{ display: "flex", gap: 16 }}>
          <span>Designed with AI Skills</span>
        </div>
      </div>
    </footer>
  );
}

const steps: { key: StepKey; label: string; description: string; path: string }[] = [
  { key: "step1", label: "填写出生信息", description: "基本资料与出生信息", path: "/" },
  { key: "step2", label: "确认命盘", description: "四柱与概要校对", path: "/confirm" },
  { key: "step3", label: "人生K线", description: "走势与阶段解读", path: "/result" }
];

function useCurrentStep(): StepKey | null {
  const loc = useLocation();
  if (loc.pathname === "/") return "step1";
  if (loc.pathname === "/confirm") return "step2";
  if (loc.pathname === "/result") return "step3";
  return null;
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const current = useCurrentStep();
  
  return (
    <div className="app-root">
      <header className="app-topbar no-print">
        <div className="app-topbar-left">
          <Link to="/" className="app-brand">
            <Logo className="app-brand-logo" size={42} />
            <div className="app-brand-text" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 38, paddingBottom: 2 }}>
              <span className="app-brand-title" style={{ fontSize: 20, lineHeight: 1 }}>人生坐标</span>
              <span className="app-brand-sub" style={{ fontSize: 10, lineHeight: 1 }}>LIFE COORDINATES</span>
            </div>
          </Link>
        </div>
        
        <div className="nav-center">
          <Link to="/" className={`nav-item ${location.pathname === '/' || location.pathname === '/step1' ? 'active' : ''}`}>
            <span className="nav-item-title">势能图</span>
            <span className="nav-item-sub">人生K线</span>
          </Link>
          <div className="nav-item disabled" style={{ cursor: "not-allowed", opacity: 0.5 }}>
            <span className="nav-item-title">星盘</span>
            <span className="nav-item-sub">紫微斗数</span>
          </div>
          <div className="nav-item disabled" style={{ cursor: "not-allowed", opacity: 0.5 }}>
            <span className="nav-item-title">抉择矩阵</span>
            <span className="nav-item-sub">塔罗牌</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-btn-secondary">登录</button>
          <button className="header-btn-primary">注册</button>
        </div>
      </header>
      <div className="shell">
        <aside className="shell-sidebar no-print">
          <div className="shell-sidebar-title">测算流程</div>
          <div className="shell-steps">
            {steps.map((step, index) => {
              const active = step.key === current;
              const done = current && steps.findIndex((s) => s.key === current) > index;
              return (
                <div key={step.key} className={active ? "shell-step shell-step-active" : done ? "shell-step shell-step-done" : "shell-step"}>
                  <div className="shell-step-indicator">
                    <span>{index + 1}</span>
                  </div>
                  <div className="shell-step-body">
                    <div className="shell-step-label">{step.label}</div>
                    <div className="shell-step-desc">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="shell-sidebar-footer">
            <div className="shell-tag">真太阳时修正</div>
            <div className="shell-tag">四柱八字</div>
            <div className="shell-tag">人生K线</div>
          </div>
        </aside>
        <main className="shell-main">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

function Step1Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BirthInput>({
    name: "",
    gender: "male",
    calendar: "solar",
    date: { year: 1990, month: 1, day: 1, isLeapMonth: false },
    time: { mode: "exact", hour: 12, minute: 0 },
    location: { province: "北京", city: "北京", longitude: 116.46 }
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await computePaipan(form);
      saveSession({ input: form, paipan: res.paipan });
      navigate("/confirm");
    } catch (e) {
      alert("Error: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center-layout">
      <div className="hero-center">
        <h1 className="hero-title">洞悉命运起伏 预见人生轨迹</h1>
        <p className="hero-subtitle">
          结合传统八字命理与现代金融数据可视化，我们将您的一生运势绘制成类似股票行情的K线图。助您发现人生牛市，规避风险熊市，把握关键转折点。
        </p>
        <div className="hero-actions">
          <button className="secondary pill-button">📖 查看使用教程</button>
        </div>
      </div>

      <div className="form-card-centered">
        <div className="form-card-header">
          <h2 className="form-card-title">八字排盘</h2>
          <p className="form-card-desc">请输入出生信息以生成分析</p>
        </div>
        
        <div className="form-placeholder-body">
          <div className="placeholder-row">
            <div>
              <label>姓名（可选）</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label>性别</label>
              <select 
                value={form.gender} 
                onChange={e => setForm({...form, gender: e.target.value as "male" | "female"})}
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>

          <div className="placeholder-row">
            <div>
              <label>历法</label>
              <select 
                value={form.calendar} 
                onChange={e => setForm({...form, calendar: e.target.value as "solar" | "lunar"})}
              >
                <option value="solar">公历</option>
                <option value="lunar">农历</option>
              </select>
            </div>
            <div>
              <label>出生日期</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input 
                  type="number" 
                  value={form.date.year} 
                  onChange={e => setForm({...form, date: {...form.date, year: parseInt(e.target.value)}})}
                  style={{ width: '33%' }}
                />
                <input 
                  type="number" 
                  value={form.date.month} 
                  onChange={e => setForm({...form, date: {...form.date, month: parseInt(e.target.value)}})}
                  style={{ width: '33%' }}
                />
                <input 
                  type="number" 
                  value={form.date.day} 
                  onChange={e => setForm({...form, date: {...form.date, day: parseInt(e.target.value)}})}
                  style={{ width: '33%' }}
                />
              </div>
            </div>
          </div>

          <div className="placeholder-row">
            <div>
              <label>时间模式</label>
              <select 
                value={form.time.mode} 
                onChange={e => {
                  const mode = e.target.value as "exact" | "segment";
                  if (mode === "exact") {
                    setForm({...form, time: { mode: "exact", hour: 12, minute: 0 }});
                  } else {
                    setForm({...form, time: { mode: "segment", label: "子时" }});
                  }
                }}
              >
                <option value="exact">精确时间</option>
                <option value="segment">时辰/模糊</option>
              </select>
            </div>
            <div>
              <label>出生时间</label>
              {form.time.mode === "exact" ? (
                 <div style={{ display: 'flex', gap: 4 }}>
                 <input 
                   type="number" 
                   value={form.time.hour} 
                   onChange={e => setForm({...form, time: { mode: "exact", hour: parseInt(e.target.value), minute: (form.time as any).minute }})}
                   style={{ width: '50%' }}
                 />
                 <input 
                   type="number" 
                   value={(form.time as any).minute} 
                   onChange={e => setForm({...form, time: { mode: "exact", hour: (form.time as any).hour, minute: parseInt(e.target.value) }})}
                   style={{ width: '50%' }}
                 />
               </div>
              ) : (
                <select 
                  value={(form.time as any).label}
                  onChange={e => setForm({...form, time: { mode: "segment", label: e.target.value as any }})}
                >
                  {["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label>出生地点 (省/市/经度)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                placeholder="省份" 
                value={form.location.province}
                onChange={e => setForm({...form, location: {...form.location, province: e.target.value}})}
              />
              <input 
                type="text" 
                placeholder="城市" 
                value={form.location.city}
                onChange={e => setForm({...form, location: {...form.location, city: e.target.value}})}
              />
              <input 
                type="number" 
                placeholder="经度" 
                value={form.location.longitude}
                onChange={e => setForm({...form, location: {...form.location, longitude: parseFloat(e.target.value)}})}
                step="0.01"
              />
            </div>
          </div>

          <button className="primary-button-large" onClick={handleSubmit} disabled={loading}>
            {loading ? "计算中..." : "✨ 生成排盘预览"}
          </button>
        </div>
      </div>
      
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#94a3b8" }}>
        支持公历/农历自动转换 · 自动真太阳时修正
      </div>
    </div>
  );
}

function Step2Page() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ input: BirthInput; paipan?: PaipanResult } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s || !s.paipan) {
      navigate("/");
    } else {
      setSession(s);
    }
  }, [navigate]);

  if (!session || !session.paipan) return <div>Loading...</div>;

  const { paipan } = session;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await computeAll(session.input);
      saveSession({ ...session, kline: res.kline });
      navigate("/result");
    } catch (e) {
      alert("Error: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center-layout">
      <div className="hero-center">
        <h1 className="hero-title">确认您的命盘信息</h1>
        <p className="hero-subtitle">
          请仔细核对以下信息，确保真太阳时与四柱八字准确无误。
        </p>
      </div>

      <div className="form-card-centered" style={{ maxWidth: 600 }}>
        <div className="form-card-header">
          <h2 className="form-card-title">命盘预览</h2>
          <p className="form-card-desc">四柱八字与基本盘面</p>
        </div>
        <div className="form-placeholder-body">
          <div className="table-container">
            <table className="table" style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>柱</th>
                  <th>天干</th>
                  <th>地支</th>
                  <th>十神</th>
                  <th>藏干</th>
                  <th>纳音</th>
                </tr>
              </thead>
              <tbody>
                {["year", "month", "day", "hour"].map((key) => {
                  const p = paipan.fourPillars[key as "year"];
                  return (
                    <tr key={key}>
                      <td>{{year: "年柱", month: "月柱", day: "日柱", hour: "时柱"}[key]}</td>
                      <td style={{ fontWeight: "bold", color: p.gan === paipan.fourPillars.dayMaster.gan ? "red" : "inherit" }}>{p.gan}</td>
                      <td>{p.zhi}</td>
                      <td>{p.ganTenGod}</td>
                      <td>{p.hiddenStems.join("")}</td>
                      <td>{p.naYin}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
            <div><b>真太阳时:</b> {paipan.solar.correctedYmdHms}</div>
            <div><b>经度修正:</b> {paipan.solar.longitudeDeltaMinutes.toFixed(1)} 分钟</div>
            <div><b>日主强弱:</b> {paipan.overall.dayMasterStrength}</div>
            <div><b>喜用神:</b> {paipan.overall.favorableElements.join("、")}</div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button className="secondary-button-large" style={{ flex: 1 }} onClick={() => navigate("/")}>返回修改</button>
            <button className="primary-button-large" style={{ flex: 1 }} onClick={handleConfirm} disabled={loading}>
              {loading ? "计算中..." : "确认生成人生K线"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Page() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ kline?: KLineResult; paipan?: PaipanResult } | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || !s.kline || !s.paipan) {
      navigate("/");
    } else {
      setSession(s);
    }
  }, [navigate]);

  if (!session || !session.kline || !session.paipan) return <div>Loading...</div>;
  const { kline, paipan } = session;

  return (
    <div className="page-full-layout">
      <header className="result-header">
        <h1 className="result-title">命盘分析报告</h1>
        <button className="text-button" onClick={() => navigate("/")}>← 重新排盘</button>
      </header>

      <div className="chart-container-large">
         <KLineChart data={kline} height={450} />
      </div>

      <div className="dark-bar">
        <div className="dark-bar-label">四柱八字</div>
        <div className="dark-bar-content">
          {["year", "month", "day", "hour"].map((key) => {
            const p = paipan.fourPillars[key as "year"];
            return (
              <div className="pillar-item" key={key}>
                <span className="pillar-label">{{year: "年柱", month: "月柱", day: "日柱", hour: "时柱"}[key]}</span>
                <span className="pillar-value">{p.gan}{p.zhi}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="analysis-card">
        <h3 className="analysis-title">📄 命理总评</h3>
        <div className="analysis-body">
          <p>{kline.insight.summary}</p>
          <div style={{ marginTop: 12 }}>
            <b>关键转折点：</b>
            {kline.insight.peaks.map(p => `${p.year}年(${p.age}岁)`).join("、")}
          </div>
        </div>
      </div>
    </div>
  );
}

function SharePage() {
  return (
    <div className="page-stack">
      <section className="card page-hero">
        <div className="page-eyebrow">Share</div>
        <h1 className="page-title">分享结果的专属只读页面</h1>
        <p className="page-subtitle">后续会在这里重新接入分享结果展示与图表，只读、安全、可回看。</p>
      </section>
      <section className="card page-body">
        <header className="page-section-header">
          <h2 className="page-section-title">分享内容区域</h2>
          <p className="page-section-desc">将复用现有 /share/:id 接口返回的 paipan 与 kline 结构。</p>
        </header>
        <div className="page-placeholder">分享视图的布局会在这里重新设计，包括标题、K线和基础说明。</div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutShell>
            <Step1Page />
          </LayoutShell>
        }
      />
      <Route
        path="/confirm"
        element={
          <LayoutShell>
            <Step2Page />
          </LayoutShell>
        }
      />
      <Route
        path="/result"
        element={
          <LayoutShell>
            <Step3Page />
          </LayoutShell>
        }
      />
      <Route
        path="/share/:id"
        element={
          <LayoutShell>
            <SharePage />
          </LayoutShell>
        }
      />
      <Route
        path="*"
        element={
          <LayoutShell>
            <Step1Page />
          </LayoutShell>
        }
      />
    </Routes>
  );
}