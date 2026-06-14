"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { fmt } from "@/lib/utils";
import { showToast } from "@/components/common/toast";
import { approveExchange, rejectExchange, sendMessage } from "./actions";
import { logout } from "@/app/(auth)/actions";

type Pending = { id: string; amount: number; when: string };
type Feed = { id: string; text: string; mine: boolean };

export function ChildDashboard({
  momName,
  pending,
  photoUrl,
  photoCaption,
  feed,
}: {
  momName: string;
  myId: string;
  pending: Pending[];
  photoUrl: string | null;
  photoCaption: string | null;
  feed: Feed[];
}) {
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
    act(() => sendMessage(text), "어머니께 소식을 보냈어요");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--c-screen)" }}>
      <div style={{ padding: "12px 22px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "calc(24px*var(--fs))", fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.02em" }}>{momName}</div>
          <div style={{ fontSize: "calc(13px*var(--fs))", color: "#00A63E", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00A63E" }} />
            연결됨
          </div>
        </div>
        <form action={logout}>
          <button type="submit" aria-label="로그아웃" style={{ border: "1px solid var(--c-line)", background: "var(--c-card)", borderRadius: 12, padding: "8px 12px", fontSize: "calc(13px*var(--fs))", fontWeight: 700, color: "var(--c-sub)" }}>
            로그아웃
          </button>
        </form>
      </div>

      <div style={{ padding: "0 22px 28px" }}>
        {/* 환전 승인 요청 */}
        {pending.map((e) => (
          <div key={e.id} style={{ borderRadius: 20, background: "linear-gradient(135deg,#5B37ED,#0066FF)", color: "#fff", padding: 18, marginBottom: 16, boxShadow: "0 8px 20px rgba(91,55,237,.24)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="coins-fill" size={20} color="#fff" />
              <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 700, opacity: 0.95 }}>환전 승인 요청</span>
            </div>
            <div style={{ fontSize: "calc(32px*var(--fs))", fontWeight: 800, margin: "8px 0 4px" }}>{fmt(e.amount)}원</div>
            <div style={{ fontSize: "calc(13px*var(--fs))", opacity: 0.9 }}>어머니가 환전을 신청했어요</div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => act(() => approveExchange(e.id), "승인했어요")} disabled={isPending} style={{ flex: 1, border: "none", borderRadius: 14, height: 52, background: "#fff", color: "#0066FF", fontSize: "calc(16px*var(--fs))", fontWeight: 800 }}>
                승인
              </button>
              <button onClick={() => act(() => rejectExchange(e.id), "거절했어요")} disabled={isPending} style={{ border: "1px solid rgba(255,255,255,.5)", borderRadius: 14, height: 52, background: "transparent", color: "#fff", fontSize: "calc(16px*var(--fs))", fontWeight: 800, padding: "0 20px" }}>
                거절
              </button>
            </div>
          </div>
        ))}

        {/* 어머니 최근 사진 */}
        <div style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "4px 0 10px" }}>어머니 최근 사진</div>
        {photoUrl ? (
          <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--c-line)", marginBottom: 20 }}>
            <div style={{ height: 160, background: `center/cover no-repeat url(${photoUrl})` }} />
            <div style={{ padding: "12px 14px", background: "var(--c-card)" }}>
              <div style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: "var(--c-text)" }}>{photoCaption ?? "사진"}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(14px*var(--fs))", padding: "20px 0", marginBottom: 8 }}>아직 올라온 사진이 없어요</div>
        )}

        {/* 소식 보내기 */}
        <div style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "4px 0 10px" }}>소식 보내기</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="엄마에게 한마디..."
            style={{ flex: 1, border: "2px solid var(--c-line)", borderRadius: 14, padding: "0 16px", height: 54, fontSize: "calc(15px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
          />
          <button onClick={send} disabled={isPending} aria-label="보내기" style={{ border: "none", background: "#0066FF", borderRadius: 14, width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="send" size={24} color="#fff" />
          </button>
        </div>

        {feed.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: f.mine ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{ maxWidth: "82%", background: f.mine ? "#0066FF" : "var(--c-card)", color: f.mine ? "#fff" : "var(--c-text)", border: f.mine ? "none" : "1px solid var(--c-line)", borderRadius: 16, padding: "10px 14px", fontSize: "calc(14px*var(--fs))", lineHeight: 1.4 }}>
              {f.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
