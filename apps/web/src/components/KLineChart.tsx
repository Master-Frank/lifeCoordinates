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

  const seedFrom = (y: KLineResult["years"][number]) => {
    const a = y.ganZhi.charCodeAt(0) || 0;
    const b = y.ganZhi.charCodeAt(1) || 0;
    const t = y.tags?.length ? y.tags.join("").length : 0;
    return y.year + y.age + Math.round(y.score) + a + b + (y.trend === "up" ? 3 : 7) + t;
  };

  const pickBySeed = (list: string[], seed: number) => list[seed % list.length];

  const buildRemark = (y: KLineResult["years"][number]) => {
    const seed = seedFrom(y);
    const tags = y.tags?.length ? y.tags.join("、") : "";
    const toneStrong = ["势能充足", "上升动能明显", "强势窗口", "节奏加速"]; 
    const toneMid = ["节奏稳定", "走势平衡", "推进有序", "节奏可控"]; 
    const toneLow = ["波动偏大", "节奏偏紧", "需要稳盘", "先守后攻"]; 
    const tone = y.score >= 75 ? pickBySeed(toneStrong, seed) : y.score >= 60 ? pickBySeed(toneMid, seed) : pickBySeed(toneLow, seed);
    const trendUp = ["可顺势放大优势", "适合推进关键事项", "把握节拍推进", "适度提速但别失衡"]; 
    const trendDown = ["先稳住节奏再调整", "降低波动，循序修复", "优先守住关键，再做突破", "避免追涨杀跌"]; 
    const trend = y.trend === "up" ? pickBySeed(trendUp, seed + 2) : pickBySeed(trendDown, seed + 5);
    const tagHint = tags ? `侧重：${pickBySeed(["合力", "冲克", "节拍"], seed + 9)}（${tags}）` : pickBySeed(["稳节拍", "重执行", "控回撤"], seed + 11);
    return `${tone}；${trend}；${tagHint}`;
  };

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
          padding: 14,
          textStyle: { color: "#1c1917", fontSize: 12 },
          extraCssText: "box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); border-radius: 12px;",
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            const idx = Number(p?.dataIndex ?? 0);
            const y = kline.years[idx];
            if (!y) return "";
            const tags = y.tags?.length ? y.tags.join("、") : "";
            const isUp = y.close >= y.open;
            const color = isUp ? "#22c55e" : "#ef4444";
            const remark = buildRemark(y);

            return `
              <div style="font-family:Inter,system-ui,sans-serif; min-width:180px;">
                <div style="height:3px; border-radius:999px; background:linear-gradient(90deg, rgba(34,197,94,0.6), rgba(202,138,4,0.45)); margin-bottom:10px;"></div>
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
                   <span style="font-weight:600; font-size:14px; color:#1c1917;">${y.year} ${y.ganZhi}</span>
                   <span style="font-size:11px; color:#78716c; background:#f5f5f4; padding:2px 6px; border-radius:999px;">${y.age}岁</span>
                </div>
                <div style="margin-bottom:10px; font-size:12px; color:#57534e; line-height:1.4;">
                  <span style="font-weight:600; color:${color}">评分 ${y.score}</span>
                  <span style="margin:0 6px; color:#d6d3d1">|</span>
                  <span>${y.brief}${tags ? `｜${tags}` : ""}</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px; color:#a8a29e; border-top:1px solid #f5f5f4; padding-top:8px;">
                  <div style="display:flex; justify-content:space-between;"><span>开</span> <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#57534e">${y.open}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>收</span> <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#57534e">${y.close}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>高</span> <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#57534e">${y.high}</span></div>
                  <div style="display:flex; justify-content:space-between;"><span>低</span> <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color:#57534e">${y.low}</span></div>
                </div>
                <div style="margin-top:8px; padding:6px 8px; background:#fafaf9; border:1px solid #f5f5f4; border-radius:8px; font-size:11px; color:#57534e;">
                  评语：${remark}
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

