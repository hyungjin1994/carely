import { requireSenior } from "@/lib/auth/dal";
import { getTodayRecall } from "@/lib/recall/queries";
import { formatKstHeader } from "@/lib/time";
import { SubHeader } from "@/components/common/sub-header";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/common/icon";
import { AnswerForm } from "./answer-form";

// 사용자별 데이터 — 항상 동적.
export const dynamic = "force-dynamic";

export default async function RecallPage() {
  const profile = await requireSenior();
  const recall = await getTodayRecall(profile.id);

  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <SubHeader title="오늘의 질문" href="/home" />

      {!recall ? (
        <Card>
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              fontSize: "calc(18px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
              lineHeight: 1.6,
            }}
          >
            아직 질문이 없어요.
            <br />
            가족이 질문을 보내면 여기에 보여드릴게요.
          </div>
        </Card>
      ) : (
        <>
          {/* 질문 */}
          <Card>
            <div style={{ padding: "28px 24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Icon name="heart-fill" size={22} color="#E846CD" />
                <span
                  style={{
                    fontSize: "calc(14px*var(--fs))",
                    fontWeight: 800,
                    color: "var(--c-sub)",
                  }}
                >
                  {formatKstHeader(new Date(), "month-day")}
                </span>
              </div>
              <div
                style={{
                  fontSize: "calc(25px*var(--fs))",
                  fontWeight: 800,
                  color: "var(--c-text)",
                  lineHeight: 1.5,
                  letterSpacing: "-0.01em",
                }}
              >
                {recall.question.prompt}
              </div>
            </div>
          </Card>

          {recall.todayAnswer ? (
            <AnsweredView
              text={recall.todayAnswer.text}
              replyText={recall.todayAnswer.reply_text}
            />
          ) : (
            <AnswerForm questionId={recall.question.id} />
          )}

          {/* 예전에 같은 질문에 답한 기록. 회상은 반복이 값이므로 숨기지 않는다. */}
          {recall.past.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <div
                style={{
                  fontSize: "calc(15px*var(--fs))",
                  fontWeight: 800,
                  color: "var(--c-sub)",
                  marginBottom: 10,
                }}
              >
                전에 해주신 이야기
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recall.past
                  .filter((a) => a.text)
                  .map((a) => (
                    <div
                      key={a.id}
                      style={{
                        border: "1px solid var(--c-line)",
                        borderRadius: 16,
                        padding: "14px 16px",
                        background: "var(--c-screen)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "calc(13px*var(--fs))",
                          color: "var(--c-faint)",
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        {formatKstHeader(new Date(a.answered_at), "month-day")}
                      </div>
                      <div
                        style={{
                          fontSize: "calc(17px*var(--fs))",
                          color: "var(--c-text)",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {a.text}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * 오늘 이미 답하신 뒤의 화면.
 * 점수도 정오 표시도 없다. 대신 "전달됐다"는 완결감과, 답장이 오면 그 답장을 보여준다.
 * 답하고 아무 반응이 없으면 어머니 입장에서 가장 허전하므로 문구로라도 채운다.
 */
function AnsweredView({ text, replyText }: { text: string | null; replyText: string | null }) {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      {text ? (
        <Card style={{ background: "var(--c-screen)" }}>
          <div style={{ padding: "20px 22px" }}>
            <div
              style={{
                fontSize: "calc(14px*var(--fs))",
                fontWeight: 800,
                color: "var(--c-sub)",
                marginBottom: 8,
              }}
            >
              오늘 해주신 이야기
            </div>
            <div
              style={{
                fontSize: "calc(19px*var(--fs))",
                color: "var(--c-text)",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {text}
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ background: "var(--c-screen)" }}>
          <div
            style={{
              padding: "24px 22px",
              textAlign: "center",
              fontSize: "calc(17px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
            }}
          >
            오늘은 건너뛰셨어요. 내일 또 여쭤볼게요.
          </div>
        </Card>
      )}

      {replyText ? (
        <div
          style={{
            border: "1px solid #CDE3FF",
            background: "#F2F8FF",
            borderRadius: 20,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Icon name="persons" size={20} color="#0066FF" />
            <span style={{ fontSize: "calc(14px*var(--fs))", fontWeight: 800, color: "#0066FF" }}>
              가족의 답장
            </span>
          </div>
          <div
            style={{
              fontSize: "calc(18px*var(--fs))",
              color: "#123A6B",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {replyText}
          </div>
        </div>
      ) : (
        text && (
          <div
            style={{
              textAlign: "center",
              fontSize: "calc(16px*var(--fs))",
              fontWeight: 700,
              color: "var(--c-sub)",
              padding: "6px 0",
            }}
          >
            가족이 읽고 답장을 보내줄 거예요.
          </div>
        )
      )}
    </div>
  );
}
