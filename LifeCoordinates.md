# 人生坐标 · Life Coordinates

本项目是一个三步式（输入 → 排盘确认 → 结果展示）的前后端交互 Web 应用：

- Step 1：用户输入（公历/农历、时间精确/不确定、出生地省/市 → 自动经度 → 真太阳时修正）
- Step 2：展示并确认八字排盘核心信息（四柱、十神、藏干等）
- Step 3：生成并展示 100 年“人生 K 线”（含十年大运分隔与阶段总结），并支持分享链接

技术栈：TypeScript Monorepo（workspaces）+ 前端 React/Vite + 后端 Fastify + 核心算法包 core。

---

## 1. 仓库结构与职责划分

工作区：`apps/*` + `packages/*`

### packages/core（领域核心）

目标：纯函数化、可复用、与 Web/UI 解耦。

- `src/types.ts`：核心数据结构定义（BirthInput、PaipanResult、KLineResult 等）
- `src/birth.ts`：输入校验（zod）、时间归一化、真太阳时修正
- `src/paipan.ts`：基于 lunar-javascript 的排盘封装与结构化输出
- `src/kline.ts`：人生 K 线生成算法（100 年 OHLC + 大运阶段总结）
- `src/index.ts`：对外导出

### apps/api（后端 API）

目标：输入校验、调用 core、提供分享存储与地理编码服务。

- `src/server.ts`
  - `POST /api/paipan`：只排盘
  - `POST /api/compute`：排盘 + K 线
  - `POST /api/share`、`GET /api/share/:id`：分享存储（JSON 文件）
  - `GET /api/geo/suggest`、`GET /api/geo/geocode`：省/市 → 地理编码（用于自动经度）

### apps/web（前端）

目标：三步式交互与可视化。

- `src/pages/Step1.tsx`：表单输入与经度自动填充
- `src/pages/Step2.tsx`：排盘确认
- `src/pages/Step3.tsx`：K 线图与阶段洞察
- `src/pages/Share.tsx`：分享页
- `src/components/KLineChart.tsx`：ECharts K 线渲染
- `src/lib/api.ts`：与后端交互封装
- `src/lib/storage.ts`：会话数据存储（用于 step 间跳转）

---

## 2. 用户交互流程（Step-by-step）

### Step 1：输入

用户输入：

- 姓名（必填）、性别
- 历法：公历/农历（农历可选闰月）
- 出生时间：精确到时分 或 “时间不确定”（时辰/上午/下午）
- 出生地点：省下拉 + 市输入下拉建议
- 经度：根据省/市自动匹配并写入（可微调），用于真太阳时修正

提交时：

1) 前端使用 core 的 `BirthInputSchema` 进行一次 zod 校验
2) 调用后端 `POST /api/paipan`
3) 保存本次会话（input + paipan）并跳转 Step 2

### Step 2：排盘确认

展示：

- 真太阳时修正前/后的时间、经度差（分钟）
- 四柱（年/月/日/时）的干支、十神、藏干/藏干十神、神煞等
- 大运起运年龄、顺逆

确认后跳转 Step 3。

### Step 3：人生 K 线

由后端 `POST /api/compute` 或前端复用已有排盘计算结果生成：

- 100 年年度 OHLC（open/high/low/close）
- 十年大运分段、各段评分/总结/建议/风险
- 峰值/谷值、整体趋势归类

可生成分享：

- `POST /api/share` 写入 JSON 文件并返回短 ID
- 分享页通过 `GET /api/share/:id` 读取

---

## 3. 数据结构定义（核心类型）

核心输入：

```ts
export type BirthInput = {
  name: string;
  gender: "male" | "female";
  calendar: "solar" | "lunar";
  date: { year: number; month: number; day: number; isLeapMonth?: boolean };
  time:
    | { mode: "exact"; hour: number; minute: number }
    | { mode: "segment"; label: "子时" | "丑时" | "寅时" | "卯时" | "辰时" | "巳时" | "午时" | "未时" | "申时" | "酉时" | "戌时" | "亥时" | "上午" | "下午" };
  location: { province: string; city: string; longitude: number };
};
```

排盘输出（摘取关键）：

```ts
export type PaipanResult = {
  input: BirthInput;
  solar: {
    ymdHms: string;
    correctedYmdHms: string;
    longitudeDeltaMinutes: number;
  };
  lunar: {
    ymd: string;
    isLeapMonth: boolean;
  };
  fourPillars: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail;
    dayMaster: { gan: string; element: "木" | "火" | "土" | "金" | "水" };
  };
  overall: {
    dayMasterStrength: "强" | "中" | "弱";
    favorableElements: ("木" | "火" | "土" | "金" | "水")[];
    unfavorableElements: ("木" | "火" | "土" | "金" | "水")[];
    startLuckAge: number;
    luckDirection: "顺" | "逆";
  };
  daYun: { startYear: number; endYear: number; startAge: number; endAge: number; ganZhi: string }[];
};
```

K 线输出（摘取关键）：

