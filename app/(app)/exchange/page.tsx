import { createClient } from "@/lib/supabase/server";
import { getBalance } from "@/lib/queries";
import { fmt } from "@/lib/utils";
import { formatKstHeader } from "@/lib/time";
import { SubHeader } from "@/components/common/sub-header";
import { Icon } from "@/components/common/icon";
import { ExchangeForm } from "./exchange-form";
import type { ExchangeStatus } from "@/lib/database.types";

const STATUS_LABEL: Record<ExchangeStatus, { label: string; c: string; b: string }> = {
  pending: { label: "대기", c: "#D47800", b: "#FEF4E6" },
  approved: { label: "완료", c: "#00A63E", b: "#EAFBF0" },
  done: { label: "완료", c: "#00A63E", b: "#EAFBF0" },
  rejected: { label: "거절", c: "#E52222", b: "#FEECEC" },
};

export default async function ExchangePage() {
  const supabase = await createClient();
  const [balance, { data: requests }] = await Promise.all([
    getBalance(),
    supabase
      .from("exchange_requests")
      .select("id, amount, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title="환전 신청" href="/points" />
      <div style={{ fontSize: "calc(15px*var(--fs))", color: "var(--c-sub)", marginBottom: 14 }}>
        보유 {fmt(balance)}P · 1P = 1원
      </div>

      <ExchangeForm />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "14px 16px", background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", lineHeight: 1.5 }}>
        <Icon name="circle-info" size={20} color="var(--c-faint)" />
        <span>신청하면 자녀에게 알림이 가요. 자녀가 승인하면 실제 송금은 가족이 해드려요.</span>
      </div>

      <div style={{ fontSize: "calc(16px*var(--fs))", fontWeight: 800, color: "var(--c-text)", margin: "24px 0 12px" }}>신청 내역</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(requests ?? []).length === 0 && (
          <div style={{ textAlign: "center", color: "var(--c-faint)", fontSize: "calc(15px*var(--fs))", padding: "20px 0" }}>
            아직 신청 내역이 없어요
          </div>
        )}
        {(requests ?? []).map((e) => {
          const st = STATUS_LABEL[e.status as ExchangeStatus] ?? STATUS_LABEL.pending;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--c-card)", border: "1px solid var(--c-line)", borderRadius: 16, padding: "14px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "calc(17px*var(--fs))", fontWeight: 800, color: "var(--c-text)" }}>{fmt(e.amount)}P</div>
                <div style={{ fontSize: "calc(13px*var(--fs))", color: "var(--c-sub)", marginTop: 2 }}>{formatKstHeader(new Date(e.created_at), "month-day")}</div>
              </div>
              <span style={{ fontSize: "calc(13px*var(--fs))", fontWeight: 800, color: st.c, background: st.b, padding: "6px 12px", borderRadius: 10 }}>{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
