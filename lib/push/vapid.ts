import "server-only";

// VAPID 설정. 키 생성: `node scripts/vapid-keys.mjs` (파일로 떨어진다)
//
// 필요한 환경변수는 둘이다.
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY   87자, 'B' 로 시작. 브라우저 구독용 + 발송용
//   VAPID_PRIVATE_KEY              43자. 서버 발송용
//
// `VAPID_PUBLIC_KEY` 를 따로 두고 있었는데, 같은 값을 두 변수에 복사해야 하는
// 구조라서 한쪽만 채우면 **구독은 되는데 발송만 조용히 안 되는** 상태가 됐다.
// 이제 NEXT_PUBLIC_ 쪽을 폴백으로 읽는다. 공개 키는 어차피 브라우저에 내려가는
// 값이라 서버에서 읽어도 잃을 게 없다.

/** 공개 키는 base64url 87자 → 언압축 P-256 점 65바이트. 개인 키는 43자. */
const PUBLIC_KEY_LENGTH = 87;
const PRIVATE_KEY_LENGTH = 43;

export function getVapidConfig() {
  // 환경변수를 붙여넣을 때 앞뒤 공백·개행이 섞이는 일이 흔하다. 서명이 깨진다.
  const clean = (v: string | undefined) => v?.trim().replace(/\s/g, "") || undefined;

  const publicKey = clean(process.env.VAPID_PUBLIC_KEY) ?? clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = clean(process.env.VAPID_PRIVATE_KEY);
  const subject = clean(process.env.VAPID_SUBJECT) ?? "mailto:noreply@carely.app";
  if (!publicKey || !privateKey) return null;

  // 길이가 틀리면 web-push 가 발송 시점에 터진다. 그 예외는 알림 한 건에 묻혀
  // 사라지므로 여기서 한 줄 남긴다 — 서버 로그에서 바로 보인다.
  if (publicKey.length !== PUBLIC_KEY_LENGTH || privateKey.length !== PRIVATE_KEY_LENGTH) {
    console.warn(
      `[vapid] 키 길이가 이상하다 — 공개 ${publicKey.length}자(${PUBLIC_KEY_LENGTH} 기대) · ` +
        `개인 ${privateKey.length}자(${PRIVATE_KEY_LENGTH} 기대). 두 키를 바꿔 넣지 않았는지 확인.`,
    );
    return null;
  }

  return { publicKey, privateKey, subject };
}
