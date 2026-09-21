import { formatKstIsoDate } from "@/lib/time";

/**
 * 오늘의 한 가지 — 매일 권하는 작은 건강 행동.
 *
 * 왜 이게 필요한가: 인지 건강은 게임보다 생활 습관의 영향이 크다. 운동·수면·
 * 사회적 교류는 효과가 비교적 잘 확인된 축인데 앱에 그 축이 없었다.
 * 게임 6종은 인지 자극만 다루고, 가족 회상 질문은 일화기억만 다룬다.
 *
 * 설계 원칙
 * · 하루에 하나만 권한다. 여러 개를 주면 목록이 되고, 목록은 부담이 된다.
 * · "왜" 를 한 줄 붙인다. 이유를 알면 앱을 안 볼 때도 하게 된다.
 * · 곧바로 할 수 있는 것만 넣는다. "운동하기" 는 막연하고 "앉았다 일어나기
 *   10번" 은 지금 할 수 있다.
 * · 실패할 수 없게 쓴다. 못 해도 그만인 권유이고, 점수를 깎지 않는다.
 *
 * 문구를 고쳐도 기록(daily_habits.habit_id)은 유지되므로 id 는 바꾸지 말 것.
 */

export type Habit = {
  id: string;
  title: string;
  /** 왜 좋은지 한 줄. 없으면 문구만 보여준다. */
  why?: string;
};

export type HabitCategory = {
  key: string;
  label: string;
  color: string;
  icon: string;
  items: Habit[];
};

