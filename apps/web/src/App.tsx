import type { KLineResult, PaipanResult } from "@life-coordinates/core";
import { useEffect, useMemo, useState } from "react";
import Step1Page from "./pages/Step1";
import Step2Page from "./pages/Step2";
import Step3Page from "./pages/Step3";
import { readJson } from "./lib/api";
import { loadSession } from "./lib/storage";
import type { SessionState } from "./lib/storage";

type Route =
  | { name: "home" }
  | { name: "kline" }
  | { name: "confirm" }
  | { name: "result" }
  | { name: "share"; id: string };

function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, "");
  const path = clean.startsWith("/") ? clean : "/";
  if (path === "/kline") return { name: "kline" };
  if (path === "/confirm") return { name: "confirm" };
  if (path === "/result") return { name: "result" };
  if (path.startsWith("/share/")) {
    const id = path.replace("/share/", "").trim();
    if (id) return { name: "share", id };
  }
  return { name: "home" };
}

function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function go(path: string) {
  window.location.hash = path;
}

function IconSearch() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.4 16.4L21 21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h10l1 14H6L7 7z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg className="luxSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className="luxSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" fill="currentColor" />
    </svg>
  );
}

function IconPinterest() {
  return (
    <svg className="luxSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 .1-2.9l1.3-5.5s-.3-.7-.3-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.1.6 2 1.7 2 2 0 3.6-2.1 3.6-5.2 0-2.7-2-4.6-4.7-4.6-3.2 0-5.1 2.4-5.1 4.9 0 1 .4 2 .8 2.5.1.1.1.2.1.4l-.3 1.2c-.1.4-.3.5-.7.3-1.3-.6-2.1-2.4-2.1-3.9 0-3.2 2.3-6.1 6.7-6.1 3.5 0 6.2 2.5 6.2 5.9 0 3.5-2.2 6.3-5.2 6.3-1 0-2-.5-2.3-1.1l-.6 2.2c-.2.9-.8 2-1.2 2.6A10 10 0 1 0 12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg className="luxSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.5 7.2a3 3 0 0 0-2.1-2.1C17.6 4.7 12 4.7 12 4.7s-5.6 0-7.4.4A3 3 0 0 0 2.5 7.2 31.3 31.3 0 0 0 2.5 12s0 3.1.4 4.8a3 3 0 0 0 2.1 2.1c1.8.4 7 .4 7 .4s5.6 0 7.4-.4a3 3 0 0 0 2.1-2.1c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8z"
        fill="currentColor"
      />
      <path d="M10.2 9.4l5 2.6-5 2.6V9.4z" fill="#fff" />
    </svg>
  );
}

