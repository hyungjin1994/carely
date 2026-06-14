import "server-only";

// VAPID 설정은 env 에서. 키 생성: `npx web-push generate-vapid-keys`
// 공개키는 브라우저 구독용으로 NEXT_PUBLIC_VAPID_PUBLIC_KEY 에도 복사.

export function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@carely.app";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isPushConfigured() {
  return getVapidConfig() !== null;
}
