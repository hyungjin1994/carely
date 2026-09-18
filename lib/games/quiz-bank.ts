import "server-only";

import { shuffle } from "@/lib/games/engine";
import type { ChoiceGameId, ChoiceRound } from "@/lib/games/config";

// 퀴즈·단어 문제 은행 + 출제 로직. **서버 전용.**
//
// 클라이언트에서 import 하면 빌드가 깨진다(server-only). 의도한 것이다 —
// 은행 전체가 클라 번들에 실리면 은행을 키울 수 없고, 정답까지 통째로 내려간다.
// 클라에는 한 판 분량(12문제)만 Server Action 으로 내려간다.
//
// ── 퀴즈 문제 관리 방법 ──
// 퀴즈는 두 갈래로 관리한다. 둘 다 코드 상수(배열)이며 DB 아님.
//
// (1) 지식 테이블 — CAPITALS / SEASONAL / IDIOMS
//     "지식" 1건을 적으면 양방향 문제 2개가 파생된다.
//     (예: 프랑스/파리 → "프랑스의 수도는?" + "파리 — 어느 나라의 수도일까요?")
//     오답 선택지는 같은 카테고리 풀에서 매 판 새로 뽑으므로 보기 조합이 매번 달라진다.
//     → 문제를 늘리는 가장 싼 방법. 한 줄 추가 = 문제 2개.
//
// (2) QUIZ / WORDQ — 파생이 안 되는 단발 문항 (정답은 o 배열의 0-based 인덱스 a)
//     출제 시 보기를 셔플하므로 a 를 어디에 찍든 편향이 생기지 않는다.
//     (셔플 도입 전에는 101문항 중 43개가 a:0 에 몰려 "첫 보기 찍기"가 43% 정답이었다.)
//
// ── 식별자 두 개를 구분한다 ──
//   source : 한 판 안에서 같은 지식이 두 번 나오는 것을 막는 키 (양방향이 같은 source)
//   qid    : 사용자별 출제 이력(quiz_seen.qid) 의 키. 방향까지 구분한다.
//            "프랑스의 수도는?" 을 풀었다고 "파리 — 어느 나라?" 까지 푼 건 아니므로.
//            qid 를 바꾸면 그 문항의 이력이 리셋되니 한번 정하면 바꾸지 말 것.

/** 나라↔수도. region 은 오답을 같은 권역에서 뽑기 위한 것(4건 이상이면 권역, 미만이면 전체 풀). */
export type CapitalFact = { country: string; capital: string; region: "유럽" | "아시아" | "아메리카" | "기타" };

export const CAPITALS: CapitalFact[] = [
  { country: "프랑스", capital: "파리", region: "유럽" },
  { country: "영국", capital: "런던", region: "유럽" },
  { country: "이탈리아", capital: "로마", region: "유럽" },
  { country: "독일", capital: "베를린", region: "유럽" },
  { country: "러시아", capital: "모스크바", region: "유럽" },
  { country: "스페인", capital: "마드리드", region: "유럽" },
  { country: "그리스", capital: "아테네", region: "유럽" },
  { country: "네덜란드", capital: "암스테르담", region: "유럽" },
  { country: "스위스", capital: "베른", region: "유럽" },
  { country: "포르투갈", capital: "리스본", region: "유럽" },
  { country: "스웨덴", capital: "스톡홀름", region: "유럽" },
  { country: "대한민국", capital: "서울", region: "아시아" },
  { country: "일본", capital: "도쿄", region: "아시아" },
  { country: "중국", capital: "베이징", region: "아시아" },
  { country: "태국", capital: "방콕", region: "아시아" },
  { country: "베트남", capital: "하노이", region: "아시아" },
  { country: "필리핀", capital: "마닐라", region: "아시아" },
  { country: "인도", capital: "뉴델리", region: "아시아" },
  { country: "인도네시아", capital: "자카르타", region: "아시아" },
  { country: "몽골", capital: "울란바토르", region: "아시아" },
  { country: "미국", capital: "워싱턴 D.C.", region: "아메리카" },
  { country: "캐나다", capital: "오타와", region: "아메리카" },
  { country: "브라질", capital: "브라질리아", region: "아메리카" },
  { country: "멕시코", capital: "멕시코시티", region: "아메리카" },
  { country: "아르헨티나", capital: "부에노스아이레스", region: "아메리카" },
  { country: "이집트", capital: "카이로", region: "기타" },
  { country: "호주", capital: "캔버라", region: "기타" },
  { country: "뉴질랜드", capital: "웰링턴", region: "기타" },
  { country: "사우디아라비아", capital: "리야드", region: "기타" },
];

