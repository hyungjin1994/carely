import type { CSSProperties } from "react";

/**
 * 공용 스타일 조각.
 *
 * 이 앱은 시안(Carely.dc.html)을 그대로 옮기느라 Tailwind 유틸리티 대신 인라인
 * `style` 을 쓴다. 그 결과 같은 카드·입력 스타일이 파일마다 복붙돼 있어서
 * (카드 배경 56곳, 입력 테두리 17곳) 모양 하나 바꾸려면 수십 곳을 고쳐야 했다.
 *
 * 컴포넌트로 감싸지 않고 **스타일 객체**로 두는 이유: 기존 코드가 전부 인라인
 * `style` 이라 그대로 펼쳐 쓸 수 있고, 한 곳만 점진적으로 바꿔도 깨지지 않는다.
 *
 *     <div style={{ ...cardStyle, padding: 20 }}>
 *     <input style={inputStyle} />
 *
 * 새로 쓰는 화면은 여기 것을 쓰고, 기존 화면은 만질 때 같이 옮기면 된다.
 *
 * 크기는 전부 `calc(Npx*var(--fs))` 로 쓴다 — 글자배율(×1.0/1.18/1.4)을 따라야
 * 하기 때문이다. 색은 `--c-*` CSS 변수를 쓴다(고대비 모드에서 값이 바뀐다).
 */

/** 시안 card(): 흰 배경, 1px 라인, radius 24, 옅은 그림자. */
export const cardStyle: CSSProperties = {
  background: "var(--c-card)",
  border: "1px solid var(--c-line)",
  borderRadius: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,.05)",
};

/** 설정·목록처럼 촘촘한 화면용. 그림자 없이 radius 를 줄인 카드. */
export const rowCardStyle: CSSProperties = {
  background: "var(--c-card)",
  border: "1px solid var(--c-line)",
  borderRadius: 18,
  padding: 18,
};

/** 한 줄 입력. 시니어 터치 영역을 위해 높이 58px 을 유지한다. */
export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "2px solid var(--c-line)",
  borderRadius: 14,
  padding: "0 16px",
  height: 58,
  fontSize: "calc(18px*var(--fs))",
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  outline: "none",
};

/** 여러 줄 입력. height 대신 rows 로 크기를 정한다. */
export const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "2px solid var(--c-line)",
  borderRadius: 18,
  padding: "16px 18px",
  fontSize: "calc(19px*var(--fs))",
  lineHeight: 1.6,
  fontFamily: "inherit",
  background: "var(--c-card)",
  color: "var(--c-text)",
  outline: "none",
  resize: "none",
};

/**
 * 주 버튼. 색을 넘기지 않으면 앱 기본색을 쓴다.
 * disabled 일 때는 회색으로 — 누를 수 없다는 게 보여야 한다.
 */
export function primaryButtonStyle(color?: string, disabled?: boolean): CSSProperties {
  return {
    width: "100%",
    height: 62,
    border: "none",
    borderRadius: 18,
    background: disabled ? "var(--c-line)" : (color ?? "var(--c-primary)"),
    color: disabled ? "var(--c-faint)" : "#fff",
    fontSize: "calc(18px*var(--fs))",
    fontWeight: 800,
  };
}

/** 보조 버튼 (테두리만). */
export const outlineButtonStyle: CSSProperties = {
  width: "100%",
  height: 58,
  border: "1px solid var(--c-line)",
  borderRadius: 18,
  background: "var(--c-card)",
  color: "var(--c-text)",
  fontSize: "calc(17px*var(--fs))",
  fontWeight: 800,
};
