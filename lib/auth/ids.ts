// ID 기반 로그인. Supabase Auth 는 이메일을 식별자로 쓰므로,
// 시니어 친화 위해 받은 "아이디"를 합성 이메일(<id>@carely.app)로 매핑한다.
// 실제 메일 발송은 하지 않으므로(이메일 확인 OFF 필수) 도메인은 자리표시자.

export const ID_EMAIL_DOMAIN = "carely.app";

/** 아이디 규칙: 영문/숫자/._- 3~20자. */
export const ID_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

/** 로그인 아이디 → Supabase 내부 이메일 (소문자 정규화). */
export function idToEmail(loginId: string): string {
  return `${loginId.trim().toLowerCase()}@${ID_EMAIL_DOMAIN}`;
}

/** 내부 이메일 → 표시용 아이디 (@ 앞부분). */
export function emailToId(email: string | null | undefined): string {
  return (email ?? "").split("@")[0];
}