/** 명절·절기↔음식. */
export type SeasonalFact = { occasion: string; food: string };

export const SEASONAL: SeasonalFact[] = [
  { occasion: "추석", food: "송편" },
  { occasion: "설날", food: "떡국" },
  { occasion: "동짓날", food: "팥죽" },
  { occasion: "정월 대보름", food: "오곡밥" },
  { occasion: "복날", food: "삼계탕" },
  { occasion: "생일", food: "미역국" },
];

/** 한자성어↔뜻. */
export type IdiomFact = { idiom: string; meaning: string };

export const IDIOMS: IdiomFact[] = [
  { idiom: "유비무환", meaning: "미리 준비하면 걱정이 없다" },
  { idiom: "일석이조", meaning: "한 번에 두 가지 이득" },
  { idiom: "다다익선", meaning: "많을수록 좋다" },
  { idiom: "작심삼일", meaning: "마음먹은 지 사흘을 못 감" },
  { idiom: "금상첨화", meaning: "좋은 데 좋은 것이 더해짐" },
  { idiom: "자업자득", meaning: "자기가 한 일의 결과를 자기가 받음" },
  { idiom: "대기만성", meaning: "큰 그릇은 늦게 이루어진다" },
  { idiom: "유유상종", meaning: "비슷한 것끼리 어울린다" },
  { idiom: "고진감래", meaning: "고생 끝에 즐거움이 온다" },
  { idiom: "과유불급", meaning: "지나침은 모자람만 못하다" },
  { idiom: "청출어람", meaning: "제자가 스승보다 낫다" },
  { idiom: "새옹지마", meaning: "인생의 좋고 나쁨은 알 수 없다" },
  { idiom: "십중팔구", meaning: "열에 여덟아홉, 거의 대부분" },
  { idiom: "동고동락", meaning: "괴로움과 즐거움을 함께한다" },
  { idiom: "견물생심", meaning: "물건을 보면 갖고 싶어진다" },
  { idiom: "어부지리", meaning: "둘이 다투는 사이 딴 사람이 이득" },
  { idiom: "팔방미인", meaning: "여러 방면에 두루 능한 사람" },
  { idiom: "일사천리", meaning: "일이 거침없이 빠르게 진행됨" },
];

/** 단발 문항. id 는 출제 이력(quiz_seen.qid)의 키이므로 한번 정하면 바꾸지 않는다. */
export type QuizItem = { id: string; q: string; o: string[]; a: number };

