import type { KLineResult, PaipanResult } from "@life-coordinates/core";
import { useState } from "react";
import KLineChart, { type KLineChartApi } from "../components/KLineChart";
import PillarTable from "../components/PillarTable";
import { postJson } from "../lib/api";
import { calendarLabel, formatDateYmd, formatTimeLabel, genderLabel } from "../lib/format";

function IconChevronRight() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Step3Page({
  paipan,
  kline,
  shareMode,
  go
}: {
  paipan: PaipanResult;
  kline: KLineResult;
  shareMode: boolean;
  go: (path: string) => void;
}) {
  const [chartApi, setChartApi] = useState<KLineChartApi | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const onExportPng = () => {
    const url = chartApi?.getPngDataUrl(2);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paipan.input.name || "LifeCoordinates"}-kline.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onShare = async () => {
    setShareBusy(true);
    setShareError(null);
    try {
      const res = await postJson<{ id: string }>("/api/share", { paipan, kline });
      const link = `${window.location.origin}${window.location.pathname}#/share/${res.id}`;
      setShareLink(link);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
    } catch (err: any) {
      setShareError(typeof err?.message === "string" ? err.message : "生成分享链接失败");
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <main className="luxMain">
      <section className="luxSection" aria-label="Result">
        <div className="luxContainer">
          <div className="luxSectionHeader luxSectionHeaderRow">
            <div>
              <div className="luxSectionKicker">STEP 3</div>
              <h2 className="luxH2">{paipan.input.name}的人生K线</h2>
              <p className="luxP">横轴为虚岁 1～100。每 10 年一个十年大运，用竖向虚线分隔并标注干支。</p>
            </div>
            {!shareMode ? (
              <div className="luxStepTrail" aria-label="Trail">
                <span className="luxStepTrailItem">输入</span>
                <IconChevronRight />
                <span className="luxStepTrailItem">确认</span>
                <IconChevronRight />
                <span className="luxStepTrailItem luxStepTrailItemOn">结果</span>
              </div>
            ) : (
              <div className="luxStepTrail" aria-label="Share">
                <span className="luxStepTrailItem luxStepTrailItemOn">只读分享</span>
              </div>
            )}
          </div>

          <div className="luxResultStack">
            <div className="luxCardGrid">
              <div className="luxCard">
                <div className="luxCardTitle">基本信息</div>
                <div className="luxMetaList">
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">性别</div>
                    <div className="luxMetaVal">{genderLabel(paipan.input.gender)}</div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">历法</div>
                    <div className="luxMetaVal">{calendarLabel(paipan.input.calendar)}</div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">出生</div>
                    <div className="luxMetaVal">
                      {formatDateYmd(paipan.input.date)} {formatTimeLabel(paipan.input.time)}
                    </div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">地点</div>
                    <div className="luxMetaVal">
                      {paipan.input.location.province} {paipan.input.location.city}
                    </div>
                  </div>
                </div>
              </div>

              <div className="luxCard">
                <div className="luxCardTitle">总体概览</div>
                <div className="luxMetaList">
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">综合评分</div>
                    <div className="luxMetaVal">
                      <span className="luxBig">{kline.insight.totalScore}</span>
                      <span className="luxSmall">/ 100</span>
                    </div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">整体走势</div>
                    <div className="luxMetaVal">{kline.insight.overallTrend}</div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">十神关注</div>
                    <div className="luxMetaVal">{kline.insight.tenGodFocus.join("、")}</div>
                  </div>
                  <div className="luxMetaRow">
                    <div className="luxMetaKey">简述</div>
                    <div className="luxMetaVal">{kline.insight.summary}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="luxCard luxCardBlock">
              <div className="luxCardTitle">四柱八字</div>
              <PillarTable paipan={paipan} />
            </div>

            <div className="luxCard luxCardBlock">
              <div className="luxCardTitle">人生百年K线</div>
              <KLineChart paipan={paipan} kline={kline} onReady={setChartApi} />
              <div className="luxChartHint">绿色为上涨，红色为下跌。Hover 可查看年度详情。</div>
            </div>

            <div className="luxCardGrid">
              <div className="luxCard">
                <div className="luxCardTitle">人生阶段分析（十年大运）</div>
                <div className="luxDetails">
                  {kline.daYunStages.map((s) => (
                    <details key={`${s.startAge}-${s.ganZhi}`} className="luxDetail">
                      <summary className="luxDetailSummary">
                        <span>
                          {s.startAge}-{s.endAge} 岁｜大运：{s.ganZhi}
                        </span>
                        <span className="luxDetailScore">{s.score}</span>
                      </summary>
                      <div className="luxDetailBody">
                        <div className="luxMetaRow">
                          <div className="luxMetaKey">总体</div>
                          <div className="luxMetaVal">{s.summary}</div>
                        </div>
                        <div className="luxMetaRow">
                          <div className="luxMetaKey">建议</div>
                          <div className="luxMetaVal">{s.advice}</div>
                        </div>
                        {s.risks.length ? (
                          <div className="luxMetaRow">
                            <div className="luxMetaKey">风险</div>
                            <div className="luxMetaVal">{s.risks.join("、")}</div>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="luxCard">
                <div className="luxCardTitle">关键高低点</div>
                <div className="luxSplit">
                  <div>
                    <div className="luxMiniTitle">高峰（Top）</div>
                    <div className="luxList">
                      {kline.insight.peaks.slice(0, 5).map((p) => (
                        <div key={`${p.age}-${p.ganZhi}`} className="luxListRow">
                          <span>
                            虚岁 {p.age}｜{p.year}｜{p.ganZhi}
                          </span>
                          <span className="luxListScore">{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="luxMiniTitle">低谷（Bottom）</div>
                    <div className="luxList">
                      {kline.insight.troughs.slice(0, 5).map((p) => (
                        <div key={`${p.age}-${p.ganZhi}`} className="luxListRow">
                          <span>
                            虚岁 {p.age}｜{p.year}｜{p.ganZhi}
                          </span>
                          <span className="luxListScore">{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="luxCard luxCardBlock">
              <div className="luxCardTitle">导出与保存</div>
              <div className="luxActions luxActionsWrap">
                <button type="button" className="luxBtn luxBtnInkOutline" onClick={onExportPng}>
                  导出高清图片（K线）
                </button>
                <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => window.print()}>
                  导出 PDF（浏览器打印）
                </button>
                {!shareMode ? (
                  <button type="button" className="luxBtn luxBtnInkSolid" onClick={onShare} disabled={shareBusy}>
                    {shareBusy ? "生成中..." : "生成只读分享链接"}
                  </button>
                ) : null}
              </div>
              {shareError ? (
                <div className="luxAlert" role="alert">
                  {shareError}
                </div>
              ) : null}
              {shareLink ? (
                <div className="luxShareBox">
                  <div className="luxShareTitle">分享链接（已复制）</div>
                  <div className="luxShareLink">{shareLink}</div>
                </div>
              ) : null}
            </div>

            {!shareMode ? (
              <div className="luxCenter">
                <button type="button" className="luxBtn luxBtnLight" onClick={() => go("#/kline")}>
                  重新输入
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
