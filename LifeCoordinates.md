prompt：
你是一位同时精通以下领域的专家角色集合体：
- 中国传统八字命理（四柱、十神、主星、副星、大运、流年、神煞、纳音、空亡）
- 命理工程化建模（将命理关系量化、评分、结构化）
- 金融量化与可视化（K线、趋势、阶段分析）
- 现代 Web 全栈架构设计（Node.js / TypeScript / 前端组件化）
- ToC 产品设计与高质量展示型产品 UX

你的任务是：  
【从 0 到 1 设计并实现一个完整 Web 产品】  
产品名：《人生K线 · Life Destiny K-Line》

====================================================
一、产品核心目标
====================================================
将用户的八字命盘作为底层模型，
把人生运势转化为“类似股票行情的人生百年K线图”，
用于直观展示人生运势的起伏、高峰、低谷与关键转折期。

产品原则：
- 排盘必须专业、准确、可验证
- 文案理性克制，不迷信、不夸张
- 数据结构清晰，结果可保存、可分享、可展示

====================================================
二、完整用户交互流程（必须严格遵守）
====================================================

====================
Step 1：首页 · 用户信息输入
====================
用户需要输入以下信息：

1. 名字（Name）
   - 必填
   - 用于后续所有页面展示（如：XX的人生K线）

2. 性别
   - 男 / 女
   - 用于顺逆排大运

3. 出生日期
   - 支持【公历 / 农历】切换选择
   - 用户明确选择历法类型
   - 内部统一转换处理

4. 出生时间
   - 精确到 时:分
   - 需支持“时间不确定”模式（如：子时 / 上午 / 下午）

5. 出生地点
   - 省 / 市（至少精确到市）
   - 用于真太阳时修正（基于城市经度）

交互要求：
- 表单校验，缺项不可提交
- 清晰提示日期历法类型
- 点击按钮：【生成我的命盘】

====================
Step 2：基础八字排盘确认页（极其重要）
====================
⚠️ 八字排盘 **必须使用 `lunar-javascript` 库实现**
⚠️ 不允许自行简化算法或手写换算

技术要求：
- 使用 `lunar-javascript` 进行：
  - 公历 / 农历转换
  - 四柱（年、月、日、时）计算
  - 节气定月
  - 干支推算

页面需完整展示以下排盘信息（清晰表格）：

【基础四柱】
- 年柱：天干 / 地支
- 月柱：天干 / 地支
- 日柱：天干 / 地支（标注日主）
- 时柱：天干 / 地支

【扩展排盘信息】
- 主星（十神）
- 副星
- 地支藏干
- 星运
- 自坐
- 空亡
- 纳音
- 神煞（如：桃花、驿马、文昌等）

【整体判断】
- 日主五行
- 日主强弱（强 / 中 / 弱）
- 喜用神
- 忌神
- 起运年龄
- 大运顺逆方向

用户操作按钮：
- 【确认无误，生成人生K线】
- 【返回修改信息】

====================
Step 3：测算结果页（核心展示页）
====================

页面结构必须按以下顺序从上到下排列：

----------------------------------------------------
1️⃣ 用户基本信息区
----------------------------------------------------
展示内容：
- 名字（如：张三的人生K线）
- 性别、出生信息（历法类型明确）
- 出生地点（城市）
- 四柱八字完整信息（与 Step2 一致）

必须完整展示以下字段：
- 天干
- 地支
- 主星（十神）
- 副星
- 地支藏干
- 星运
- 自坐
- 空亡
- 纳音
- 神煞

----------------------------------------------------
2️⃣ 人生百年K线图（核心视觉）
----------------------------------------------------
K线规则：
- 横轴：虚岁 1 ～ 100
- 每一年一根 K 线
- 每 10 年一个十年大运
- 十年大运之间用【竖向虚线】分隔
- 标注每个大运的干支名称

视觉要求：
- 类似股票K线
- 上涨：绿色，下跌：红色
- Hover 展示：
  - 公历年 / 虚岁
  - 流年干支
  - 运势评分
  - 简要文字解读

----------------------------------------------------
3️⃣ 人生阶段分析（十年大运）
----------------------------------------------------
列表结构：
- 例如：20-29 岁｜大运：癸卯｜评分：78

点击展开后展示：
- 该十年大运的总体特征
- 对事业 / 财运 / 情感 / 健康的影响
- 风险提示
- 行动建议

----------------------------------------------------
4️⃣ 人生K线深度解读（AI生成）
----------------------------------------------------
必须包含以下模块：
1. 人生整体走势判断（前高 / 中高 / 后高）
2. 人生关键高峰与低谷年份
3. 十年大运对人生的主导作用
4. 十神结构与人生方向倾向
5. 综合人生评分与总结建议

----------------------------------------------------
5️⃣ 导出与保存
----------------------------------------------------
- 导出 PDF 报告
- 导出高清图片（K线）
- 生成只读分享链接

====================================================
三、人生K线数据模型（必须实现）
====================================================

```ts
type YearKLine = {
  age: number;          // 虚岁
  year: number;         // 公历年
  ganZhi: string;       // 流年干支
  open: number;         // 年初运势
  high: number;         // 年内高点
  low: number;          // 年内低点
  close: number;        // 年终运势
  score: number;        // 年度综合评分（0-100）
  trend: "up" | "down";
  tags: string[];
  brief: string;
};

====================================================
四、完整运势量化公式模板（必须严格采用）
====================================================
【年度运势总评分（100 分制）】
年度评分 =
本命盘基础 × 20%
十年大运 × 35%
流年作用 × 30%
冲合刑害 × 10%
格局修正 × 5%
1️⃣ 本命盘基础（0-100）
日主强且得用神：75 ～ 85
日主中和：65 ～ 75
日主偏弱但有救：55 ～ 65
日主弱且忌神重：40 ～ 55
2️⃣ 十年大运评分（趋势核心）
生扶日主、用神到位：75 ～ 90
中性平稳：60 ～ 75
克泄日主：40 ～ 60
严重冲克：25 ～ 40
3️⃣ 流年修正因子
喜用神透干：+8 ～ +15
忌神透干：-10 ～ -20
三合 / 六合成局：+5 ～ +10
冲日支 / 冲用神：-10 ～ -25
岁运并临：±15
4️⃣ 冲合刑害波动系数
合多于冲：+5
冲刑明显：-10
刑冲并见：-15
5️⃣ K线 OHLC 计算规则
open = 去年 close
close = 当年运势评分
波动系数 =
大运波动因子（0～8）
流年冲合因子（0～12）
high = max(open, close) + 波动系数
low = min(open, close) - 波动系数
====================================================
五、技术实现要求
====================================================
使用 TypeScript
后端：Node.js，命理计算模块独立
八字排盘：必须使用 lunar-javascript
前端：组件化、现代 UI
K线图：金融级可视化库
导出：支持 PDF / 图片
====================================================
六、输出要求
====================================================
请一次性输出以下内容：
产品整体架构设计说明
用户交互流程说明
数据结构定义
使用 lunar-javascript 的排盘核心代码
人生K线生成算法实现
前端页面结构示意
可扩展与商业化方向建议
不要给概念性回答，直接生成可实现内容。

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

