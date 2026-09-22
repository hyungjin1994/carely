"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";
import { primaryButtonStyle } from "@/components/ui/styles";
import { confirmWeekly } from "./actions";
import type { WeeklyReport } from "@/lib/weekly/queries";

/**
 * 주간 리포트 시트 — 어머니용.
 *
 * 왜 자동으로 띄우나: 목적이 지속 동기라서 안 보면 존재 의미가 없다.
 * 홈에 카드로만 두면 이미 카드가 여러 개라 묻힌다.
 *
 * 왜 window.alert 이나 일반 모달이 아닌가: alert 은 글자배율(--fs)·고대비를
 * 무시하고, 작은 X 버튼 모달은 고령자가 닫는 법을 못 찾으면 앱이 멈춘 것처럼
 * 느낀다. 앱에 이미 쓰는 BottomSheet 에 큰 닫기 버튼을 달았다.
 *
 * 주 1회만 뜬다 — weekly_report_seen(user_id, week_start)로 막는다(0022).
 *
 * **나쁜 소식은 넣지 않는다.** "약을 놓치셨어요" 같은 건 report.concerns 에
 * 담겨 자녀에게만 간다. 매주 지적을 받으면 앱을 피하게 된다.
 */
export function WeeklySheet({ report, name }: { report: WeeklyReport; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    startTransition(async () => {
      await confirmWeekly();
      router.refresh();
    });
  };

  const gameDiff = report.games.plays - report.games.prevPlays;
  const habitDiff = report.habits.days - report.habits.prevDays;

  return (
    <BottomSheet open={open} onClose={close} title={`${name}님, 이번 주 잘하셨어요`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Row label="게임" value={`${report.games.plays}판`} diff={gameDiff} unit="판" />
        <Row label="오늘의 한 가지" value={`${report.habits.days}일`} diff={habitDiff} unit="일" />
        {report.meds.total > 0 && (
          <Row label="약" value={`${report.meds.taken} / ${report.meds.total}회`} />
        )}
        {report.measures > 0 && <Row label="혈압·혈당" value={`${report.measures}번 재셨어요`} />}
        {report.answers > 0 && <Row label="옛날 이야기" value={`${report.answers}개 들려주셨어요`} />}
      </div>

      {report.levelUps.length > 0 && (
        <div
          style={{
            marginTop: 16,
            background: "linear-gradient(135deg,#00A63E,#42A800)",
            color: "#fff",
            borderRadius: 18,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Icon name="trophy" size={20} color="#fff" />
            <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 800, opacity: 0.95 }}>
              단계가 올랐어요
            </span>
          </div>
          {report.levelUps.slice(0, 3).map((l) => (
            <div
              key={l.gameId}
              style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800, lineHeight: 1.5 }}
            >
              {l.gameName} {l.from}단계 → {l.to}단계
            </div>
          ))}
        </div>
      )}

      <button onClick={close} disabled={isPending} style={{ ...primaryButtonStyle(), marginTop: 20 }}>
        확인했어요
      </button>
    </BottomSheet>
  );
}

/** 지난주와 비교해 늘었으면 초록으로 표시한다. 줄었을 때는 표시하지 않는다. */
function Row({
  label,
  value,
  diff,
  unit,
}: {
  label: string;
  value: string;
  diff?: number;
  unit?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 0",
        borderBottom: "1px solid var(--c-line)",
      }}
    >
      <span style={{ flex: 1, fontSize: "calc(16px*var(--fs))", color: "var(--c-sub)", fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: "calc(20px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>
        {value}
      </span>
      {diff !== undefined && diff > 0 && (
        <span
          style={{
            fontSize: "calc(13px*var(--fs))",
            fontWeight: 800,
            color: "#067A33",
            background: "#EAFBF0",
            padding: "4px 9px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          지난주보다 {diff}{unit} 더
        </span>
      )}
    </div>
  );
}