export const QUIZ: QuizItem[] = [
  // ── 우리나라 상식·역사 ──
  { id: "kr01", q: "한글을 만드신 임금님은?", o: ["세종대왕", "태조", "정조", "광개토대왕"], a: 0 },
  { id: "kr02", q: "조선을 세운 첫 임금은?", o: ["이성계", "세종대왕", "광개토대왕", "이순신"], a: 0 },
  { id: "kr03", q: "거북선을 만든 장군은?", o: ["강감찬", "이순신", "을지문덕", "김유신"], a: 1 },
  { id: "kr04", q: "우리나라 국화(나라꽃)는?", o: ["진달래", "무궁화", "벚꽃", "목련"], a: 1 },
  { id: "kr05", q: "우리나라에서 가장 큰 섬은?", o: ["울릉도", "제주도", "강화도", "거제도"], a: 1 },
  { id: "kr06", q: "우리나라 화폐 단위는?", o: ["엔", "원", "위안", "달러"], a: 1 },
  { id: "kr07", q: "태극기에 없는 색은?", o: ["빨강", "파랑", "검정", "초록"], a: 3 },
  { id: "kr08", q: '애국가 "동해물과 ◯◯산이"의 빈칸은?', o: ["한라", "백두", "설악", "지리"], a: 1 },
  { id: "kr09", q: "한글날은 몇 월일까요?", o: ["8월", "9월", "10월", "11월"], a: 2 },
  { id: "kr10", q: "광복절은 몇 월일까요?", o: ["3월", "6월", "8월", "10월"], a: 2 },
  { id: "kr11", q: "삼일절은 몇 월일까요?", o: ["1월", "3월", "5월", "8월"], a: 1 },
  { id: "kr12", q: "십장생에 들지 않는 것은?", o: ["소나무", "거북", "자동차", "학"], a: 2 },

  // ── 명절·음식 ──
  { id: "food01", q: "김치의 주재료는 무엇일까요?", o: ["무", "오이", "배추", "당근"], a: 2 },
  { id: "food02", q: "된장을 만들 때 쓰는 콩 덩어리는?", o: ["메주", "두부", "청국장", "묵"], a: 0 },
  { id: "food03", q: "우유는 어떤 동물에게서 얻나요?", o: ["돼지", "소", "닭", "양"], a: 1 },
  { id: "food04", q: "단오에 즐기던 놀이는?", o: ["그네뛰기", "연날리기", "윷놀이", "제기차기"], a: 0 },

  // ── 자연·과학·생활 ──
  { id: "nat01", q: "무지개는 모두 몇 가지 색일까요?", o: ["다섯", "여섯", "일곱", "여덟"], a: 2 },
  { id: "nat02", q: "무지개에서 가장 위에 있는 색은?", o: ["빨강", "보라", "초록", "노랑"], a: 0 },
  { id: "nat03", q: "봄에 가장 먼저 피는 노란 꽃은?", o: ["장미", "국화", "개나리", "코스모스"], a: 2 },
  { id: "nat04", q: "벌이 부지런히 모으는 것은?", o: ["꿀", "솜", "쌀", "물"], a: 0 },
  { id: "nat05", q: "개구리는 어릴 때 무엇이라고 부를까요?", o: ["올챙이", "붕어", "미꾸라지", "송사리"], a: 0 },
  { id: "nat06", q: "나비가 되기 직전 단계는?", o: ["알", "애벌레", "번데기", "고치실"], a: 2 },
  { id: "nat07", q: "해는 어느 쪽에서 뜰까요?", o: ["동쪽", "서쪽", "남쪽", "북쪽"], a: 0 },
  { id: "nat08", q: "해는 어느 쪽으로 질까요?", o: ["동쪽", "서쪽", "남쪽", "북쪽"], a: 1 },
  { id: "nat09", q: "우리 몸에서 피를 온몸으로 보내는 곳은?", o: ["폐", "심장", "위", "간"], a: 1 },
  { id: "nat10", q: "물이 어는 온도는?", o: ["0도", "10도", "영하 10도", "100도"], a: 0 },
  { id: "nat11", q: "물이 끓는 온도는?", o: ["50도", "80도", "100도", "200도"], a: 2 },
  { id: "nat12", q: "하루는 몇 시간일까요?", o: ["12시간", "24시간", "30시간", "48시간"], a: 1 },
  { id: "nat13", q: "한 시간은 몇 분일까요?", o: ["30분", "60분", "100분", "24분"], a: 1 },
  { id: "nat14", q: "1분은 몇 초일까요?", o: ["30초", "60초", "100초", "24초"], a: 1 },
  { id: "nat15", q: "일 년은 몇 개월일까요?", o: ["열 달", "열두 달", "열네 달", "스물네 달"], a: 1 },
  { id: "nat16", q: "일주일은 며칠일까요?", o: ["닷새", "엿새", "이레(7일)", "여드레"], a: 2 },
  { id: "nat17", q: "봄·여름·가을·겨울은 모두 몇 계절?", o: ["둘", "셋", "넷", "다섯"], a: 2 },
  { id: "nat18", q: "한 손의 손가락은 모두 몇 개?", o: ["넷", "다섯", "여섯", "열"], a: 1 },
  { id: "nat19", q: "낙타가 주로 사는 곳은?", o: ["사막", "바다", "북극", "정글"], a: 0 },
  { id: "nat20", q: "북극에 사는 흰색 곰은?", o: ["반달곰", "북극곰", "판다", "불곰"], a: 1 },

  // ── 속담 (빈칸 채우기) ──
  { id: "prov01", q: '"가는 말이 고와야 ◯◯ 말이 곱다"', o: ["오는", "하는", "나쁜", "지는"], a: 0 },
  { id: "prov02", q: '"티끌 모아 ◯◯"', o: ["강물", "태산", "보름", "큰일"], a: 1 },
  { id: "prov03", q: '"낮말은 새가 듣고 밤말은 ◯가 듣는다"', o: ["개", "쥐", "닭", "소"], a: 1 },
  { id: "prov04", q: '"발 없는 말이 ◯ 리 간다"', o: ["백", "천", "만", "십"], a: 1 },
  { id: "prov05", q: '"소 잃고 ◯◯◯ 고친다"', o: ["외양간", "대문", "지붕", "마당"], a: 0 },
  { id: "prov06", q: '"우물 안 ◯◯◯"', o: ["올챙이", "개구리", "붕어", "미꾸라지"], a: 1 },
  { id: "prov07", q: '"백지장도 ◯◯◯ 낫다"', o: ["맞들면", "접으면", "펼치면", "말리면"], a: 0 },
  { id: "prov08", q: '"등잔 밑이 ◯◯◯"', o: ["환하다", "어둡다", "뜨겁다", "좁다"], a: 1 },
  { id: "prov09", q: '"천 리 길도 ◯ ◯◯부터"', o: ["한 걸음", "지도 보기", "새 신발", "지팡이"], a: 0 },
  { id: "prov10", q: '"가재는 ◯ 편"', o: ["게", "새", "소", "말"], a: 0 },
  { id: "prov11", q: '"고래 싸움에 ◯◯ 등 터진다"', o: ["거북", "새우", "조개", "오징어"], a: 1 },
  { id: "prov12", q: '"원숭이도 ◯◯에서 떨어진다"', o: ["바위", "나무", "하늘", "지붕"], a: 1 },
  { id: "prov13", q: '"바늘 도둑이 ◯ 도둑 된다"', o: ["말", "소", "돈", "금"], a: 1 },
  { id: "prov14", q: '"호랑이도 제 말 하면 ◯◯"', o: ["도망간다", "온다", "웃는다", "잔다"], a: 1 },
  { id: "prov15", q: '"돌다리도 ◯◯◯◯ 건너라"', o: ["두들겨 보고", "뛰어서", "돌아서", "눈감고"], a: 0 },
  { id: "prov16", q: '"말 한마디에 ◯ 냥 빚도 갚는다"', o: ["백", "천", "만", "열"], a: 1 },
  { id: "prov17", q: '"세 살 버릇 ◯◯까지 간다"', o: ["예순", "일흔", "여든", "아흔"], a: 2 },
  { id: "prov18", q: '"배보다 ◯◯이 더 크다"', o: ["배꼽", "머리", "손", "발"], a: 0 },
  { id: "prov19", q: '"남의 ◯이 더 커 보인다"', o: ["밥", "떡", "집", "옷"], a: 1 },
  { id: "prov20", q: '"윗물이 맑아야 ◯◯이 맑다"', o: ["샘물", "아랫물", "빗물", "바닷물"], a: 1 },
  { id: "prov21", q: '"밑 빠진 ◯에 물 붓기"', o: ["독", "병", "통", "바가지"], a: 0 },
  { id: "prov22", q: '"개천에서 ◯ 난다"', o: ["별", "용", "꽃", "복"], a: 1 },
  { id: "prov23", q: '"벼는 익을수록 ◯◯를 숙인다"', o: ["허리", "고개", "무릎", "어깨"], a: 1 },
  { id: "prov24", q: '"서당 개 삼 년이면 ◯◯을 읊는다"', o: ["시조", "풍월", "노래", "글씨"], a: 1 },
  { id: "prov25", q: '"목마른 사람이 ◯◯ 판다"', o: ["우물", "밭", "구덩이", "도랑"], a: 0 },
  { id: "prov26", q: "아주 쉬운 일을 뜻하는 속담은?", o: ["누워서 떡 먹기", "하늘의 별 따기", "산 넘어 산", "그림의 떡"], a: 0 },
  { id: "prov27", q: "아주 어려운 일을 뜻하는 속담은?", o: ["식은 죽 먹기", "땅 짚고 헤엄치기", "하늘의 별 따기", "누워서 떡 먹기"], a: 2 },
  { id: "prov28", q: "'우이독경'과 뜻이 통하는 속담은?", o: ["소 귀에 경 읽기", "가는 날이 장날", "등잔 밑이 어둡다", "누워서 떡 먹기"], a: 0 },
];