```ts
export type YearKLine = {
  age: number;
  year: number;
  ganZhi: string;
  open: number;
  high: number;
  low: number;
  close: number;
  score: number;
  trend: "up" | "down";
  tags: string[];
  brief: string;
};

export type KLineResult = {
  years: YearKLine[];
  daYunStages: { startAge: number; endAge: number; ganZhi: string; score: number; summary: string; advice: string; risks: string[] }[];
  insight: {
    overallTrend: "前高" | "中高" | "后高" | "波动";
    peaks: { age: number; year: number; score: number; ganZhi: string }[];
    troughs: { age: number; year: number; score: number; ganZhi: string }[];
    tenGodFocus: string[];
    totalScore: number;
    summary: string;
  };
};
```

---

## 4. lunar-javascript 排盘核心代码（封装要点）

核心逻辑位于 `packages/core/src/paipan.ts`：

1) 将“精确时间 / 时间段模式”归一化为一个代表性时刻（用于计算）
2) 用经度做真太阳时修正：`deltaMinutes = (longitude - 120) * 4`
3) 根据历法创建 Solar 或 Lunar，再拿到 Lunar：

```ts
if (input.calendar === "solar") {
  solar = Solar.fromYmdHms(y, m, d, hh, mm, ss);
  lunar = solar.getLunar();
} else {
  lunar = Lunar.fromYmdHms(y, m, d, hh, mm, ss, Boolean(input.date.isLeapMonth));
  solar = lunar.getSolar();
}
```

4) 通过 `lunar.getEightChar()` 读取四柱信息，并结构化为统一输出：

- 四柱干支
- 十神（干/支）
- 藏干与藏干十神
- 神煞、空亡、纳音等

5) 计算日主强弱与喜忌（用于后续评分）：

- `evaluateDayMasterStrength(...)`
- `pickFavorableElements(...)`

6) 大运列表：优先使用 lunar-javascript 的 `getYun().getDaYun()`，不存在则走降级计算。

另外：为避免不同构建形态下 `lunar.isLeap()` 差异导致的崩溃，闰月判断做了兼容取值（函数/布尔属性/内部字段）。

---

## 5. 人生 K 线生成算法（严格按权重）

核心逻辑位于 `packages/core/src/kline.ts`。

### 5.1 年度评分的组成与权重

年度总分 `total` 采用如下加权（权重固定）：

- 20%：本命盘基础分（`natalBase`）
- 35%：大运分（`luckRel.score`）
- 30%：流年分（`yearFactor`）
- 10%：冲合刑害/互动因子（`clash.score`）
- 5%：格局/结构修正（`patternScore`）

对应实现（关键片段）：

```ts
const total = clamp01(
  natalBase * 0.2 +
    luckRel.score * 0.35 +
    yearFactor * 0.3 +
    clash.score * 0.1 +
    patternScore * 0.05
);
```

### 5.2 从“分数”生成 OHLC（K 线）

- `open`：上一年 close
- `close`：本年 total
- `high/low`：根据“大运偏离 + 冲合变化”构造波动区间（vol），并做 0~100 限幅

### 5.3 十年大运分段

按 `paipan.daYun` 分段，把每个阶段覆盖的年度分数做均值，生成：

- 段评分（均值→取整→限幅）
- 段总结（偏强/平稳/偏弱）
- 段建议与风险提示

### 5.4 洞察输出

- 全局峰值/谷值（取若干个）
- 分三段对比（前 34/中 33/后 33）判断整体趋势：前高/中高/后高/波动
- 提取若干十神作为关注点

---

## 6. 前端页面结构示意

- `App.tsx`：路由入口
  - `/` → Step1
  - `/confirm` → Step2
  - `/result` → Step3
  - `/share/:id` → Share

组件：

- `KLineChart.tsx`：candlestick + 分段线/标注（由 Step3 传入数据）

---

## 7. 可扩展与商业化方向（建议）

- 数据层：将分享存储从 JSON 升级为数据库（PostgreSQL / MySQL），加入索引与过期清理
- 算法层：加入更细维度的“流月/流日”曲线；增加可解释性因子（每个分项的分解与证据）
- 体验层：为省/市经纬度引入更稳定的国内地图服务（如高德/腾讯）以提高命中率
- 安全与合规：加入速率限制、防刷；分享链接可设置有效期；日志脱敏
- 变现：订阅（高级洞察）、定制报告、合伙人分销、企业版 API

---

## 8. 部署与启动方式

### 8.1 本地开发

安装依赖：

```bash
npm install
```

启动后端：

```bash
npm run dev -w @life-coordinates/api
```

启动前端：

```bash
npm run dev -w @life-coordinates/web
```

### 8.2 构建

```bash
npm run build
```

### 8.3 生产运行（示意）

- 后端：`npm run start -w @life-coordinates/api`
- 前端：`npm run build -w @life-coordinates/web` 后把 `dist/` 静态资源交给 Nginx 托管，并反代 `/api/*` 到后端端口

---

## 9. 关键文件索引

- `packages/core/src/paipan.ts`
- `packages/core/src/kline.ts`
- `packages/core/src/birth.ts`
- `apps/api/src/server.ts`
- `apps/web/src/pages/Step1.tsx`
- `apps/web/src/pages/Step2.tsx`
- `apps/web/src/pages/Step3.tsx`
- `apps/web/src/components/KLineChart.tsx`

