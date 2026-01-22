import type { KLineResult, PaipanResult } from "@life-coordinates/core";
import { useState } from "react";
import PillarTable from "../components/PillarTable";
import { postJson } from "../lib/api";
import { formatDateYmd, formatTimeLabel, genderLabel } from "../lib/format";
import type { SessionState } from "../lib/storage";
import { saveSession } from "../lib/storage";

function IconChevronRight() {
  return (
    <svg className="luxIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Step2Page({ session, onSession, go }: { session: SessionState; onSession: (next: SessionState) => void; go: (path: string) => void }) {
  const paipan = session.paipan;
  const input = session.input;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!paipan || !input) {
    return (
      <main className="luxMain">
        <section className="luxSection">
          <div className="luxContainer">
            <div className="luxPanel">
              <div className="luxPanelTitle">未找到排盘数据</div>
              <div className="luxPanelLead">请先完成 Step 1 输入并生成命盘。</div>
              <button type="button" className="luxBtn luxBtnInkSolid" onClick={() => go("#/kline")}>
                返回输入
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const onCompute = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ paipan: PaipanResult; kline: KLineResult }>("/api/compute", input);
      const next: SessionState = { input, paipan: res.paipan, kline: res.kline };
      saveSession(next);
      onSession(next);
      go("#/result");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "计算失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="luxMain">
      <section className="luxSection" aria-label="Confirm">
        <div className="luxContainer">
          <div className="luxSectionHeader luxSectionHeaderRow">
            <div>
              <div className="luxSectionKicker">STEP 2</div>
              <h2 className="luxH2">基础八字排盘确认</h2>
              <p className="luxP">请核对四柱与修正信息无误后，再生成百年人生K线。</p>
            </div>
            <div className="luxStepTrail" aria-label="Trail">
              <span className="luxStepTrailItem">输入</span>
              <IconChevronRight />
              <span className="luxStepTrailItem luxStepTrailItemOn">确认</span>
              <IconChevronRight />
              <span className="luxStepTrailItem">结果</span>
            </div>
          </div>

          {error ? (
            <div className="luxAlert" role="alert">
              {error}
            </div>
          ) : null}

          <div className="luxConfirmStack">
            <div className="luxConfirmHero luxGradientA" aria-label="Case header">
              <div className="luxConfirmHeroTop">
                <div>
                  <div className="luxConfirmHeroKicker">CASE PROFILE</div>
                  <div className="luxConfirmHeroTitle">
                    {input.name || "命主"}
                    <span className="luxConfirmHeroGender"> 性别 {genderLabel(input.gender)}</span>
                  </div>
                  <div className="luxConfirmHeroSub">基础八字排盘确认</div>
                </div>
              </div>
              <div className="luxConfirmMetaGrid">
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">阴历</div>
                  <div className="luxConfirmMetaValue">
                    {formatDateYmd(input.date)} {formatTimeLabel(input.time)}
                  </div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">阳历</div>
                  <div className="luxConfirmMetaValue">{paipan.solar.ymdHms}</div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">出生地</div>
                  <div className="luxConfirmMetaValue">
                    {input.location.province} {input.location.city} (经度 {input.location.longitude})
                  </div>
                </div>
                <div className="luxConfirmMetaItem">
                  <div className="luxConfirmMetaLabel">真太阳时修正后时间</div>
                  <div className="luxConfirmMetaValue">
                    {paipan.solar.correctedYmdHms} (经度差 {paipan.solar.longitudeDeltaMinutes}分钟)
                  </div>
                </div>
              </div>
            </div>

            <div className="luxCardGrid">
              <div className="luxCard luxCardBlock luxCardSpan luxCardHero luxGradientB">
                <div className="luxCardTitle">八字排盘信息</div>
                <PillarTable paipan={paipan} />
              </div>

              <div className="luxCardGrid luxCardGridSplit">
                <div className="luxCard luxCardBlock luxCardHero luxGradientC">
                  <div className="luxCardTitle">整体判断</div>
                  <div className="luxMetaList">
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">日主五行</div>
                      <div className="luxMetaVal">{paipan.fourPillars.dayMaster.element}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">日主强弱</div>
                      <div className="luxMetaVal">{paipan.overall.dayMasterStrength}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">喜用神(五行)</div>
                      <div className="luxMetaVal">{paipan.overall.favorableElements.join("、")}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">忌神(五行)</div>
                      <div className="luxMetaVal">{paipan.overall.unfavorableElements.join("、")}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">起运年龄</div>
                      <div className="luxMetaVal">{paipan.overall.startLuckAge}</div>
                    </div>
                    <div className="luxMetaRow">
                      <div className="luxMetaKey">顺逆</div>
                      <div className="luxMetaVal">{paipan.overall.luckDirection}</div>
                    </div>
                  </div>
                </div>

                <div className="luxCard luxCardBlock luxCardHero luxGradientD">
                  <div className="luxCardTitle">操作</div>
                  <div className="luxActions luxActionsStack">
                    <button type="button" className="luxBtn luxBtnInkOutline" onClick={() => go("#/kline")}
                    >
                      返回修改信息
                    </button>
                    <button type="button" className="luxBtn luxBtnInkSolid" onClick={onCompute} disabled={busy}>
                      {busy ? "生成中..." : "确认无误，生成人生K线"}
                    </button>
                  </div>
                  <div className="luxHint">提示：生成后可导出K线图片，并创建只读分享链接。</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
