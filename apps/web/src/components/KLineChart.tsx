import type { KLineResult, PaipanResult } from "@life-coordinates/core";
import { useEffect, useRef } from "react";

export type KLineChartApi = {
  getPngDataUrl: (pixelRatio: number) => string | null;
};

export default function KLineChart({
  paipan,
  kline,
  onReady
}: {
  paipan: PaipanResult;
  kline: KLineResult;
  onReady?: (api: KLineChartApi | null) => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<KLineChartApi | null>(null);

  useEffect(() => {
    let disposed = false;
    let chart: any = null;
    let resizeObs: ResizeObserver | null = null;

    async function run() {
      if (!elRef.current) return;
      const echarts = await import("echarts");
      if (disposed) return;
      chart = echarts.init(elRef.current, undefined, { renderer: "canvas" });

      const categories = kline.years.map((y) => String(y.age));
      const seriesData = kline.years.map((y) => [
        y.open,
        y.close,
        Math.min(y.open, y.close), // Hide lower shadow
        Math.max(y.open, y.close) // Hide upper shadow
      ]);

      const markLines = paipan.daYun
        .filter((d) => d.startAge >= 1 && d.startAge <= 100)
        .map((d) => ({
          xAxis: String(d.startAge),
          label: {
            formatter: d.ganZhi,
            color: "rgba(12, 10, 9, 0.45)",
            fontSize: 10,
            padding: [0, 4, 0, 4]
          },
          lineStyle: {
            color: "rgba(12, 10, 9, 0.15)",
            type: "dashed"
          }
        }));

      chart.setOption({
        animation: false,
        grid: { left: 40, right: 16, top: 24, bottom: 24 },
        xAxis: {
          type: "category",
          data: categories,
          boundaryGap: true,
          axisLine: { lineStyle: { color: "rgba(120, 113, 108, 0.2)" } },
          axisLabel: { color: "rgba(120, 113, 108, 0.6)", fontSize: 10, interval: 9 },
          axisTick: { show: false }
        },
        yAxis: {
          scale: true,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "rgba(120, 113, 108, 0.1)" } },
          axisLabel: { color: "rgba(120, 113, 108, 0.6)", fontSize: 10 }
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "line", lineStyle: { color: "rgba(0,0,0,0.1)", type: "dashed" } },
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderColor: "rgba(231, 229, 228, 1)",
          borderWidth: 1,
          padding: 12,
          textStyle: { color: "#1c1917", fontSize: 12 },
          extraCssText: "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 8px;",
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            const idx = Number(p?.dataIndex ?? 0);
            const y = kline.years[idx];
            if (!y) return "";
            const tags = y.tags?.length ? `｜${y.tags.join(" ")}` : "";
            const isUp = y.close >= y.open;
            const color = isUp ? "#22c55e" : "#ef4444";
            
            return `
              <div style="font-family:Inter,system-ui,sans-serif; min-width:160px;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
                   <span style="font-weight:600; font-size:14px; color:#1c1917;">${y.year} ${y.ganZhi}</span>
                   <span style="font-size:11px; color:#78716c; background:#f5f5f4; padding:1px 4px; border-radius:4px;">${y.age}岁</span>
                </div>
                <div style="margin-bottom:8px; font-size:12px; color:#57534e; line-height:1.4;">
                  <span style="font-weight:500; color:${color}">评分 ${y.score}</span>
                  <span style="margin:0 4px; color:#d6d3d1">|</span>
                  <span>${y.brief}${tags}</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:x 8px; font-size:11px; color:#a8a29e; border-top:1px solid #f5f5f4; padding-top:6px;">
                  <div style="display:flex; justify-content:space-between;"><span>开</span> <span style="font-family:monospace; color:#57534e">${y.open}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>收</span> <span style="font-family:monospace; color:#57534e">${y.close}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>高</span> <span style="font-family:monospace; color:#57534e">${y.high}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>低</span> <span style="font-family:monospace; color:#57534e">${y.low}</span></div>
                </div>
              </div>
            `;
          }
        },
        series: [
          {
            name: "人生K线",
            type: "candlestick",
            data: seriesData,
            itemStyle: {
              color: "#22c55e", // Green
              color0: "#ef4444", // Red
              borderColor: "#22c55e",
              borderColor0: "#ef4444"
            },
            markLine: {
              symbol: ["none", "none"],
              animation: false,
              label: { show: false }, // Hide default labels, use custom data labels
              data: markLines
            }
          }
        ]
      });

      apiRef.current = {
        getPngDataUrl: (pixelRatio) => {
          if (!chart) return null;
          return chart.getDataURL({ type: "png", pixelRatio, backgroundColor: "#fafaf9" }) as string;
        }
      };

      onReady?.(apiRef.current);

      resizeObs = new ResizeObserver(() => chart?.resize());
      resizeObs.observe(elRef.current);
    }

    void run();
    return () => {
      disposed = true;
      onReady?.(null);
      apiRef.current = null;
      resizeObs?.disconnect();
      chart?.dispose?.();
    };
  }, [kline, paipan, onReady]);

  return <div className="luxChart" ref={elRef} />;
}