/** 단어 짝. id 는 출제 이력(quiz_seen.qid)의 키이므로 한번 정하면 바꾸지 않는다. */
export type WordItem = { id: string; q: string; ans: string; d: string[] };

export const WORDQ: WordItem[] = [
  { id: "w01", q: "바늘", ans: "실", d: ["못", "풀", "종이"] },
  { id: "w02", q: "숟가락", ans: "젓가락", d: ["접시", "컵", "냄비"] },
  { id: "w03", q: "우산", ans: "비", d: ["눈사람", "모자", "바람"] },
  { id: "w04", q: "연필", ans: "지우개", d: ["가위", "자석", "풍선"] },
  { id: "w05", q: "구두", ans: "양말", d: ["장갑", "목도리", "안경"] },
  { id: "w06", q: "책상", ans: "의자", d: ["이불", "수건", "우산"] },
  { id: "w07", q: "장갑", ans: "손", d: ["발", "코", "귀"] },
  { id: "w08", q: "열쇠", ans: "자물쇠", d: ["바퀴", "단추", "거울"] },
  { id: "w09", q: "낚싯대", ans: "물고기", d: ["새", "구름", "돌"] },
  { id: "w10", q: "베개", ans: "이불", d: ["신발", "우산", "컵"] },
  { id: "w11", q: "실", ans: "바느질", d: ["요리", "달리기", "노래"] },
  { id: "w12", q: "성냥", ans: "불", d: ["물", "얼음", "바람"] },
  { id: "w13", q: "붓", ans: "먹", d: ["망치", "가위", "빗"] },
  { id: "w14", q: "안경", ans: "눈", d: ["입", "귀", "손"] },

  // ── 살림·도구 ──
  { id: "w15", q: "망치", ans: "못", d: ["실", "빗", "컵"] },
  { id: "w16", q: "가위", ans: "종이", d: ["국물", "신발", "바람"] },
  { id: "w17", q: "빗", ans: "머리", d: ["발", "무릎", "어깨"] },
  { id: "w18", q: "칫솔", ans: "치약", d: ["수건", "거울", "빗자루"] },
  { id: "w19", q: "냄비", ans: "뚜껑", d: ["젓가락", "도마", "행주"] },
  { id: "w20", q: "도마", ans: "칼", d: ["부채", "빗", "우산"] },
  { id: "w21", q: "주전자", ans: "물", d: ["밥", "빵", "떡"] },
  { id: "w22", q: "초", ans: "촛대", d: ["주전자", "항아리", "바구니"] },
  { id: "w23", q: "부채", ans: "바람", d: ["비", "눈", "구름"] },
  { id: "w24", q: "우물", ans: "두레박", d: ["대문", "마루", "담장"] },
  { id: "w25", q: "지갑", ans: "돈", d: ["열쇠", "안경", "신문"] },
  { id: "w26", q: "자전거", ans: "바퀴", d: ["날개", "지붕", "창문"] },
  { id: "w27", q: "우체통", ans: "편지", d: ["신문", "잡지", "달력"] },

  // ── 재는 것 (같은 보기 묶음으로 헷갈리게) ──
  { id: "w28", q: "시계", ans: "시간", d: ["무게", "온도", "길이"] },
  { id: "w29", q: "저울", ans: "무게", d: ["시간", "온도", "길이"] },
  { id: "w30", q: "온도계", ans: "온도", d: ["무게", "시간", "길이"] },
  { id: "w31", q: "자", ans: "길이", d: ["무게", "온도", "시간"] },

  // ── 자연·동물 ──
  { id: "w32", q: "벌집", ans: "벌", d: ["개미", "나비", "거미"] },
  { id: "w33", q: "거미", ans: "거미줄", d: ["벌집", "둥지", "고치"] },
  { id: "w34", q: "새", ans: "둥지", d: ["벌집", "외양간", "고치"] },
  { id: "w35", q: "소", ans: "외양간", d: ["둥지", "벌집", "고치"] },
  { id: "w36", q: "누에", ans: "고치", d: ["벌집", "둥지", "거미줄"] },
  { id: "w37", q: "닭", ans: "달걀", d: ["우유", "꿀", "두부"] },
  { id: "w38", q: "논", ans: "벼", d: ["콩", "감자", "배추"] },
  { id: "w39", q: "꽃", ans: "향기", d: ["소리", "무게", "그림자"] },

  // ── 몸·감각 ──
  { id: "w40", q: "거울", ans: "얼굴", d: ["발", "등", "어깨"] },
  { id: "w41", q: "목도리", ans: "목", d: ["손", "발", "배"] },
  { id: "w42", q: "돋보기", ans: "글씨", d: ["소리", "냄새", "맛"] },
  { id: "w43", q: "라디오", ans: "소리", d: ["글씨", "냄새", "맛"] },

  // ── 사람·장소 ──
  { id: "w44", q: "학교", ans: "선생님", d: ["스님", "의사", "농부"] },
  { id: "w45", q: "병원", ans: "의사", d: ["선생님", "스님", "농부"] },
];

