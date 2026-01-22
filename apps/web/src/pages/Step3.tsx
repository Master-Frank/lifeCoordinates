import type { KLineResult, PaipanResult } from "@life-coordinates/core";
import { useState } from "react";
import KLineChart, { type KLineChartApi } from "../components/KLineChart";
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

  const IconPersonality = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm-7 17c0-3.3 3.1-6 7-6s7 2.7 7 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const IconCareer = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16v10H4z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const IconFengShui = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c4.4 0 8 3.1 8 7s-3.6 7-8 7-8 3-8 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );

  const IconWealth = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9h12a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const IconLove = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const IconHealth = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );

  const IconFamily = () => (
    <svg className="luxCardTitleIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3 2.7-5 6-5M21 20c0-3-2.7-5-6-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

  const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  const trendBoost = kline.insight.overallTrend === "中高" ? 6 : kline.insight.overallTrend === "前高" || kline.insight.overallTrend === "后高" ? 4 : -2;
  const tenGodSet = new Set(kline.insight.tenGodFocus);
  const favorable = paipan.overall.favorableElements.join("、");
  const unfavorable = paipan.overall.unfavorableElements.join("、");
  const seedFrom = (key: string, score: number) => {
    const chars = key.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return chars + score;
  };
  const pickBySeed = (list: string[], seed: number) => list[seed % list.length];

  const buildInsightText = (key: string, score: number) => {
    const seed = seedFrom(key, score);
    const strength = paipan.overall.dayMasterStrength;
    const trend = kline.insight.overallTrend;
    const tenGods = kline.insight.tenGodFocus.join("、") || "十神结构";
    const baseMap: Record<string, string[]> = {
      personality: [
        `日主${strength}，心性更重稳定与秩序，处事偏谨慎，先观察后行动，能守住节奏。`,
        `情绪起伏不大，重耐力与持续力，对承诺较认真，适合长期主义路径。`,
        `性格偏内敛与克制，做事讲逻辑与边界，擅长在可控节奏内推进。`
      ],
      career: [
        `整体走势${trend}，事业推进宜抓住高胜率窗口，重执行与节点复盘。`,
        `工作节奏偏稳，适合以方法论驱动产出，在稳定链路中放大优势。`,
        `职业发展宜稳中求进，先把关键动作做深，再逐步扩张版图。`
      ],
      fengshui: [
        `喜用${favorable || "要素"}，忌${unfavorable || "波动"}，布局宜取简而稳，重气场连贯。`,
        `环境能量以平衡为先，空间动线要清晰，聚焦主场景的稳定输出。`,
        `场域宜重光照与通达，避免能量阻滞，让节奏更平顺。`
      ],
      wealth: [
        `财势结构偏稳，适合以现金流为核心，循序扩大胜率与规模。`,
        `财富节奏宜慢中有进，分阶段设定目标，避免追涨杀跌。`,
        `资源配置应先保底后增效，把风险暴露控制在可承受区间。`
      ],
      love: [
        `情感推进重信任与节奏，适合以稳定沟通累积安全感。`,
        `关系经营宜减少情绪波动，先稳住共识，再谈深入投入。`,
        `亲密关系以互相支持为主，明确边界与期待，会更稳固。`
      ],
      health: [
        `身心状态要守住作息与节拍，避免高压叠加导致波动放大。`,
        `健康维护重在持续与耐心，稳定输入比短期爆发更有效。`,
        `保持中等强度的长期投入，减少频繁起伏带来的消耗。`
      ],
      family: [
        `六亲关系重稳定互动，宜多做长期投入与情感维护。`,
        `家庭关系以分工与边界为先，避免情绪化沟通引发误解。`,
        `亲缘互动宜稳步推进，保持节奏与承诺一致性。`
      ]
    };

    const focusPool =
      score >= 75
        ? ["优势窗口较多，可适度提速推进。", "势头较强，适合把关键事项做深做透。", "当前更利于放大长板，但要守住节拍。"]
        : score >= 60
          ? ["节奏整体平稳，建议稳中求进、持续提效。", "结构尚稳，适合优化流程与提升执行质量。", "以稳定输出为主，逐步抬高目标。"]
          : ["阶段偏紧，先稳基本盘，避免激进扩张。", "波动偏大，优先控风险与降低回撤。", "先守后攻，集中资源把关键问题修复好。"];

    const hintPool =
      score >= 60
        ? [`重点把“${tenGods}”的优势用在正确场景。`, `关注“${tenGods}”的特质转化，会带来更高复利。`]
        : [`留意“${tenGods}”引发的波动，先把节奏稳住。`, `把“${tenGods}”的冲动与分散收束到可控边界。`];

    const closerPool = ["长期坚持会显著累积优势。", "把节奏守住，结果会更稳定。", "持续复盘与调整，会越走越顺。"];

    const rotate = (list: string[], s: number) => {
      if (!list.length) return [];
      const start = s % list.length;
      return list.slice(start).concat(list.slice(0, start));
    };

    const minLen = 60;
    const maxLen = 100;

    const baseList = rotate(baseMap[key] ?? [], seed);
    const focusList = rotate(focusPool, seed + 3);
    const hintList = rotate(hintPool, seed + 7);
    const closerList = ["", ...rotate(closerPool, seed + 11)];

    const build = (parts: string[]) => parts.filter(Boolean).join("");

    for (const base of baseList) {
      for (const focus of focusList) {
        for (const hint of hintList) {
          for (const closer of closerList) {
            const candidate = build([base, focus, hint, closer]);
            if (candidate.length >= minLen && candidate.length <= maxLen) return candidate;
          }
        }
      }
    }

    for (const base of baseList) {
      for (const focus of focusList) {
        for (const closer of closerList) {
          const candidate = build([base, focus, closer]);
          if (candidate.length >= minLen && candidate.length <= maxLen) return candidate;
        }
      }
    }

    for (const base of baseList) {
      for (const hint of hintList) {
        for (const closer of closerList) {
          const candidate = build([base, hint, closer]);
          if (candidate.length >= minLen && candidate.length <= maxLen) return candidate;
        }
      }
    }

    return build([pickBySeed(baseMap[key], seed), pickBySeed(focusPool, seed + 3), pickBySeed(closerPool, seed + 11)]);
  };

  const analysisCards = [
    {
      key: "personality",
      title: "性格分析",
      score: clampScore(kline.insight.totalScore + (paipan.overall.dayMasterStrength === "强" ? 6 : paipan.overall.dayMasterStrength === "弱" ? -4 : 2)),
      icon: <IconPersonality />,
      gradient: "luxGradientA"
    },
    {
      key: "career",
      title: "事业成就",
      score: clampScore(kline.insight.totalScore + trendBoost + (tenGodSet.has("正官") || tenGodSet.has("七杀") ? 6 : 0) + (tenGodSet.has("正财") ? 3 : 0)),
      icon: <IconCareer />,
      gradient: "luxGradientB"
    },
    {
      key: "fengshui",
      title: "发展风水",
      score: clampScore(kline.insight.totalScore + paipan.overall.favorableElements.length * 3 - paipan.overall.unfavorableElements.length * 2),
      icon: <IconFengShui />,
      gradient: "luxGradientC"
    },
    {
      key: "wealth",
      title: "财富能量",
      score: clampScore(kline.insight.totalScore + (tenGodSet.has("正财") || tenGodSet.has("偏财") ? 8 : 0) + (trendBoost > 0 ? 2 : -1)),
      icon: <IconWealth />,
      gradient: "luxGradientD"
    },
    {
      key: "love",
      title: "情感婚姻",
      score: clampScore(kline.insight.totalScore + (paipan.overall.dayMasterStrength === "中" ? 4 : paipan.overall.dayMasterStrength === "强" ? 2 : -2) + (tenGodSet.has("正官") ? 3 : 0) - (tenGodSet.has("伤官") ? 3 : 0)),
      icon: <IconLove />,
      gradient: "luxGradientE"
    },
    {
      key: "health",
      title: "身心健康",
      score: clampScore(kline.insight.totalScore + (paipan.overall.dayMasterStrength === "弱" ? -6 : 2) + (kline.insight.overallTrend === "波动" ? -2 : 2)),
      icon: <IconHealth />,
      gradient: "luxGradientF"
    },
    {
      key: "family",
      title: "六亲关系",
      score: clampScore(kline.insight.totalScore + (tenGodSet.has("比肩") ? 2 : 0) - (tenGodSet.has("劫财") ? 3 : 0) + paipan.overall.favorableElements.length),
      icon: <IconFamily />,
      gradient: "luxGradientG"
    }
  ].map((item) => ({ ...item, comment: buildInsightText(item.key, item.score) }));

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
              <div className="luxCard luxGradientA">
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

              <div className="luxCard luxGradientB">
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

            <div className="luxCard luxCardBlock luxGradientD">
              <div className="luxCardTitle">人生百年K线</div>
              <KLineChart paipan={paipan} kline={kline} onReady={setChartApi} />
              <div className="luxChartHint">绿色为上涨，红色为下跌。Hover 可查看年度详情。</div>
            </div>

            <div className="luxCardGrid">
              <div className="luxCard luxGradientE">
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

              <div className="luxCard luxGradientF">
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

            <div className="luxCardGrid">
              {analysisCards.map((card) => (
                <div key={card.key} className={`luxCard ${card.gradient}`}>
                  <div className="luxCardTitle luxCardTitleRow">
                    {card.icon}
                    <span>{card.title}</span>
                  </div>
                  <div className="luxInsightScore">
                    <span className="luxInsightScoreNum">{card.score}</span>
                    <span className="luxInsightScoreUnit">/ 100</span>
                  </div>
                  <div className="luxInsightText">{card.comment}</div>
                </div>
              ))}
            </div>

            <div className="luxCard luxCardBlock luxGradientG">
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
