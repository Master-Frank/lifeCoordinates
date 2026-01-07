export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";

export type BirthDateInput = {
  year: number;
  month: number;
  day: number;
  isLeapMonth?: boolean;
};

export type BirthTimeInput =
  | {
      mode: "exact";
      hour: number;
      minute: number;
    }
  | {
      mode: "segment";
      label:
        | "子时"
        | "丑时"
        | "寅时"
        | "卯时"
        | "辰时"
        | "巳时"
        | "午时"
        | "未时"
        | "申时"
        | "酉时"
        | "戌时"
        | "亥时"
        | "上午"
        | "下午";
    };

export type BirthLocationInput = {
  province: string;
  city: string;
  longitude: number;
};

export type BirthInput = {
  name: string;
  gender: Gender;
  calendar: CalendarType;
  date: BirthDateInput;
  time: BirthTimeInput;
  location: BirthLocationInput;
};

export type PillarKey = "year" | "month" | "day" | "hour";

export type PillarDetail = {
  pillar: PillarKey;
  gan: string;
  zhi: string;
  ganTenGod: string;
  zhiTenGod: string;
  hiddenStems: string[];
  hiddenStemTenGods: string[];
  starLuck: string;
  selfSeat: string;
  kongWang: string;
  naYin: string;
  shenSha: string[];
};

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
    dayMaster: {
      gan: string;
      element: "木" | "火" | "土" | "金" | "水";
    };
  };
  overall: {
    dayMasterStrength: "强" | "中" | "弱";
    favorableElements: ("木" | "火" | "土" | "金" | "水")[];
    unfavorableElements: ("木" | "火" | "土" | "金" | "水")[];
    startLuckAge: number;
    luckDirection: "顺" | "逆";
  };
  daYun: {
    startYear: number;
    endYear: number;
    startAge: number;
    endAge: number;
    ganZhi: string;
  }[];
};

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
  daYunStages: {
    startAge: number;
    endAge: number;
    ganZhi: string;
    score: number;
    summary: string;
    advice: string;
    risks: string[];
  }[];
  insight: {
    overallTrend: "前高" | "中高" | "后高" | "波动";
    peaks: { age: number; year: number; score: number; ganZhi: string }[];
    troughs: { age: number; year: number; score: number; ganZhi: string }[];
    tenGodFocus: string[];
    totalScore: number;
    summary: string;
  };
};

