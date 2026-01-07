import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getShare } from "../lib/api";
import KLineChart from "../components/KLineChart";

export default function Share() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getShare(id)
      .then(setData)
      .catch((e) => setErr(e?.message ?? String(e)));
  }, [id]);

  if (err) {
    return (
      <div className="card">
        <div className="error">{err}</div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => nav("/")}>返回首页</button>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="card">加载中…</div>;
  }

  const { paipan, kline } = data;
  const input = paipan.input;
  const daYunSplits = paipan.daYun
    .filter((d: any) => d.startAge >= 1 && d.startAge <= 100)
    .map((d: any) => ({ age: d.startAge, label: d.ganZhi }));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{input.name}的人生K线（只读分享）</h2>
        <div style={{ opacity: 0.85, fontSize: 13 }}>来源：分享链接 ｜ 结果只读</div>
      </div>
      <div className="card">
        <KLineChart data={kline.years} daYunSplits={daYunSplits} />
      </div>
    </div>
  );
}

