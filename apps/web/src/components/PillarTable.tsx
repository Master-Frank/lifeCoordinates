import type { PaipanResult } from "@life-coordinates/core";

// 五行映射
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

const ZhiToElement: Record<string, "木" | "火" | "土" | "金" | "水"> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水"
};

// 五行颜色映射
const ElementColors: Record<"木" | "火" | "土" | "金" | "水", string> = {
  木: "#22c55e", // 绿色
  火: "#ef4444", // 红色
  土: "#a16207", // 棕色/土色
  金: "#eab308", // 黄色/金色
  水: "#3b82f6" // 蓝色
};

function getElementColor(text: string, isGan: boolean): string | undefined {
  const element = isGan ? GanToElement[text] : ZhiToElement[text];
  return element ? ElementColors[element] : undefined;
}

function renderWithColor(text: string, isGan: boolean, className?: string) {
  const color = getElementColor(text, isGan);
  if (color) {
    return (
      <span className={className} style={{ color, fontWeight: 600 }}>
        {text}
      </span>
    );
  }
  return <span className={className}>{text}</span>;
}

function renderHiddenStems(stems: string[]) {
  return stems.map((stem, idx) => {
    const color = getElementColor(stem, true);
    return (
      <span key={idx}>
        {color ? (
          <span style={{ color, fontWeight: 600 }}>{stem}</span>
        ) : (
          <span>{stem}</span>
        )}
        {idx < stems.length - 1 && " "}
      </span>
    );
  });
}

export default function PillarTable({ paipan }: { paipan: PaipanResult }) {
  const year = paipan.fourPillars.year;
  const month = paipan.fourPillars.month;
  const day = paipan.fourPillars.day;
  const hour = paipan.fourPillars.hour;
  const cols = [year, month, day, hour];
  const colLabels = ["年柱", "月柱", "日柱", "时柱"];
  return (
    <div className="luxTableWrap" role="region" aria-label="八字排盘">
      <table className="luxTable">
        <thead>
          <tr>
            <th>日期</th>
            {colLabels.map((l) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="luxTdStrong">主星</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.ganTenGod}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">天干</td>
            {cols.map((c) => (
              <td key={c.pillar} className={c.pillar === "day" ? "luxTdStrong" : undefined}>
                {renderWithColor(c.gan, true, c.pillar === "day" ? undefined : undefined)}
                {c.pillar === "day" ? <span className="luxTag">日主</span> : null}
              </td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">地支</td>
            {cols.map((c) => (
              <td key={c.pillar}>{renderWithColor(c.zhi, false)}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">藏干</td>
            {cols.map((c) => (
              <td key={c.pillar}>{renderHiddenStems(c.hiddenStems)}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">副星</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.zhiTenGod}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">藏干十神</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.hiddenStemTenGods.join(" ")}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">星运</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.starLuck}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">自坐</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.selfSeat}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">空亡</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.kongWang}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">纳音</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.naYin}</td>
            ))}
          </tr>
          <tr>
            <td className="luxTdStrong">神煞</td>
            {cols.map((c) => (
              <td key={c.pillar}>{c.shenSha.join("、")}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
