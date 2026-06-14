import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPointsSummary } from "@/lib/queries";
import { GAMES } from "@/lib/games/config";
import { fmt } from "@/lib/utils";
import { formatKstHeader } from "@/lib/time";
import { SubHeader } from "@/components/common/sub-header";
import { Icon } from "@/components/common/icon";

const GAME_NAME: Record<string, string> = Object.fromEntries(GAMES.map((g) => [g.id, g.name]));

function reasonLabel(reason: string, gameId: string | null): string {
  if (reason === "photo") return "사진 올리기";
  if (gameId && GAME_NAME[gameId]) return GAME_NAME[gameId];
  return "게임";
}

export default async function PointsPage() {
  const supabase = await createClient();
  const [points, { data: ledger }] = await Promise.all([
    getPointsSummary(),
    supabase
      .from("point_ledger")
      .select("id, delta, reason, game_id, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const pct = Math.min(100, Math.round((points.today / points.cap) * 100));

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title="포인트" href="/home" />

      <div
        style={{
          borderRadius: 26,
          background: "linear-gradient(135deg,#5B37ED,#0066FF)",
          color: "#fff",
          padding: 24,
          boxShadow: "0 12px 28px rgba(91,55,237,.28)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="coins-fill" size={24} color="#fff" />
          <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 700, opacity: 0.95 }}>내 포인트</span>
        </div>
        <div style={{ fontSize: "calc(46px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 }}>{fmt(points.balance)}P</div>
        <div style={{ height: 12, borderRadius: 7, background: "rgba(255,255,255,.28)", overflow: "hidden", marginTop: 16 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#fff", borderRadius: 7 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: "calc(14px*var(--fs))", opacity: 0.96, fontWeight: 600 }}>
          <span>오늘 {fmt(points.today)}P</span>
          <span>하루 최대 {fmt(points.cap)}P</span>
        </div>
      </div>

      <Link
        href="/exchange"
        style={{
          marginTop: 16,
          width: "100%",
          borderRadius: 18,
          height: 64,
          background: "var(--c-primary)",
          color: "#fff",
          fontSize: "calc(18px*var(--fs))",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textDecoration: "none",
        }}
      >
        <Icon name="coins-fill" size={24} color="#fff" />
        환전 신청하기
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "14px 16px", background: "#FFF6E9", border: "1px solid #FFE6C6", borderRadius: 16, fontSize: "calc(14px*var(--fs))", color: "#9C5800", fontWeight: 600, lineHeight: 1.5 }}>
        <Icon name="circle-info" size={20} color="#D47800" />
        <span>게임하고 사진을 올리면 모여요. 자정(밤 12시)에 오늘 점수가 새로 시작돼요.</span>
      </div>

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>최근 적립</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(ledger ?? []).length === 0 && (
          <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "20px 0" }}>
            아직 적립 내역이 없어요
          </div>
        )}
        {(ledger ?? []).map((sc) => (
          <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "14px 16px" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EAF2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={sc.reason === "photo" ? "upload" : "sparkle-fill"} size={22} color="#0066FF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 700, color: "var(--c-text)" }}>{reasonLabel(sc.reason, sc.game_id)}</div>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>{formatKstHeader(new Date(sc.created_at), "month-day")}</div>
            </div>
            <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "#00A63E" }}>+{sc.delta}P</div>
          </div>
        ))}
      </div>
    </div>
  );
}
