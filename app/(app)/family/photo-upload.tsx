"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/icon";
import { showToast } from "@/components/common/toast";
import { uploadPhoto } from "./actions";

export function PhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [, setFileName] = useState("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("caption", "새로 올린 사진");
    startTransition(async () => {
      const res = await uploadPhoto(fd);
      if (res.error) showToast(res.error);
      else {
        showToast("사진을 올렸어요 +5P");
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={pending}
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
          opacity: pending ? 0.7 : 1,
        }}
      >
        <Icon name="upload" size={24} color="#fff" />
        {pending ? "올리는 중..." : "사진 올리기 (+5P)"}
      </button>
    </>
  );
}
