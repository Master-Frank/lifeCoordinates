import { Route, Routes, Navigate, Link, useLocation } from "react-router-dom";
import Step1 from "./pages/Step1";
import Step2 from "./pages/Step2";
import Step3 from "./pages/Step3";
import Share from "./pages/Share";

export default function App() {
  const loc = useLocation();
  const isMainFlow = loc.pathname === "/" || loc.pathname === "/confirm" || loc.pathname === "/result";
  const steps = [
    { key: "step1", label: "Step 1 · 输入信息", path: "/" },
    { key: "step2", label: "Step 2 · 确认排盘", path: "/confirm" },
    { key: "step3", label: "Step 3 · 人生K线", path: "/result" }
  ];
  const current = loc.pathname === "/" ? "step1" : loc.pathname === "/confirm" ? "step2" : loc.pathname === "/result" ? "step3" : null;
  return (
    <div className="container">
      <div className="no-print app-header">
        <div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <strong>人生坐标 · Life Coordinates</strong>
          </Link>
          <span style={{ marginLeft: 12, opacity: 0.7, fontSize: 13 }}>{loc.pathname}</span>
        </div>
        <a href="https://6tail.cn/calendar/api.html" target="_blank" rel="noreferrer" style={{ opacity: 0.75, fontSize: 13 }}>
          lunar-javascript 文档
        </a>
      </div>
      {isMainFlow ? (
        <div className="no-print steps">
          {steps.map((s, index) => {
            const active = s.key === current;
            return (
              <div key={s.key} className={active ? "step-item step-item-active" : "step-item"}>
                <div className="step-circle">{index + 1}</div>
                <div>{s.label}</div>
              </div>
            );
          })}
        </div>
      ) : null}
      <Routes>
        <Route path="/" element={<Step1 />} />
        <Route path="/confirm" element={<Step2 />} />
        <Route path="/result" element={<Step3 />} />
        <Route path="/share/:id" element={<Share />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