// ── 출제 ────────────────────────────────────────────────────────────────
//
// 1) 후보(Candidate) 목록을 만든다 — 지식 파생 양방향 + 단발 문항.
// 2) 이력(SeenMap)을 보고 고른다 — 안 본 것 우선 → 모자라면 오래 전에 본 것부터.
// 3) 고른 후보를 문제로 만든다 — 이때 오답을 뽑고 보기를 셔플한다.

/** 보기 셔플 전의 문제. 정답은 인덱스가 아니라 문자열로 들고 있다. */
type RawQuestion = { q: string; ans: string; d: string[] };

/** 지연 생성 후보. make() 는 호출될 때마다 오답을 새로 뽑는다. */
export type Candidate = { qid: string; source: string; make: () => RawQuestion };

/** qid → 마지막으로 출제된 시각(epoch ms). 없는 키 = 아직 본 적 없음. */
export type SeenMap = Record<string, number>;

/** 같은 권역 풀이 이만큼 안 되면 오답을 전체 풀에서 뽑는다. */
const NEAR_POOL_MIN = 4;

/**
 * 오답 n개를 뽑는다. 가까운 풀(같은 권역·같은 카테고리) 우선, 모자라면 전체 풀로 보충.
 * 정답과 같은 값, 중복은 제외한다.
 */
