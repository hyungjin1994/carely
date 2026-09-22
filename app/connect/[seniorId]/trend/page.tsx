import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getCognitiveTrend } from "@/lib/trend/queries";
import {
  HISTORY_WEEKS,
  MIN_PLAYS_PER_WINDOW,
  TREND_WINDOW_WEEKS,
  trendSummary,
  type GameTrend,
} from "@/lib/trend/cognitive";
import { MAX_LEVEL } from "@/lib/games/levels";
import { SubHeader } from "@/components/common/sub-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";

// 인증·사용자별 데이터 + 권한 검사 — 항상 동적.
export const dynamic = "force-dynamic";

/**
 * 인지 추이 — **자녀만** 본다.
 *
 * /connect 아래에 두는 것이 안전장치다. 어머니 화면은 (app) 레이아웃이
 * requireSenior() 로 잠겨 있고, 이 경로는 관리자용 레이아웃이라 어머니가
 * 주소를 직접 쳐도 아래 family_links 확인에서 /connect 로 튕긴다.
 *
 * 자기 인지 기능이 떨어지는 그래프는 해롭다. 그래서 어머니 쪽 어디에도 링크를
 * 걸지 않았다.
 */
export default async function SeniorTrendPage({
  params,
}: {
  params: Promise<{ seniorId: string }>;
}) {
  const { seniorId } = await params;
  const profile = await ensureProfile();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("family_links")
    .select("id")
    .eq("manager_id", profile.id)
    .eq("senior_id", seniorId)
    .eq("status", "active")
    .maybeSingle();
  if (!link) redirect("/connect");

  const [{ data: senior }, trends] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", seniorId).maybeSingle(),
    getCognitiveTrend(seniorId),
  ]);

  const seniorName = senior?.name ?? "어르신";
  const summary = trendSummary(trends);

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title={`${seniorName} 게임 추이`} href="/connect" />

      {/* 요약 — 여기만 읽어도 할 일이 정해져야 한다 */}
      <Card
        style={{
          background: summary.tone === "watch" ? "#FFF6E9" : "var(--c-card)",
          border: summary.tone === "watch" ? "1px solid #FFE0B2" : undefined,
        }}
      >
        <div style={{ padding: "18px 20px", display: "flex", gap: 10 }}>
          <Icon
            name={summary.tone === "watch" ? "bell-fill" : "circle-info"}
            size={22}
            color={summary.tone === "watch" ? "#FF9200" : "var(--c-faint)"}
            style={{ marginTop: 2 }}
          />
          <div
            style={{
              flex: 1,
              fontSize: "calc(15px*var(--fs))",
              fontWeight: 700,
              color: summary.tone === "watch" ? "#9C5800" : "var(--c-sub)",
              lineHeight: 1.6,
            }}
          >
            {summary.text}
          </div>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {trends.map((t) => (
          <TrendCard key={t.gameId} trend={t} />
        ))}
      </div>

      {/* 어떻게 읽어야 하는지. 이 설명이 없으면 그래프가 성적표로 읽힌다. */}
      <div
        style={{
          marginTop: 20,
          padding: "16px 18px",
          borderRadius: 18,
          background: "var(--c-screen)",
          fontSize: "calc(13px*var(--fs))",
          color: "var(--c-sub)",
          lineHeight: 1.7,
        }}
      >
        <div style={{ fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>
          읽는 법
        </div>
        · 카드 짝맞추기 · 색깔 · 계산 · 순서 기억은 <b>단계</b>를 봅니다. 이 네 종목은
        성공률이 60~85%에 머물도록 단계가 따라 움직이기 때문에, 정답률은 실력이 늘어도
        줄어도 그대로입니다.
        <br />· 상식 퀴즈 · 단어 맞추기는 단계가 없어 <b>정답률</b>을 봅니다.
        <br />· 최근 {TREND_WINDOW_WEEKS}주와 그 앞 {TREND_WINDOW_WEEKS}주를 비교합니다. 각
        창에 {MIN_PLAYS_PER_WINDOW}판이 안 되면 판단하지 않습니다 — 하루 컨디션에 한 판
        결과가 크게 흔들립니다.
        <br />· <b>한 종목만 내려간 것은 신호로 보지 않습니다.</b> 그 게임이
        재미없어지신 것으로도 설명됩니다. 두 종목 이상이 같이 움직일 때만 여쭤보세요.
        <br />· 잠을 못 자거나 몸이 안 좋을 때도 똑같이 내려갑니다. 진단이 아닙니다.
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: GameTrend }) {
  const max = trend.leveled ? MAX_LEVEL : 1;
  const label = trend.verdict === "down" ? "눈여겨볼 것" : null;

  return (
    <Card>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: trend.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              flex: 1,
              fontSize: "calc(16px*var(--fs))",
              fontWeight: 800,
              color: "var(--c-text)",
            }}
          >
            {trend.gameName}
          </span>
          <span
            style={{
              fontSize: "calc(12px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-faint)",
            }}
          >
            {trend.leveled ? "단계" : "정답률"}
          </span>
          {label && (
            <span
              style={{
                fontSize: "calc(12px*var(--fs))",
                fontWeight: 800,
                background: "#FF9200",
                color: "#fff",
                padding: "3px 9px",
                borderRadius: 999,
              }}
            >
              {label}
            </span>
          )}
        </div>

        {/* 주별 막대. 판이 없는 주는 빈 칸으로 남겨 끊긴 게 보이게 한다. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 56,
            marginTop: 14,
          }}
          role="img"
          aria-label={`최근 ${HISTORY_WEEKS}주 추이. ${trend.note}`}
        >
          {trend.weeks.map((w, i) => {
            // 최근 4주는 진하게 — 비교의 기준이 어디인지 눈에 보여야 한다.
            const isRecent = i >= HISTORY_WEEKS - TREND_WINDOW_WEEKS;
            const ratio = w.value === null ? 0 : Math.min(1, w.value / max);
            return (
              <div
                key={w.weekStart}
                title={`${w.weekStart} · ${w.plays}판`}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  background: "var(--c-screen)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    // 값이 있으면 최소 3px 는 보이게. 1단계가 0 과 구분돼야 한다.
                    height: w.value === null ? 0 : `max(3px, ${ratio * 100}%)`,
                    background: trend.color,
                    opacity: isRecent ? 1 : 0.32,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontSize: "calc(14px*var(--fs))",
            fontWeight: 700,
            color: trend.verdict === "down" ? "#9C5800" : "var(--c-sub)",
            lineHeight: 1.55,
            marginTop: 12,
          }}
        >
          {trend.note}
        </div>
        <div
          style={{
            fontSize: "calc(12px*var(--fs))",
            color: "var(--c-faint)",
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          최근 {TREND_WINDOW_WEEKS}주 {trend.plays.recent}판 · 그 앞 {TREND_WINDOW_WEEKS}주{" "}
          {trend.plays.previous}판
        </div>
      </div>
    </Card>
  );
}
