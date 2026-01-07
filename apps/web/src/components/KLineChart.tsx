import ReactECharts from "echarts-for-react";
import type { YearKLine } from "@life-coordinates/core";

export default function KLineChart(props: {
  data: YearKLine[];
  daYunSplits: { age: number; label: string }[];
  onReady?: (instance: any) => void;
}) {
  const categories = props.data.map((d) => `${d.age}`);
  const values = props.data.map((d) => [d.open, d.close, d.low, d.high]);
  const scores = props.data.map((d) => d.score);
  const ganZhi = props.data.map((d) => d.ganZhi);

  const markLines = props.daYunSplits.map((s) => ({
    xAxis: String(s.age),
    lineStyle: { type: "dashed", opacity: 0.5 },
    label: { formatter: s.label, rotate: 90, opacity: 0.85 }
  }));

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross"
      },
      formatter: (params: any) => {
        const i = params?.[0]?.dataIndex ?? 0;
        const y = props.data[i];
        return [
          `${y.year}年 / 虚岁${y.age}`,
          `流年：${ganZhi[i]}`,
          `评分：${scores[i]}`,
          `解读：${y.brief}`
        ].join("<br/>");
      }
    },
    grid: {
      left: 48,
      right: 18,
      top: 20,
      bottom: 40
    },
    xAxis: {
      type: "category",
      data: categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { color: "#64748b", interval: 9 }
    },
    yAxis: {
      scale: true,
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#64748b" }
    },
    series: [
      {
        type: "candlestick",
        data: values,
        itemStyle: {
          color: "#22c55e",
          color0: "#ef4444",
          borderColor: "#22c55e",
          borderColor0: "#ef4444"
        },
        markLine: {
          symbol: ["none", "none"],
          data: markLines
        }
      }
    ]
  };

  return (
    <ReactECharts
      style={{ height: 420 }}
      option={option}
      onChartReady={(inst) => props.onReady?.(inst)}
      notMerge
      lazyUpdate
    />
  );
}
