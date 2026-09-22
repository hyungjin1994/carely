/**
 * VAPID 키 한 쌍을 만들어 파일로 쓴다.
 *
 *   node scripts/vapid-keys.mjs
 *   → vapid-keys.txt (gitignore 됨)
 *
 * 왜 화면에 안 찍나: 개인 키는 이 앱 구독자에게 푸시를 보낼 수 있는 자격이다.
 * 터미널에 찍으면 로그·스크롤버퍼·중간 프록시에 남는다. 파일로 쓰고 옮긴 뒤
 * 지우는 게 싸다.
 *
 * 두 키는 **한 쌍이라 같이 바꿔야 한다.** 새로 만들면 기존 구독은 전부 무효가
 * 되므로 사용자들이 알림을 다시 켜야 한다.
 */
import { writeFileSync } from "node:fs";
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

const out = `# Vercel → Settings → Environment Variables
# 두 개 다 Production/Preview/Development 에 넣고, 넣은 뒤 **재배포**해야 한다.
# NEXT_PUBLIC_ 은 빌드 시점에 번들에 박히므로 변수만 바꿔도 반영되지 않는다.
#
# 타입은 Config(평문)로. NEXT_PUBLIC_ 은 브라우저에 그대로 내려가는 값이라
# Secret 으로 둘 의미가 없고, 값을 다시 볼 수 없어서 진단만 어려워진다.

NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}

# 확인
#   공개 키 ${publicKey.length}자, '${publicKey[0]}' 로 시작   (65바이트 언압축 P-256 점)
#   개인 키 ${privateKey.length}자                              (32바이트 스칼라)
# 이 둘을 바꿔 넣는 것이 가장 흔한 실수다.
#
# 옮긴 뒤 이 파일은 지운다:  rm vapid-keys.txt
`;

writeFileSync("vapid-keys.txt", out, "utf8");
console.log(`vapid-keys.txt 에 썼다. 공개 ${publicKey.length}자 · 개인 ${privateKey.length}자`);
