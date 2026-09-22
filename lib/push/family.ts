import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser, type PushPayload } from "@/lib/push/send";

/**
 * 연결된 자녀 전원에게 지금 바로 푸시를 보낸다.
 *
 * 크론을 거치지 않는 이유: Vercel 무료 플랜은 크론이 하루 1회라(vercel.json 의
 * `0 23 * * *`) 예약 발송에 맡기면 최대 13시간 늦는다. 환전 신청·주간 리포트처럼
 * 사건 발생 시점에 보내면 되는 알림은 크론이 필요 없고, 이렇게 하면 무료로
 * 즉시 도착한다. 크론은 약·일정처럼 미래 시각에 울려야 하는 것에만 쓴다.
 *
 * VAPID 키가 없거나 구독이 없으면 sendPushToUser 가 0 을 돌려주고 조용히 끝난다.
 * 앱 내 알림 배너는 그대로 뜨므로 푸시 미설정 상태에서도 기능이 죽지 않는다.
 *
 * admin 클라이언트를 쓰는 이유: 어머니 세션으로는 자녀의 push_subscriptions 를
 * 읽을 수 없다(RLS). 대상은 호출자와 active 로 연결된 manager 로만 한정한다.
 */
export async function pushToManagers(seniorId: string, payload: PushPayload): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data: links } = await admin
      .from("family_links")
      .select("manager_id")
      .eq("senior_id", seniorId)
      .eq("status", "active");
    const counts = await Promise.all(
      (links ?? []).map((l) => sendPushToUser(admin, l.manager_id, payload)),
    );
    return counts.reduce((a, b) => a + b, 0);
  } catch {
    // 서비스 키 미설정 등 — 알림 배너로 대체되므로 조용히 넘어간다.
    return 0;
  }
}