export const HABIT_CATEGORIES: HabitCategory[] = [
  {
    key: "move",
    label: "움직이기",
    color: "#FF9200",
    icon: "fire-fill",
    items: [
      { id: "mv01", title: "점심 드시고 20분 걸어보기", why: "식후 걷기는 혈당을 낮춰줘요" },
      { id: "mv02", title: "앉았다 일어나기 10번", why: "다리 힘이 넘어지는 걸 막아줘요" },
      { id: "mv03", title: "아침에 기지개 크게 켜기", why: "밤새 굳은 몸을 풀어줘요" },
      { id: "mv04", title: "벽 짚고 발끝 들기 20번", why: "종아리 힘을 길러줘요" },
      { id: "mv05", title: "한 발로 10초 서 있기", why: "균형 감각을 지켜줘요. 잡을 것 옆에 두고 하세요" },
      { id: "mv06", title: "목과 어깨 천천히 돌리기" },
      { id: "mv07", title: "저녁 드시고 집 앞 한 바퀴" },
      { id: "mv08", title: "계단 한 층 걸어 올라가기", why: "엘리베이터 대신 한 층만요" },
    ],
  },
  {
    key: "food",
    label: "물과 식사",
    color: "#00A63E",
    icon: "heart-fill",
    items: [
      { id: "fd01", title: "지금 물 한 잔 마시기", why: "나이가 들면 갈증을 덜 느껴요" },
      { id: "fd02", title: "오늘은 물 여섯 잔 마셔보기" },
      { id: "fd03", title: "아침 꼭 챙겨 드시기", why: "아침을 거르면 하루 기운이 떨어져요" },
      { id: "fd04", title: "반찬에 채소 한 가지 더", why: "색이 진한 채소가 특히 좋아요" },
      { id: "fd05", title: "등 푸른 생선 드셔보기", why: "고등어·삼치에 뇌에 좋은 지방이 많아요" },
      { id: "fd06", title: "견과류 한 줌 드시기", why: "호두·아몬드 한 줌이면 충분해요" },
      { id: "fd07", title: "국물은 조금 남기기", why: "소금을 줄이면 혈압에 좋아요" },
      { id: "fd08", title: "간식 대신 과일 드시기" },
    ],
  },
  {
    key: "people",
    label: "사람 만나기",
    color: "#E846CD",
    icon: "persons",
    items: [
      { id: "pp01", title: "오랜 친구에게 전화 한 통", why: "사람과 이야기하는 게 뇌에 제일 좋아요" },
      { id: "pp02", title: "가족에게 사진 한 장 보내기" },
      { id: "pp03", title: "이웃과 한마디 나누기" },
      { id: "pp04", title: "가족에게 소식 한 줄 남기기" },
      { id: "pp05", title: "오늘 만난 사람 이름 떠올려보기", why: "얼굴과 이름을 잇는 연습이에요" },
      { id: "pp06", title: "고맙다는 말 한 번 해보기" },
    ],
  },
  {
    key: "mind",
    label: "머리 쓰기",
    color: "#5B37ED",
    icon: "sparkle-fill",
    items: [
      { id: "md01", title: "어제 저녁에 뭐 드셨는지 떠올려보기", why: "가까운 기억을 되짚는 연습이에요" },
      { id: "md02", title: "오늘 날짜와 요일 말해보기" },
      { id: "md03", title: "신문이나 책 한 쪽 읽기" },
      { id: "md04", title: "좋아하는 노래 한 곡 부르기", why: "노래는 기억과 기분을 같이 건드려요" },
      { id: "md05", title: "장 볼 것을 안 보고 외워보기" },
      { id: "md06", title: "어릴 적 친구 이름 세 명 떠올려보기" },
      { id: "md07", title: "오늘 하루를 세 줄로 정리해보기" },
      { id: "md08", title: "라디오 들으며 가사 따라 해보기" },
    ],
  },
  {
    key: "rest",
    label: "잠과 쉼",
    color: "#0098B2",
    icon: "moon",
    items: [
      { id: "rs01", title: "오늘은 11시 전에 자리에 눕기", why: "잠이 부족하면 기억이 잘 안 남아요" },
      { id: "rs02", title: "낮잠은 30분만", why: "길게 자면 밤잠을 방해해요" },
      { id: "rs03", title: "아침 햇볕 10분 쬐기", why: "밤에 잠이 잘 와요" },
      { id: "rs04", title: "자기 전 휴대폰 멀리 두기" },
      { id: "rs05", title: "깊게 숨 다섯 번 쉬기" },
      { id: "rs06", title: "따뜻한 물로 발 담그기" },
    ],
  },
  {
    key: "care",
    label: "몸 살피기",
    color: "#0066FF",
    icon: "bell-fill",
    items: [
      { id: "cr01", title: "약 챙겨 드셨는지 확인하기" },
      { id: "cr02", title: "혈압 재보기" },
      { id: "cr03", title: "몸무게 재보기" },
      { id: "cr04", title: "다니는 길에 걸릴 것 없는지 보기", why: "넘어지는 사고는 대부분 집에서 나요" },
      { id: "cr05", title: "안경 닦기", why: "잘 보이면 덜 넘어져요" },
      { id: "cr06", title: "병원 예약 있는지 확인하기" },
    ],
  },
];

export const HABIT_POINTS = 30;

/** KST 기준 1970-01-01 부터의 일수. 같은 날이면 항상 같은 값. */
function kstDayIndex(now: Date = new Date()): number {
  return Math.floor(Date.parse(`${formatKstIsoDate(now)}T00:00:00Z`) / 86_400_000);
}

export type TodayHabit = { habit: Habit; category: HabitCategory };

/**
 * 오늘의 행동. 무작위가 아니라 날짜로 결정한다 — 새로고침해도 같아야 한다.
 *
 * 카테고리를 날마다 돌리고, 그 안에서 순서대로 진행한다.
 * 그냥 한 배열에 담아 나머지 연산으로 고르면 같은 카테고리가 며칠씩 연달아
 * 나온다(배열이 카테고리별로 묶여 있으므로).
 */
export function todayHabit(now: Date = new Date()): TodayHabit {
  const day = kstDayIndex(now);
  const category = HABIT_CATEGORIES[day % HABIT_CATEGORIES.length];
  const cycle = Math.floor(day / HABIT_CATEGORIES.length);
  const habit = category.items[cycle % category.items.length];
  return { habit, category };
}

/** 전체 행동 수 — 한 바퀴 도는 데 걸리는 날짜 계산용. */
export function habitCount(): number {
  return HABIT_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
}
