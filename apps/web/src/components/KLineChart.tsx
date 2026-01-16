import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { KLineResult } from "@life-coordinates/core";
import * as echarts from "echarts";

interface Props {
  data: KLineResult;
  height?: number;
}

export function KLineChart({ data, height = 500 }: Props) {
  const option = useMemo(() => {
    const dates = data.years.map((y) => `${y.year} (${y.age}岁)`);
    const values = data.years.map((y) => [y.open, y.close, y.low, y.high]);
    const volumes = data.years.map((y, i) => [i, y.score, y.trend === "up" ? 1 : -1]);

    // Calculate DaYun markLines
    const markLines = data.daYunStages.map((stage) => ({
      xAxis: data.years.findIndex((y) => y.age === stage.startAge),
      label: {
        formatter: `${stage.ganZhi}\n${stage.startAge}-${stage.endAge}`,
        position: "start",
      },
    }));

    return {
      title: {
        text: "人生 K 线图 (Life K-Line)",
        left: 0,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        formatter: (params: any) => {
          const klineParam = params[0];
          if (!klineParam) return "";
          const idx = klineParam.dataIndex;
          const yearData = data.years[idx];
          return `
            <div style="font-size:12px">
              <b>${yearData.year}年 (${yearData.age}岁) ${yearData.ganZhi}</b><br/>
              评分: ${yearData.score}<br/>
              趋势: ${yearData.trend === "up" ? "📈 上升" : "📉 下跌"}<br/>
              简评: ${yearData.brief}<br/>
              ${yearData.tags.map(t => `<span style="background:#eee;padding:1px 4px;border-radius:2px;margin-right:4px">${t}</span>`).join("")}
            </div>
          `;
        }
      },
      grid: [
        {
          left: "5%",
          right: "5%",
          height: "70%",
        },
        {
          left: "5%",
          right: "5%",
          top: "80%",
          height: "15%",
        },
      ],
      xAxis: [
        {
          type: "category",
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: "dataMin",
          max: "dataMax",
        },
        {
          type: "category",
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: "dataMin",
          max: "dataMax",
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
          },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: "slider",
          bottom: 10,
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: "运势K线",
          type: "candlestick",
          data: values,
          itemStyle: {
            color: "#22c55e", 
            color0: "#ef4444",
            borderColor: "#22c55e",
            borderColor0: "#ef4444",
          },
          markLine: {
            symbol: ["none", "none"],
            data: markLines,
            label: {
              formatter: "{b}",
              position: "start"
            },
            lineStyle: {
              color: "#aaa",
              type: "dashed"
            }
          },
        },
        {
          name: "评分",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes, // We can just show score bars
          itemStyle: {
            color: (params: any) => {
              const trend = data.years[params.dataIndex].trend;
              return trend === "up" ? "#22c55e" : "#ef4444";
            }
          }
        },
      ],
    };
  }, [data]);

  return <ReactECharts option={option} style={{ height }} />;
}
