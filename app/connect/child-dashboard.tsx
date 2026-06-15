"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/common/icon";
import { fmt } from "@/lib/utils";
import { showToast } from "@/components/common/toast";
import { roleLabel } from "@/lib/roles";
import { MEASURE_KINDS, measureStatus } from "@/lib/measurements";
import type { Role, MeasurementKind } from "@/lib/database.types";
import type { SeniorSummary, MeasureLatest } from "@/lib/queries";
import { completeExchange, rejectExchange, sendMessage, redeemConnectCode } from "./actions";
import { logout } from "@/app/(auth)/actions";

type Pending = { id: string; amount: number };
type Feed = { id: string; text: string; mine: boolean };

export type SeniorView = {
  linkId: string;
  seniorId: string;
  name: string;
  role: Role;
  summary: SeniorSummary;
  measurements: Partial<Record<MeasurementKind, MeasureLatest>>;
  pending: Pending[];
  photoUrl: string | null;
  photoCaption: string | null;
  feed: Feed[];
};

export function ManagerDashboard({ seniors }: { seniors: SeniorView[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--c-screen)" }}>
      <div style={{ padding: "12px 22px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, fontSize: "calc(24px*var(--fs))", fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.02em" }}>
          가족 건강
        </div>
        <form action={logout}>
          <button type="submit" aria-label="로그아웃" style={{ border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 12, padding: "8px 12px", fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-sub)" }}>
            로그아웃
          </button>
        </form>
      </div>

      <div style={{ padding: "0 22px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        {seniors.map((s) => (
          <SeniorCard key={s.linkId} senior={s} />
        ))}
        <AddSenior />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ flex: 1, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: "calc(12px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "calc(20px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: "calc(11px*var(--fs))", color: "var(--c-faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SeniorCard({ senior: s }: { senior: SeniorView }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const act = (fn: () => Promise<{ error?: string }>, okMsg?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) showToast(res.error);
      else {
        if (okMsg) showToast(okMsg);
        router.refresh();
      }
    });

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    setMsg("");
    act(() => sendMessage(s.linkId, text), "소식을 보냈어요");
  };

  const { summary } = s;

  return (
    <div style={{ border: "1px solid var(--c-line)", borderRadius: 22, background: "var(--c-card)", padding: 16 }}>
      {/* 이름 + 관계 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "calc(20px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{s.name}</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "#00A63E", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00A63E" }} />
            {roleLabel(s.role)} · 연결됨
          </div>
        </div>
      </div>

      {/* 오늘 활동 요약 */}
      <div style={{ display: "flex", gap: 8 }}>
        <StatBox label="오늘 포인트" value={`${fmt(summary.today)}P`} sub={`잔액 ${fmt(summary.balance)}P`} />
        <StatBox label="복약" value={`${summary.meds.taken}/${summary.meds.total}`} sub="오늘 먹은 약" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <StatBox label="일정" value={`${summary.events.done}/${summary.events.total}`} sub="오늘 완료" />
        <StatBox label="게임" value={`${summary.games.plays}판`} sub={`${fmt(summary.games.points)}P`} />
      </div>

      <Link
        href={`/connect/${s.seniorId}/calendar`}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, height: 46, borderRadius: 14, border: "1px solid var(--c-line)", background: "var(--c-screen)", color: "var(--c-text)", fontSize: "calc(14px*var(--fs))", fontWeight: 800, textDecoration: "none" }}
      >
        <Icon name="calendar" size={20} color="var(--c-sub)" />
        일정 관리
      </Link>

      {/* 측정 최신값 */}
      {MEASURE_KINDS.some((m) => s.measurements[m.kind]) && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 800, color: "var(--c-sub)", marginBottom: 8 }}>측정</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {MEASURE_KINDS.filter((m) => s.measurements[m.kind]).map((m) => {
              const l = s.measurements[m.kind]!;
              const st = measureStatus(m.kind, l.v1, l.v2);
              return (
                <div key={m.kind} style={{ border: "1px solid var(--c-line)", borderRadius: 14, padding: "10px 12px", background: "var(--c-screen)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "calc(12px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>{m.label}</span>
                    {st && <span style={{ fontSize: "calc(11px*var(--fs))", fontWeight: 800, color: st.color }}>{st.label}</span>}
                  </div>
                  <div style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: st ? st.color : m.color, marginTop: 2 }}>{m.format(l.v1, l.v2, l.v3)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 환전 승인 요청 */}
      {s.pending.map((e) => (
        <div key={e.id} style={{ borderRadius: 18, background: "linear-gradient(135deg,#5B37ED,#0066FF)", color: "#fff", padding: 16, marginTop: 14, boxShadow: "0 8px 20px rgba(91,55,237,.24)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="coins-fill" size={20} color="#fff" />
            <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, opacity: 0.95 }}>환전 요청</span>
          </div>
          <div style={{ fontSize: "calc(30px*var(--fs))", fontWeight: 800, margin: "8px 0 4px" }}>{fmt(e.amount)}원</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", opacity: 0.9 }}>입금을 마치면 [교환 완료]를 눌러요. 포인트가 차감돼요.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => act(() => completeExchange(e.id), "교환을 완료했어요")} disabled={isPending} style={{ flex: 1, border: "none", borderRadius: 14, height: 52, background: "#fff", color: "#0066FF", fontSize: "calc(16px*var(--fs))", fontWeight: 800 }}>
              교환 완료
            </button>
            <button onClick={() => act(() => rejectExchange(e.id), "거절했어요")} disabled={isPending} style={{ border: "1px solid rgba(255,255,255,.5)", borderRadius: 14, height: 52, background: "transparent", color: "#fff", fontSize: "calc(16px*var(--fs))", fontWeight: 800, padding: "0 20px" }}>
              거절
            </button>
          </div>
        </div>
      ))}

      {/* 최근 사진 */}
      {s.photoUrl && (
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--c-line)", marginTop: 14 }}>
          <div style={{ height: 150, background: `center/cover no-repeat url(${s.photoUrl})` }} />
          {s.photoCaption && (
            <div style={{ padding: "10px 14px", fontSize: "calc(14px*var(--fs))", fontWeight: 700, color: "var(--c-text)" }}>{s.photoCaption}</div>
          )}
        </div>
      )}

      {/* 소식 */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={`${s.name}님께 한마디...`}
          style={{ flex: 1, border: "2px solid var(--c-line)", borderRadius: 14, padding: "0 16px", height: 50, fontSize: "calc(15px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
        />
        <button onClick={send} disabled={isPending} aria-label="보내기" style={{ border: "none", background: "#0066FF", borderRadius: 14, width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="send" size={22} color="#fff" />
        </button>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {s.feed.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: f.mine ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", background: f.mine ? "#0066FF" : "var(--c-screen)", color: f.mine ? "#fff" : "var(--c-text)", border: f.mine ? "none" : "1px solid var(--c-line)", borderRadius: 14, padding: "9px 13px", fontSize: "calc(14px*var(--fs))", lineHeight: 1.4 }}>
              {f.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddSenior() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const connect = () => {
    startTransition(async () => {
      const res = await redeemConnectCode(code);
      if (res.error) showToast(res.error);
      else {
        setCode("");
        setOpen(false);
        showToast("어르신과 연결됐어요");
        router.refresh();
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ border: "1px dashed #9EC5FF", background: "var(--c-card)", borderRadius: 18, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#0066FF", fontSize: "calc(15px*var(--fs))", fontWeight: 800 }}
      >
        <Icon name="persons" size={20} color="#0066FF" />
        어르신 추가
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid var(--c-line)", borderRadius: 18, background: "var(--c-card)", padding: 16 }}>
      <div style={{ fontSize: "calc(14px*var(--fs))", color: "var(--c-sub)", fontWeight: 700, marginBottom: 10 }}>
        어르신 앱 [가족]의 연결 코드를 입력하세요
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="코드 4자리"
          maxLength={8}
          style={{ flex: 1, border: "2px solid var(--c-line)", borderRadius: 14, padding: "0 16px", height: 52, fontSize: "calc(18px*var(--fs))", fontWeight: 800, letterSpacing: "0.15em", textAlign: "center", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
        />
        <button onClick={connect} disabled={pending} style={{ border: "none", background: "#0066FF", borderRadius: 14, padding: "0 18px", height: 52, color: "#fff", fontSize: "calc(15px*var(--fs))", fontWeight: 800, flexShrink: 0 }}>
          연결
        </button>
      </div>
    </div>
  );
}
