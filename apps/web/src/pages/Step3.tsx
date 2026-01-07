import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import KLineChart from "../components/KLineChart";
import { createShare } from "../lib/api";
import { loadSession } from "../lib/storage";

export default function Step3() {
  const nav = useNavigate();
  const session = useMemo(() => loadSession(), []);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const chartRef = useRef<any>(null);

  if (!session || !session.paipan || !session.kline || !session.input) {
    return (
      <div className="card">
        <div>未找到测算结果，请从首页开始。</div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => nav("/")}>返回首页</button>
        </div>
      </div>
    );
  }

  const paipan = session.paipan;
  const kline = session.kline;
  const input = session.input;

  const daYunSplits = paipan.daYun
    .filter((d: (typeof paipan.daYun)[number]) => d.startAge >= 1 && d.startAge <= 100)
    .map((d: (typeof paipan.daYun)[number]) => ({ age: d.startAge, label: d.ganZhi }));

  async function onShare() {
    setSharing(true);
    setShareError(null);
    try {
      const { id } = await createShare(paipan, kline);
      setShareId(id);
    } catch (e: any) {
      setShareError(e?.message ?? String(e));
    } finally {
      setSharing(false);
    }
  }

  function downloadImage() {
    const inst = chartRef.current;
    if (!inst) return;
    const dataUrl = inst.getDataURL({ pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${input.name}-人生K线.png`;
    a.click();
  }

  function exportPdf() {
    window.print();
  }

  const pillars = [paipan.fourPillars.year, paipan.fourPillars.month, paipan.fourPillars.day, paipan.fourPillars.hour];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Step 3 · {input.name}的人生K线</h2>
        <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.8 }}>
          <div>
            性别：{input.gender === "male" ? "男" : "女"} ｜ 出生：{input.calendar === "solar" ? "公历" : "农历"} ｜ 地点：{input.location.province}{input.location.city}
          </div>
          <div>修正后时间：{paipan.solar.correctedYmdHms}（经度修正 {paipan.solar.longitudeDeltaMinutes} 分钟）</div>
          <div>
            四柱：{pillars.map((p) => `${p.gan}${p.zhi}`).join(" ")}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>1️⃣ 用户基本信息区</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>柱</th>
                <th>天干</th>
                <th>地支</th>
                <th>主星(十神)</th>
                <th>藏干</th>
                <th>副星(地支十神)</th>
                <th>藏干十神</th>
                <th>星运</th>
                <th>自坐</th>
                <th>空亡</th>
                <th>纳音</th>
                <th>神煞</th>
              </tr>
            </thead>
            <tbody>
              {pillars.map((x) => (
                <tr key={x.pillar}>
                  <td>{x.pillar === "year" ? "年" : x.pillar === "month" ? "月" : x.pillar === "day" ? "日" : "时"}</td>
                  <td>{x.gan}</td>
                  <td>{x.zhi}</td>
                  <td>{x.ganTenGod}</td>
                  <td>{x.hiddenStems.join(" ")}</td>
                  <td>{x.zhiTenGod}</td>
                  <td>{x.hiddenStemTenGods.join(" ")}</td>
                  <td>{x.starLuck}</td>
                  <td>{x.selfSeat}</td>
                  <td>{x.kongWang}</td>
                  <td>{x.naYin}</td>
                  <td>{x.shenSha.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>2️⃣ 人生百年K线图</h3>
        <KLineChart data={kline.years} daYunSplits={daYunSplits} onReady={(inst) => (chartRef.current = inst)} />
        <div className="no-print" style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button className="secondary" onClick={downloadImage}>导出高清图片（K线）</button>
          <button className="secondary" onClick={exportPdf}>导出 PDF 报告</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>3️⃣ 人生阶段分析（十年大运）</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {kline.daYunStages.map((s: (typeof kline.daYunStages)[number]) => (
            <details key={`${s.startAge}-${s.ganZhi}`}>
              <summary>
                {s.startAge}-{s.endAge} 岁｜大运：{s.ganZhi}｜评分：{s.score}
              </summary>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.8, opacity: 0.9 }}>
                <div>总体特征：{s.summary}</div>
                <div>行动建议：{s.advice}</div>
                {s.risks.length ? <div>风险提示：{s.risks.join("、")}</div> : null}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>4️⃣ 人生K线深度解读（生成）</h3>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.92 }}>
          <div>1. 人生整体走势判断：{kline.insight.overallTrend}｜综合评分：{kline.insight.totalScore}</div>
          <div>
            2. 关键高峰：
            {kline.insight.peaks.slice(0, 3).map((p: (typeof kline.insight.peaks)[number]) => `${p.year}(虚岁${p.age}, ${p.ganZhi}, ${p.score})`).join("；")}
          </div>
          <div>
            3. 关键低谷：
            {kline.insight.troughs
              .slice(0, 3)
              .map((p: (typeof kline.insight.troughs)[number]) => `${p.year}(虚岁${p.age}, ${p.ganZhi}, ${p.score})`)
              .join("；")}
          </div>
          <div>4. 十神结构倾向：{kline.insight.tenGodFocus.join("、") || "-"}</div>
          <div>5. 总结建议：{kline.insight.summary}</div>
        </div>
      </div>

      <div className="card no-print">
        <h3 style={{ marginTop: 0 }}>5️⃣ 导出与保存</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button disabled={sharing} onClick={onShare}>生成只读分享链接</button>
          {shareId ? (
            <div style={{ fontSize: 13 }}>
              链接：<a href={`/share/${shareId}`}>{location.origin}/share/{shareId}</a>
            </div>
          ) : null}
        </div>
        {shareError ? <div className="error">{shareError}</div> : null}
      </div>
    </div>
  );
}
