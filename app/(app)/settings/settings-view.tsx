"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/common/sub-header";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { applyThemeNow } from "@/components/common/theme-root";
import { FONT_SCALES } from "@/lib/theme";
import { updateProfile } from "./actions";
import { logout } from "@/app/(auth)/actions";
import { subscribePush } from "@/lib/push/subscribe-client";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{ width: 56, height: 32, borderRadius: 18, border: "none", background: on ? "#0066FF" : "var(--c-line)", position: "relative", flexShrink: 0, transition: "background .2s" }}
    >
      <div style={{ position: "absolute", top: 3, left: on ? 27 : 3, width: 26, height: 26, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
    </button>
  );
}

const rowCard: React.CSSProperties = {
  background: "var(--c-card)",
  border: "1px solid var(--c-line)",
  borderRadius: 18,
  padding: 18,
};

export function SettingsView({
  name,
  fontScale,
  highContrast,
  notifyOn,
}: {
  name: string;
  fontScale: number;
  highContrast: boolean;
  notifyOn: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [fs, setFs] = useState(fontScale);
  const [hc, setHc] = useState(highContrast);
  const [notify, setNotify] = useState(notifyOn);

  const save = (patch: Parameters<typeof updateProfile>[0]) =>
    startTransition(async () => {
      await updateProfile(patch);
      router.refresh();
    });

  const saveName = () => {
    const n = editName.trim();
    if (n) save({ name: n });
    setEditing(false);
    showToast("이름을 바꿨어요");
  };

  const setFont = (v: number) => {
    setFs(v);
    applyThemeNow(v, hc);
    save({ font_scale: v });
  };
  const toggleHc = () => {
    const next = !hc;
    setHc(next);
    applyThemeNow(fs, next);
    save({ high_contrast: next });
  };
  const toggleNotify = () => {
    const next = !notify;
    setNotify(next);
    save({ notify_on: next });
    if (next) {
      subscribePush().then((res) => {
        if (!res.ok) showToast(res.reason ?? "알림을 켤 수 없어요");
      });
    }
  };

  return (
    <div style={{ padding: "4px 22px 32px" }}>
      <SubHeader title="설정" href="/home" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 이름 */}
        <div style={rowCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#5B37ED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="person-fill" size={28} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", fontWeight: 600 }}>내 이름</div>
              {!editing && <div style={{ fontSize: "calc(20px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{name || "이름 없음"}</div>}
            </div>
            {!editing && (
              <button onClick={() => { setEditName(name); setEditing(true); }} style={{ border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 12, padding: "10px 14px", fontSize: "calc(14px*var(--fs))", fontWeight: 700, color: "var(--c-sub)", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="pencil" size={18} color="var(--c-sub)" />
                수정
              </button>
            )}
          </div>
          {editing && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ flex: 1, border: "2px solid #0066FF", borderRadius: 12, padding: "0 14px", height: 54, fontSize: "calc(17px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }} />
              <button onClick={saveName} style={{ border: "none", background: "#0066FF", color: "#fff", borderRadius: 12, padding: "0 18px", fontSize: "calc(15px*var(--fs))", fontWeight: 800 }}>저장</button>
            </div>
          )}
        </div>

        {/* 글자 크기 */}
        <div style={rowCard}>
          <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>글자 크기</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginBottom: 14 }}>모든 화면에 바로 적용돼요</div>
          <div style={{ display: "flex", gap: 8 }}>
            {FONT_SCALES.map((f) => {
              const on = fs === f.v;
              return (
                <button key={f.v} onClick={() => setFont(f.v)} style={{ flex: 1, padding: "14px 4px", borderRadius: 14, border: "2px solid " + (on ? "#0066FF" : "var(--c-line)"), background: on ? "#EAF2FE" : "var(--c-card)", color: on ? "#0066FF" : "var(--c-text)", fontWeight: 800, fontSize: "calc(14px*var(--fs))" }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 고대비 */}
        <div style={rowCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#F2ECFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="moon" size={24} color="#5B37ED" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>고대비 모드</div>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>더 또렷하게 보여요</div>
            </div>
            <Toggle on={hc} onClick={toggleHc} />
          </div>
        </div>

        {/* 알림 */}
        <div style={rowCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF6E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={24} color="#FF9200" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>알림 켜기</div>
              <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>약·일정 시간에 알려드려요</div>
            </div>
            <Toggle on={notify} onClick={toggleNotify} />
          </div>
          {notify && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--c-line)", fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)" }}>
              <Icon name="clock" size={18} color="var(--c-faint)" />
              방해 금지: 밤 9시 ~ 아침 8시는 조용히
            </div>
          )}
        </div>

        {/* 건강·생활 정보 */}
        <Link href="/onboarding" style={{ ...rowCard, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EAF2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="person-fill" size={24} color="#0066FF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>건강·생활 정보</div>
            <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>생년월일·루틴·응급 연락처</div>
          </div>
          <Icon name="chevron-right" size={24} color="var(--c-faint)" />
        </Link>

        {/* 약 관리 */}
        <Link href="/meds" style={{ ...rowCard, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EAFBF0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="pill" size={24} color="#00A63E" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>약 관리</div>
            <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>복용 약 등록·삭제</div>
          </div>
          <Icon name="chevron-right" size={24} color="var(--c-faint)" />
        </Link>

        {/* 로그아웃 */}
        <form action={logout}>
          <button type="submit" style={{ marginTop: 6, width: "100%", border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 16, height: 58, color: "#E52222", fontSize: "calc(16px*var(--fs))", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="logout" size={22} color="#E52222" />
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
