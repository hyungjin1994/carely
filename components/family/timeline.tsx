"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { formatKstHeader } from "@/lib/time";
import { toggleLike, addComment, deleteComment } from "@/app/(app)/family/actions";
import type { TimelinePost } from "@/lib/queries";

export function Timeline({ posts }: { posts: TimelinePost[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const like = (p: TimelinePost) =>
    startTransition(async () => {
      await toggleLike(p.id, p.likedByMe);
      router.refresh();
    });

  const comment = (id: string) => {
    const t = (drafts[id] ?? "").trim();
    if (!t) return;
    setDrafts((d) => ({ ...d, [id]: "" }));
    startTransition(async () => {
      const res = await addComment(id, t);
      if (res?.error) showToast(res.error);
      router.refresh();
    });
  };

  const removeComment = (cid: string) =>
    startTransition(async () => {
      await deleteComment(cid);
      router.refresh();
    });

  if (!posts.length) {
    return (
      <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "28px 0" }}>
        아직 올라온 사진이 없어요. 첫 사진을 올려보세요!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {posts.map((p) => (
        <div key={p.id} style={{ border: "1px solid var(--c-line)", borderRadius: 20, overflow: "hidden", background: "var(--c-card)" }}>
          {p.url && <div style={{ height: 240, background: `center/cover no-repeat url(${p.url})` }} />}
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{p.ownerName}</span>
              <span style={{ fontSize: "calc(12px*var(--fs))", color: "var(--c-faint)" }}>{formatKstHeader(new Date(p.createdAt), "month-day")}</span>
            </div>
            {p.caption && <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-text)", marginTop: 6, lineHeight: 1.4 }}>{p.caption}</div>}

            {/* 좋아요 / 댓글 수 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
              <button onClick={() => like(p)} aria-label="좋아요" style={{ border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
                <Icon name={p.likedByMe ? "heart-fill" : "heart"} size={24} color={p.likedByMe ? "#E52222" : "var(--c-sub)"} />
                <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 700, color: p.likedByMe ? "#E52222" : "var(--c-sub)" }}>{p.likeCount}</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--c-sub)" }}>
                <Icon name="bubble-fill" size={22} color="var(--c-sub)" />
                <span style={{ fontSize: "calc(15px*var(--fs))", fontWeight: 700 }}>{p.comments.length}</span>
              </div>
            </div>

            {/* 댓글 목록 */}
            {p.comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {p.comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "calc(14px*var(--fs))", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 800, color: "var(--c-text)", flexShrink: 0 }}>{c.name}</span>
                    <span style={{ color: "var(--c-text)", flex: 1 }}>{c.text}</span>
                    {c.mine && (
                      <button onClick={() => removeComment(c.id)} aria-label="댓글 삭제" style={{ border: "none", background: "transparent", padding: 0, flexShrink: 0 }}>
                        <Icon name="close" size={15} color="var(--c-faint)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={drafts[p.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                placeholder="댓글 달기..."
                style={{ flex: 1, border: "2px solid var(--c-line)", borderRadius: 12, padding: "0 14px", height: 46, fontSize: "calc(14px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-screen)", color: "var(--c-text)", boxSizing: "border-box" }}
              />
              <button onClick={() => comment(p.id)} aria-label="댓글 보내기" style={{ border: "none", background: "#0066FF", borderRadius: 12, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="send" size={20} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