function pickDistractors(ans: string, near: readonly string[], all: readonly string[], n = 3): string[] {
  const pool = (xs: readonly string[]) => Array.from(new Set(xs)).filter((x) => x !== ans);
  const out = shuffle(pool(near)).slice(0, n);
  if (out.length < n) {
    const rest = shuffle(pool(all)).filter((x) => !out.includes(x));
    out.push(...rest.slice(0, n - out.length));
  }
  return out;
}

function capitalCandidates(): Candidate[] {
  const allCaps = CAPITALS.map((c) => c.capital);
  const allCountries = CAPITALS.map((c) => c.country);
  return CAPITALS.flatMap((f) => {
    const region = CAPITALS.filter((x) => x.region === f.region);
    const near = region.length >= NEAR_POOL_MIN ? region : CAPITALS;
    const source = `cap:${f.country}`;
    return [
      {
        qid: `${source}:fwd`,
        source,
        make: () => ({
          q: `${f.country}의 수도는 어디일까요?`,
          ans: f.capital,
          d: pickDistractors(f.capital, near.map((x) => x.capital), allCaps),
        }),
      },
      {
        qid: `${source}:rev`,
        source,
        make: () => ({
          q: `${f.capital} — 어느 나라의 수도일까요?`,
          ans: f.country,
          d: pickDistractors(f.country, near.map((x) => x.country), allCountries),
        }),
      },
    ];
  });
}

function seasonalCandidates(): Candidate[] {
  const foods = SEASONAL.map((s) => s.food);
  const occasions = SEASONAL.map((s) => s.occasion);
  return SEASONAL.flatMap((f) => {
    const source = `season:${f.occasion}`;
    return [
      {
        qid: `${source}:fwd`,
        source,
        make: () => ({
          q: `${f.occasion}에 먹는 대표 음식은?`,
          ans: f.food,
          d: pickDistractors(f.food, foods, foods),
        }),
      },
      {
        qid: `${source}:rev`,
        source,
        make: () => ({
          q: `${f.food} — 언제 먹는 음식일까요?`,
          ans: f.occasion,
          d: pickDistractors(f.occasion, occasions, occasions),
        }),
      },
    ];
  });
}

