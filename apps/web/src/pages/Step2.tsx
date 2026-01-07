import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { computeAll } from "../lib/api";
import { loadSession, saveSession } from "../lib/storage";

export default function Step2() {
  const nav = useNavigate();
  const session = useMemo(() => loadSession(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !session.paipan || !session.input) {
    return (
      <div className="card">
        <div>未找到上一步输入，请返回重填。</div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => nav("/")}>返回修改信息</button>
        </div>
      </div>
    );
  }

  const p = session.paipan;
  const input = session.input;

  async function onConfirm() {
    setLoading(true);
    setError(null);
    try {
      const { paipan, kline } = await computeAll(input);
      saveSession({ input, paipan, kline });
      nav("/result");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const pillars = [p.fourPillars.year, p.fourPillars.month, p.fourPillars.day, p.fourPillars.hour];

  return (
    <div className="step-layout">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Step 2 · 核对你的基础命盘</h2>
        <div style={{ marginBottom: 12, opacity: 0.85, fontSize: 13 }}>
          姓名：{input.name} ｜ 性别：{input.gender === "male" ? "男" : "女"} ｜ 历法：{input.calendar === "solar" ? "公历" : "农历"}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "#475569" }}>
          <div>左侧是四柱详细信息，右侧是整体概览（喜用神、大运起运等）。</div>
          <div>请重点确认日主、起运年龄、真太阳时修正是否符合你的预期。</div>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button className="secondary" disabled={loading} onClick={() => nav("/")}>返回修改信息</button>
          <button disabled={loading} onClick={onConfirm}>确认无误，生成人生K线</button>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div>
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
                      <td>
                        {x.pillar === "year" ? "年" : x.pillar === "month" ? "月" : x.pillar === "day" ? "日" : "时"}
                        {x.pillar === "day" ? "（日主）" : ""}
                      </td>
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
          <div>
            <div className="row" style={{ marginTop: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <div>日主五行：{p.fourPillars.dayMaster.element}</div>
                <div>日主强弱：{p.overall.dayMasterStrength}</div>
                <div>喜用神（五行）：{p.overall.favorableElements.join(" ")}</div>
                <div>忌神（五行）：{p.overall.unfavorableElements.join(" ")}</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div>起运年龄：{p.overall.startLuckAge}</div>
                <div>大运方向：{p.overall.luckDirection}</div>
                <div>真太阳时修正：{p.solar.longitudeDeltaMinutes} 分钟</div>
                <div>修正后时间：{p.solar.correctedYmdHms}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
