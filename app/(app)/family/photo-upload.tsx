"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { uploadPhoto } from "./actions";

/** 업로드 전 사진을 줄이고 JPEG 로 변환 — 용량↓, 아이폰 HEIC 도 어디서나 보이게. 실패 시 원본 반환. */
async function downscale(file: File, max = 1600, quality = 0.82): Promise<File> {
  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("decode"));
      im.src = dataUrl;
    });
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > max || h > max) {
      const s = Math.min(max / w, max / h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoUpload({ reward = true }: { reward?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    setFile(fl);
    setCaption("");
    setPreview(URL.createObjectURL(fl));
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
  };

  const submit = () => {
    if (!file) return;
    startTransition(async () => {
      const compact = await downscale(file);
      const fd = new FormData();
      fd.set("file", compact);
      fd.set("caption", caption.trim() || "새로 올린 사진");
      const res = await uploadPhoto(fd);
      if (res.error) showToast(res.error);
      else {
        showToast(reward ? "사진을 올렸어요 +5P" : "사진을 올렸어요");
        close();
        router.refresh();
      }
    });
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 18,
          height: 64,
          background: "linear-gradient(135deg,#0098B2,#0066FF)",
          color: "#fff",
          fontSize: "calc(18px*var(--fs))",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 8px 20px rgba(0,102,255,.2)",
        }}
      >
        <Icon name="upload" size={24} color="#fff" />
        {reward ? "사진 올리기 (+5P)" : "사진 올리기"}
      </button>

      <BottomSheet open={file !== null} onClose={close} title="사진 올리기">
        {preview && (
          <div style={{ height: 220, borderRadius: 16, background: `center/cover no-repeat url(${preview})`, marginBottom: 14, border: "1px solid var(--c-line)" }} />
        )}
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="한 줄 설명 (예: 손주랑 나들이)"
          style={{ width: "100%", border: "2px solid var(--c-line)", borderRadius: 14, padding: "0 16px", height: 56, fontSize: "calc(16px*var(--fs))", outline: "none", fontFamily: "inherit", background: "var(--c-card)", color: "var(--c-text)", boxSizing: "border-box" }}
        />
        <button
          onClick={submit}
          disabled={pending}
          style={{ marginTop: 14, width: "100%", border: "none", borderRadius: 16, height: 58, background: "var(--c-primary)", color: "#fff", fontSize: "calc(18px*var(--fs))", fontWeight: 800, opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "올리는 중..." : "올리기"}
        </button>
      </BottomSheet>
    </>
  );
}
