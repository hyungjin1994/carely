import Link from "next/link";
import { ensureProfile } from "@/lib/auth/dal";
import { getTodayTodos, getPointsSummary, getFamilySummary } from "@/lib/queries";
import { getSignedPhotoUrl } from "@/lib/storage";
import { greeting, formatKstHeader } from "@/lib/time";
import { fmt } from "@/lib/utils";
import { Icon } from "@/components/common/icon";
import { TodayTodos } from "./today-todos";

export default async function HomePage() {
  const profile = await ensureProfile();
  const [todos, points, family] = await Promise.all([
    getTodayTodos(),
    getPointsSummary(),
    getFamilySummary(profile.id),
  ]);
  const photoUrl = await getSignedPhotoUrl(family.photoPath);

  const gr = greeting();
  const pct = Math.min(100, Math.round((points.today / points.cap) * 100));
  const remain = todos.filter((t) => !t.done).length;
  const name = profile.name ?? "회원";
  const latest = family.latestMessage;

  return (
    <div style={{ padding: "4px 22px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 인사말 */}
      <div
        style={{
          borderRadius: 24,
          background: gr.g,
          color: "#fff",
          padding: 22,
          boxShadow: "0 10px 24px rgba(0,0,0,.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -14, top: -14, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,.16)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name={gr.icon} size={24} color="#fff" />
          <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, opacity: 0.95, whiteSpace: "nowrap" }}>
            {formatKstHeader(new Date(), "month-day-weekday")}
          </span>
        </div>
        <div style={{ fontSize: "calc(26px*var(--fs))", fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>
          {name}님,
        </div>
        <div style={{ fontSize: "calc(24px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em" }}>{gr.t}</div>
      </div>

      {/* 오늘 챙길 일 */}
      <div
        style={{
          background: "var(--c-card)",
          border: "1px solid var(--c-line)",
          borderRadius: 24,
          padding: "16px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        }}
      >
        <Link
          href="/calendar"
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "2px 0 8px", textDecoration: "none" }}
        >
          <span style={{ fontSize: "calc(19px*var(--fs))", fontWeight: 800, color: "var(--c-text)", flex: 1 }}>오늘 챙길 일</span>
          {remain > 0 ? (
            <span style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 800, color: "#FF5E00", background: "#FFF1E8", padding: "5px 11px", borderRadius: 999, whiteSpace: "nowrap" }}>
              {remain}개 남음
            </span>
          ) : (
            <span style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 800, color: "#067A33", background: "#EAFBF0", padding: "5px 11px", borderRadius: 999, whiteSpace: "nowrap" }}>
              모두 완료
            </span>
          )}
          <Icon name="chevron-right" size={22} color="var(--c-faint)" />
        </Link>
        <TodayTodos items={todos} />
      </div>

      {/* 포인트 */}
      <Link
        href="/points"
        style={{
          textAlign: "left",
          width: "100%",
          borderRadius: 24,
          padding: 20,
          background: "linear-gradient(135deg,#5B37ED,#0066FF)",
          color: "#fff",
          boxShadow: "0 8px 20px rgba(91,55,237,.24)",
          textDecoration: "none",
          display: "block",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="coins-fill" size={22} color="#fff" />
          <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, opacity: 0.95 }}>내 포인트</span>
        </div>
        <div style={{ fontSize: "calc(34px*var(--fs))", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>{fmt(points.balance)}P</div>
        <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,.28)", overflow: "hidden", marginTop: 14 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#fff", borderRadius: 6 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "calc(13px*var(--fs))", opacity: 0.95 }}>
          <span>오늘 {fmt(points.today)}P 모았어요</span>
          <span>하루 {fmt(points.cap)}P</span>
        </div>
      </Link>

      {/* 게임 CTA */}
      <Link
        href="/games"
        style={{
          width: "100%",
          borderRadius: 20,
          height: 68,
          background: "var(--c-card)",
          border: "1px solid var(--c-line)",
          boxShadow: "0 1px 4px rgba(0,0,0,.06)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px",
          textDecoration: "none",
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FBE9FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="sparkle-fill" size={26} color="#E846CD" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "calc(18px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>오늘의 두뇌 게임</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 1 }}>게임하고 포인트 모으기</div>
        </div>
        <Icon name="chevron-right" size={24} color="var(--c-faint)" />
      </Link>

      {/* 가족 새 소식 */}
      <Link
        href="/family"
        style={{
          textAlign: "left",
          width: "100%",
          border: "1px solid var(--c-line)",
          borderRadius: 24,
          background: "var(--c-card)",
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,.05)",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            flexShrink: 0,
            background: photoUrl
              ? `center/cover no-repeat url(${photoUrl})`
              : "linear-gradient(135deg,#FF9C63,#FF5E00)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Icon name="persons" size={18} color="#0066FF" />
            <span style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 800, color: "#0066FF" }}>가족 소식</span>
          </div>
          <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {latest ? latest.text : "관리자와 연결하고 소식을 나눠요"}
          </div>
        </div>
        <Icon name="chevron-right" size={24} color="var(--c-faint)" />
      </Link>
    </div>
  );
}