function idiomCandidates(): Candidate[] {
  const meanings = IDIOMS.map((i) => i.meaning);
  const idioms = IDIOMS.map((i) => i.idiom);
  return IDIOMS.flatMap((f) => {
    const source = `idiom:${f.idiom}`;
    return [
      {
        qid: `${source}:fwd`,
        source,
        make: () => ({
          q: `'${f.idiom}'의 뜻은?`,
          ans: f.meaning,
          d: pickDistractors(f.meaning, meanings, meanings),
        }),
      },
      {
        qid: `${source}:rev`,
        source,
        make: () => ({
          q: `'${f.meaning}' — 이 뜻의 한자성어는?`,
          ans: f.idiom,
          d: pickDistractors(f.idiom, idioms, idioms),
        }),
      },
    ];
  });
}

/** 상식 퀴즈 후보 — 지식 파생 + 단발 문항. */
export function quizCandidates(): Candidate[] {
  const statics: Candidate[] = QUIZ.map((item) => ({
    qid: `quiz:${item.id}`,
    source: `quiz:${item.id}`,
    make: () => ({
      q: item.q,
      ans: item.o[item.a],
      d: item.o.filter((_, i) => i !== item.a),
    }),
  }));
  return [...capitalCandidates(), ...seasonalCandidates(), ...idiomCandidates(), ...statics];
}

/**
 * 단어 맞추기 후보.
 *
 * 오답(d)은 문항마다 손으로 골라 둔다. 퀴즈처럼 같은 카테고리 풀에서 무작위로
 * 뽑으면 안 된다 — 연상 게임이라 "연필"에 "종이" 같은, 정답과 똑같이 그럴듯한
 * 오답이 섞여 정답이 두 개가 되어 버린다.
 *
 * 은행 크기가 하루 소비량(하드 12문제 × 2판 = 24)을 넘어야 회전이 의미를 갖는다.
 */
export function wordCandidates(): Candidate[] {
  return WORDQ.map((w) => ({
    qid: `word:${w.id}`,
    source: `word:${w.id}`,
    make: () => ({ q: w.q, ans: w.ans, d: w.d }),
  }));
}

export function candidatesFor(gameId: ChoiceGameId): Candidate[] {
  return gameId === "quiz" ? quizCandidates() : wordCandidates();
}

/**
 * 안 본 문제 우선 → 모자라면 오래 전에 본 것부터 n개 고른다.
 * 한 판 안에서 같은 source 는 한 번만 쓴다(같은 지식의 양방향 동시 출제 = 답 유출).
 *
 * 이력이 같은 시각인 문제들은 shuffle 한 뒤 안정 정렬로 순서를 흩는다 —
 * 안 그러면 회전 주기마다 같은 순서가 반복된다.
 */
export function selectCandidates(pool: readonly Candidate[], n: number, seen: SeenMap): Candidate[] {
  const unseen: Candidate[] = [];
  const already: Candidate[] = [];
  for (const c of pool) (seen[c.qid] === undefined ? unseen : already).push(c);

  const ordered = [
    ...shuffle(unseen),
    ...shuffle(already).sort((a, b) => seen[a.qid] - seen[b.qid]),
  ];

  const usedSource = new Set<string>();
  const out: Candidate[] = [];
  for (const c of ordered) {
    if (out.length >= n) break;
    if (usedSource.has(c.source)) continue;
    usedSource.add(c.source);
    out.push(c);
  }
  return out;
}

/** 출제 결과. qid 는 이력 기록용으로 서버에만 남기고 클라에는 ChoiceRound 만 내린다. */
export type ServedRound = ChoiceRound & { qid: string };

export function buildRounds(gameId: ChoiceGameId, n: number, seen: SeenMap = {}): ServedRound[] {
  return selectCandidates(candidatesFor(gameId), n, seen).map((c) => {
    const raw = c.make();
    const options = shuffle([raw.ans, ...raw.d]);
    return { qid: c.qid, prompt: raw.q, options, answer: options.indexOf(raw.ans) };
  });
}