function HomePage({ go }: { go: (path: string) => void }) {
  return (
    <main className="luxMain">
      <section className="luxHero" aria-label="Home">
        <div className="luxHeroMedia" aria-hidden="true" />
        <div className="luxContainer luxHeroInner">
          <div className="luxHeroContent">
            <div className="luxHeroKickerRow">
              <span className="luxHeroKickerDash" aria-hidden="true" />
              <span className="luxHeroKickerText">LIFE COORDINATES</span>
            </div>
            <h1 className="luxHeroTitle">
              <span className="luxHeroTitleLine">人生坐标</span>
              <span className="luxHeroTitleLine luxHeroTitleEm">Life Coordinates</span>
            </h1>
            <p className="luxHeroLead">将八字命盘转化为“百年K线”，直观展示起伏、高峰、低谷与关键转折期。</p>

            <div className="luxHeroCtas">
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/kline")}>
                开始生成
              </button>
              <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => go("#/kline")}>
                势能图（人生K线）
              </button>
            </div>

            <div className="luxStatsBar">
              <div className="luxStats" aria-label="Highlights">
                <div className="luxStat">
                  <div className="luxStatValue">1–100</div>
                  <div className="luxStatLabel">虚岁区间</div>
                </div>
                <div className="luxStat">
                  <div className="luxStatValue">1Y</div>
                  <div className="luxStatLabel">每年一根K线</div>
                </div>
                <div className="luxStat">
                  <div className="luxStatValue">10Y</div>
                  <div className="luxStatLabel">十年大运分段</div>
                </div>
                <div className="luxStat">
                  <div className="luxStatValue">3</div>
                  <div className="luxStatLabel">输入→确认→结果</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxSection" aria-label="Core">
        <div className="luxContainer">
          <div className="luxSectionHeader">
            <div>
              <div className="luxSectionKicker">CORE</div>
              <div className="luxSectionTitle">专业排盘 × 量化建模 × K线可视化</div>
            </div>
          </div>

          <div className="luxGrid4">
            {[
              {
                badge: "VERIFY",
                title: "专业排盘（lunar-javascript）",
                note: "公历/农历转换、节气定月、四柱干支推算，结果可核验。"
              },
              {
                badge: "SOLAR",
                title: "真太阳时修正",
                note: "基于出生地经度修正时间，减少边界误差影响。"
              },
              {
                badge: "MODEL",
                title: "年度评分量化",
                note: "本命盘×20%｜十年大运×35%｜流年作用×30%｜冲合刑害×10%｜格局修正×5%。"
              },
              {
                badge: "VIEW",
                title: "百年K线与阶段洞察",
                note: "每年OHLC一根K线；每10年大运虚线分隔并标注干支。"
              }
            ].map((card) => (
              <div key={card.title} className="luxProductCard">
                <div className="luxProductMedia" aria-hidden="true">
                  <div className="luxMediaFill" />
                  <div className="luxProductOverlay" />
                  <div className="luxBadge">{card.badge}</div>
                </div>
                <div className="luxProductMeta">
                  <div className="luxProductName">{card.title}</div>
                </div>
                <div className="luxProductMeta" style={{ paddingTop: 0 }}>
                  <div className="luxProductPrice">{card.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="luxSection" aria-label="Principles">
        <div className="luxContainer">
          <div className="luxStoryGrid">
            <div className="luxStoryImage" aria-hidden="true">
              <div className="luxMediaFill luxMediaFillGold" />
            </div>
            <div>
              <div className="luxStoryTop">
                <div className="luxStoryBig">01</div>
                <div className="luxStoryBigLabel">PRINCIPLES</div>
              </div>
              <div className="luxStoryKicker">理性克制 · 可验证 · 可保存</div>
              <h2 className="luxH2">把“人生走势”做成可回看的结构化输出</h2>
              <p className="luxP">
                排盘必须专业准确，避免夸张式文案；评分模型、K线规则与输出结构保持一致，让结果能被对照、保存、分享。
              </p>

              <div className="luxValues3" aria-label="Values">
                {[
                  { title: "专业", body: "排盘基于库实现，输出字段完整、表格清晰。" },
                  { title: "克制", body: "描述聚焦规则与提示，不夸张、不迷信。" },
                  { title: "可回看", body: "支持导出PDF/图片与只读分享链接。" }
                ].map((v) => (
                  <div key={v.title} className="luxValue">
                    <div className="luxValueTitle">{v.title}</div>
                    <div className="luxValueBody">{v.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxSection" aria-label="Flow">
        <div className="luxContainer">
          <div className="luxSectionHeader">
            <div>
              <div className="luxSectionKicker">FLOW</div>
              <div className="luxSectionTitle">严格三步交互</div>
            </div>
          </div>

          <div className="luxGrid3">
            {[
              { title: "Step 1｜信息输入", note: "姓名、性别、历法、公/农历日期、时间、出生地（经度）。" },
              { title: "Step 2｜排盘确认", note: "四柱与扩展字段完整展示：十神、藏干、神煞、纳音、空亡等。" },
              { title: "Step 3｜结果展示", note: "百年K线 + 十年大运分析 + 深度解读 + 导出与分享。" }
            ].map((c) => (
              <div key={c.title} className="luxCollectionCard" onClick={() => go("#/kline")} role="button" tabIndex={0}>
                <div className="luxCollectionMedia" aria-hidden="true">
                  <div className="luxMediaFill luxMediaFillInk" />
                  <div className="luxCollectionScrim" />
                </div>
                <div className="luxCollectionBody">
                  <div className="luxCollectionTitle">{c.title}</div>
                  <div className="luxCollectionNote">{c.note}</div>
                  <div className="luxCollectionCta">开始体验 →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="luxSection" aria-label="Export">
        <div className="luxContainer">
          <div className="luxMemberGrid">
            <div>
              <div className="luxSectionKicker">OUTPUT</div>
              <h2 className="luxH2">导出与保存</h2>
              <p className="luxP">支持导出 PDF 报告、导出高清K线图片，并生成只读分享链接，便于展示与复盘。</p>
              <div className="luxBenefits" aria-label="Benefits">
                {[
                  "导出 PDF（浏览器打印）",
                  "导出高清图片（K线）",
                  "生成只读分享链接"
                ].map((t) => (
                  <div key={t} className="luxBenefit">
                    <div className="luxBenefitIcon">✓</div>
                    <div className="luxBenefitText">{t}</div>
                  </div>
                ))}
              </div>
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/kline")}>
                生成我的命盘
              </button>
            </div>
            <div className="luxMemberMedia" aria-hidden="true">
              <div className="luxMediaFill" />
              <div className="luxMemberTag">EXPORT</div>
              <div className="luxMemberTagSub">SHARE · SAVE</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SharePage({ id, go }: { id: string; go: (path: string) => void }) {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ paipan: PaipanResult; kline: KLineResult } | null>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const res = await readJson<{ paipan: PaipanResult; kline: KLineResult }>(`/api/share/${encodeURIComponent(id)}`);
        if (!alive) return;
        setPayload(res);
      } catch (err: any) {
        if (!alive) return;
        setError(typeof err?.message === "string" ? err.message : "分享内容不存在或已失效");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (busy) {
    return (
      <main className="luxMain">
        <section className="luxSection">
          <div className="luxContainer">
            <div className="luxPanel">
              <div className="luxPanelTitle">加载分享内容中...</div>
              <div className="luxPanelLead">请稍候。</div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="luxMain">
        <section className="luxSection">
          <div className="luxContainer">
            <div className="luxPanel">
              <div className="luxPanelTitle">无法打开分享</div>
              <div className="luxPanelLead">{error ?? "未知错误"}</div>
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/")}>
                返回首页
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <Step3Page paipan={payload.paipan} kline={payload.kline} shareMode={true} go={go} />;
}

export default function App() {
  const route = useHashRoute();
  const [session, setSession] = useState<SessionState>(() => loadSession());

  const modeItems = useMemo(() => {
    const klineActive = route.name === "kline" || route.name === "confirm" || route.name === "result" || route.name === "share";
    return [
      { top: "势能图", sub: "人生K线", href: "#/kline", active: klineActive, disabled: false },
      { top: "星盘", sub: "紫薇", href: "#", active: false, disabled: true },
      { top: "抉择矩阵", sub: "塔罗", href: "#", active: false, disabled: true }
    ];
  }, [route.name]);

  return (
    <div className="luxPage">
      <header className="luxNav" aria-label="Site navigation">
        <div className="luxContainer luxNavInner">
          <a
            className="luxBrand"
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              go("#/");
            }}
          >
            LIFE COORDINATES
          </a>

          <nav className="luxModeNav" aria-label="Modes">
            {modeItems.map((it) => (
              <a
                key={it.top}
                className={[
                  "luxModeBtn",
                  it.active ? "luxModeBtnActive" : "",
                  it.disabled ? "luxModeBtnDisabled" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={it.href}
                onClick={(e) => {
                  if (it.disabled) {
                    e.preventDefault();
                    return;
                  }
                }}
              >
                <span className="luxModeBtnTop">{it.top}</span>
                <span className="luxModeBtnSub">{it.sub}</span>
              </a>
            ))}
          </nav>

          <div className="luxNavActions" aria-label="Actions">
            <button type="button" className="luxIconBtn" aria-label="Search">
              <IconSearch />
            </button>
            <button type="button" className="luxIconBtn" aria-label="Account">
              <IconUser />
            </button>
            <button type="button" className="luxIconBtn" aria-label="Cart">
              <IconBag />
            </button>
          </div>
        </div>
      </header>

      {route.name === "home" ? <HomePage go={go} /> : null}
      {route.name === "kline" ? <Step1Page session={session} onSession={setSession} go={go} /> : null}
      {route.name === "confirm" ? <Step2Page session={session} onSession={setSession} go={go} /> : null}
      {route.name === "result" ? (
        session.paipan && session.kline ? (
          <Step3Page paipan={session.paipan} kline={session.kline} shareMode={false} go={go} />
        ) : (
          <main className="luxMain">
            <section className="luxSection">
              <div className="luxContainer">
                <div className="luxPanel">
                  <div className="luxPanelTitle">未找到结果数据</div>
                  <div className="luxPanelLead">请先完成 Step 1 与 Step 2。</div>
                  <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/kline")}>
                    返回输入
                  </button>
                </div>
              </div>
            </section>
          </main>
        )
      ) : null}
      {route.name === "share" ? <SharePage id={route.id} go={go} /> : null}

      <footer className="luxFooter" aria-label="Footer">
        <div className="luxContainer">
          <div className="luxFooterTop">
            <div>
              <div className="luxFooterTitle">保持理性，保持清晰</div>
              <div className="luxFooterLead">我们用可验证的排盘结果与结构化输出，让“人生走势”更直观、更可回看。</div>
            </div>
            <div className="luxSubscribe">
              <a
                className="luxBtn luxBtnInkSolid luxFooterSubscribeBtn"
                href="#/kline"
                onClick={(e) => {
                  e.preventDefault();
                  go("#/kline");
                }}
              >
                开始生成
              </a>
            </div>
          </div>

          <div className="luxFooterGrid">
            <div className="luxFooterBrand">
              <div className="luxFooterBrandName">LIFE COORDINATES</div>
              <div className="luxFooterBrandNote">人生K线 · Life Destiny K-Line｜输入 → 排盘确认 → 结果展示｜可保存与分享</div>
            </div>

            <div className="luxFooterCol">
              <div className="luxFooterColTitle">FLOW</div>
              {["Step 1 输入", "Step 2 确认", "Step 3 结果", "只读分享"].map((t) => (
                <a key={t} className="luxFooterLink" href="#" onClick={(e) => e.preventDefault()}>
                  {t}
                </a>
              ))}
            </div>

            <div className="luxFooterCol">
              <div className="luxFooterColTitle">MODEL</div>
              {["真太阳时修正", "节气定月", "十年大运分段", "年度评分量化"].map((t) => (
                <a key={t} className="luxFooterLink" href="#" onClick={(e) => e.preventDefault()}>
                  {t}
                </a>
              ))}
            </div>

            <div className="luxFooterCol">
              <div className="luxFooterColTitle">OUTPUT</div>
              {["结构化排盘", "百年K线", "阶段洞察", "可导出分享"].map((t) => (
                <a key={t} className="luxFooterLink" href="#" onClick={(e) => e.preventDefault()}>
                  {t}
                </a>
              ))}
            </div>

            <div className="luxFooterCol">
              <div className="luxFooterColTitle">NOTICE</div>
              {["理性克制文案", "可验证排盘", "结果可保存", "分享只读"].map((t) => (
                <a key={t} className="luxFooterLink" href="#" onClick={(e) => e.preventDefault()}>
                  {t}
                </a>
              ))}
            </div>
          </div>

          <div className="luxFooterBottom">
            <div className="luxFooterCopy">© {new Date().getFullYear()} Life Coordinates. All rights reserved.</div>
            <div className="luxFooterSocial" aria-label="Social">
              <a className="luxSocial" href="#" onClick={(e) => e.preventDefault()} aria-label="instagram">
                <IconInstagram />
              </a>
              <a className="luxSocial" href="#" onClick={(e) => e.preventDefault()} aria-label="facebook">
                <IconFacebook />
              </a>
              <a className="luxSocial" href="#" onClick={(e) => e.preventDefault()} aria-label="pinterest">
                <IconPinterest />
              </a>
              <a className="luxSocial" href="#" onClick={(e) => e.preventDefault()} aria-label="youtube">
                <IconYouTube />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

