"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomSheet } from "@/components/common/bottom-sheet";
import { Icon } from "@/components/common/icon";

// ── Web Speech API 최소 타입 (표준 lib 에 없어 직접 선언) ──
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  0: SRAlternative;
  isFinal: boolean;
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [i: number]: SRResult };
}
interface SRInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SRCtor = new () => SRInstance;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const naverSearch = (q: string) => `https://map.naver.com/p/search/${encodeURIComponent(q.trim())}`;

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--c-line)",
  borderRadius: 14,
  padding: "0 16px",
  height: 58,
  fontSize: "calc(18px*var(--fs))",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  boxSizing: "border-box",
};

export function RouteFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recRef = useRef<SRInstance | null>(null);
  const supported = getSR() !== null;

  if (pathname?.includes("/play")) return null;

  const startVoice = () => {
    const Ctor = getSR();
    if (!Ctor) return;
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setText("");
    setListening(true);
    rec.start();
  };

  const stopVoice = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const go = () => {
    const q = text.trim();
    if (!q) return;
    window.open(naverSearch(q), "_blank", "noopener,noreferrer");
    setText("");
    setOpen(false);
  };

  const close = () => {
    stopVoice();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="가는 길 찾기"
        style={{
          position: "absolute",
          right: 18,
          bottom: "calc(80px + env(safe-area-inset-bottom))",
          width: 62,
          height: 62,
          borderRadius: "50%",
          background: "#03C75A",
          color: "#fff",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          boxShadow: "0 8px 20px rgba(3,199,90,.42)",
          zIndex: 40,
        }}
      >
        <Icon name="location" size={24} color="#fff" />
        <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>가는길</span>
      </button>

      <BottomSheet open={open} onClose={close} title="어디로 갈까요?">
        {supported && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <button
              onClick={listening ? stopVoice : startVoice}
              aria-label={listening ? "그만 듣기" : "말하기"}
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "none",
                background: listening ? "#E52222" : "#03C75A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: listening ? "0 0 0 8px rgba(229,34,34,.18)" : "0 10px 24px rgba(3,199,90,.32)",
                transition: "background .2s, box-shadow .2s",
              }}
            >
              <Icon name="mic" size={46} color="#fff" />
            </button>
            <div style={{ fontSize: "calc(15px*var(--fs))", color: listening ? "#E52222" : "var(--c-sub)", fontWeight: 800, textAlign: "center" }}>
              {listening ? "듣고 있어요… 말씀하세요" : "버튼을 누르고 가고 싶은 곳을 말하세요"}
            </div>
          </div>
        )}

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={supported ? "또는 직접 입력 (예: 서울대병원)" : "가고 싶은 곳 (예: 서울대병원)"}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <button
          onClick={go}
          disabled={!text.trim()}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 16,
            height: 60,
            background: "#03C75A",
            color: "#fff",
            fontSize: "calc(18px*var(--fs))",
            fontWeight: 800,
            opacity: text.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="location" size={22} color="#fff" />
          이 곳으로 길찾기
        </button>

        {!supported && (
          <div style={{ marginTop: 12, fontSize: "calc(13px*var(--fs))", color: "var(--c-faint)", textAlign: "center", lineHeight: 1.5 }}>
            이 기기는 음성 입력이 안 돼요. 직접 입력해 주세요.
          </div>
        )}
      </BottomSheet>
    </>
  );
}
