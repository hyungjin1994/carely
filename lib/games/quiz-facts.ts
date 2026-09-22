import "server-only";

/**
 * 지식 테이블 — 상식 퀴즈의 양방향 파생 원본. **서버 전용.**
 *
 * "지식" 1건을 적으면 문제 2개가 나온다.
 *   { country: "프랑스", capital: "파리" }
 *     → "프랑스의 수도는 어디일까요?"
 *     → "파리 — 어느 나라의 수도일까요?"
 * 오답은 같은 테이블(가능하면 같은 권역)에서 매 판 새로 뽑으므로 보기 조합이
 * 매번 달라진다. 문제를 늘리는 가장 싼 방법이다.
 *
 * ── 65세 이상을 기준으로 골랐다 ──
 * 젊은 세대용 상식과 달라야 한다. 옛 단위(되·말·근·자), 절기, 동물 새끼 이름처럼
 * **어머니는 알고 자녀는 모르는 것**이 특히 좋다 — 맞히는 경험이 자신감이 된다.
 *
 * ── 넣을 때 지킬 것 ──
 * · 논란이 있는 건 넣지 않는다. 수도가 여럿인 나라(남아공), 국호가 바뀐 나라,
 *   분쟁 지역은 제외했다.
 * · **같은 테이블 안에 뜻이 겹치는 항목을 넣지 않는다.** 오답으로 서로 뽑히면
 *   정답이 두 개가 된다. (예: 일석이조와 일거양득은 같은 뜻이라 하나만 넣었다.)
 * · QUIZ 단발 문항과 내용이 겹치지 않게 한다. 같은 것을 묻는 문제가 두 벌
 *   생긴다. (개구리-올챙이, 심장은 QUIZ 에 있으므로 여기 넣지 않았다.)
 */

/** 나라↔수도. region 은 오답을 같은 권역에서 뽑기 위한 것(4건 이상이면 권역, 미만이면 전체 풀). */
export type CapitalFact = { country: string; capital: string; region: "유럽" | "아시아" | "아메리카" | "기타" };

export const CAPITALS: CapitalFact[] = [
  // ── 유럽 ──
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
  { country: "오스트리아", capital: "빈", region: "유럽" },
  { country: "벨기에", capital: "브뤼셀", region: "유럽" },
  { country: "체코", capital: "프라하", region: "유럽" },
  { country: "덴마크", capital: "코펜하겐", region: "유럽" },
  { country: "핀란드", capital: "헬싱키", region: "유럽" },
  { country: "노르웨이", capital: "오슬로", region: "유럽" },
  { country: "폴란드", capital: "바르샤바", region: "유럽" },
  { country: "아일랜드", capital: "더블린", region: "유럽" },
  { country: "헝가리", capital: "부다페스트", region: "유럽" },

  // ── 아시아 ──
  { country: "대한민국", capital: "서울", region: "아시아" },
  { country: "일본", capital: "도쿄", region: "아시아" },
  { country: "중국", capital: "베이징", region: "아시아" },
  { country: "태국", capital: "방콕", region: "아시아" },
  { country: "베트남", capital: "하노이", region: "아시아" },
  { country: "필리핀", capital: "마닐라", region: "아시아" },
  { country: "인도", capital: "뉴델리", region: "아시아" },
  { country: "인도네시아", capital: "자카르타", region: "아시아" },
  { country: "몽골", capital: "울란바토르", region: "아시아" },
  { country: "말레이시아", capital: "쿠알라룸푸르", region: "아시아" },
  { country: "캄보디아", capital: "프놈펜", region: "아시아" },
  { country: "라오스", capital: "비엔티안", region: "아시아" },
  { country: "네팔", capital: "카트만두", region: "아시아" },
  { country: "파키스탄", capital: "이슬라마바드", region: "아시아" },
  { country: "방글라데시", capital: "다카", region: "아시아" },
  { country: "이란", capital: "테헤란", region: "아시아" },

  // ── 아메리카 ──
  { country: "미국", capital: "워싱턴 D.C.", region: "아메리카" },
  { country: "캐나다", capital: "오타와", region: "아메리카" },
  { country: "브라질", capital: "브라질리아", region: "아메리카" },
  { country: "멕시코", capital: "멕시코시티", region: "아메리카" },
  { country: "아르헨티나", capital: "부에노스아이레스", region: "아메리카" },
  { country: "칠레", capital: "산티아고", region: "아메리카" },
  { country: "페루", capital: "리마", region: "아메리카" },
  { country: "콜롬비아", capital: "보고타", region: "아메리카" },
  { country: "쿠바", capital: "아바나", region: "아메리카" },
  { country: "우루과이", capital: "몬테비데오", region: "아메리카" },

  // ── 그 밖 ──
  { country: "이집트", capital: "카이로", region: "기타" },
  { country: "호주", capital: "캔버라", region: "기타" },
  { country: "뉴질랜드", capital: "웰링턴", region: "기타" },
  { country: "사우디아라비아", capital: "리야드", region: "기타" },
  { country: "케냐", capital: "나이로비", region: "기타" },
  { country: "모로코", capital: "라바트", region: "기타" },
  { country: "나이지리아", capital: "아부자", region: "기타" },
  { country: "에티오피아", capital: "아디스아바바", region: "기타" },
];

/** 한자성어↔뜻. 뜻이 겹치는 것을 같이 두지 않는다 — 오답으로 뽑히면 정답이 둘이 된다. */
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
  { idiom: "설상가상", meaning: "어려운 일이 겹쳐 더 나빠짐" },
  { idiom: "전화위복", meaning: "화가 바뀌어 복이 됨" },
  { idiom: "이심전심", meaning: "말 없이 마음이 통함" },
  { idiom: "역지사지", meaning: "처지를 바꿔 생각해 봄" },
  { idiom: "백년해로", meaning: "부부가 함께 늙어감" },
  { idiom: "무용지물", meaning: "아무 쓸모가 없는 것" },
  { idiom: "천생연분", meaning: "하늘이 맺어준 짝" },
  { idiom: "우유부단", meaning: "결정을 못 하고 망설임" },
  { idiom: "호사다마", meaning: "좋은 일에 방해가 많음" },
  { idiom: "동문서답", meaning: "묻는 말과 딴 답을 함" },
  { idiom: "자포자기", meaning: "스스로 포기해 버림" },
  { idiom: "반신반의", meaning: "반은 믿고 반은 의심함" },
  { idiom: "일취월장", meaning: "나날이 크게 나아짐" },
  { idiom: "초지일관", meaning: "처음 뜻을 끝까지 지킴" },
  { idiom: "칠전팔기", meaning: "여러 번 넘어져도 다시 일어남" },
  { idiom: "결초보은", meaning: "은혜를 잊지 않고 갚음" },
  { idiom: "구사일생", meaning: "여러 번 죽을 뻔하다 살아남" },
  { idiom: "금의환향", meaning: "성공해서 고향에 돌아옴" },
  { idiom: "노심초사", meaning: "몹시 애를 쓰며 속을 태움" },
  { idiom: "대동소이", meaning: "크게 보면 비슷하고 조금만 다름" },
  { idiom: "동분서주", meaning: "이리저리 바쁘게 돌아다님" },
  { idiom: "명불허전", meaning: "이름난 것이 헛되지 않음" },
  { idiom: "부전자전", meaning: "아들이 아버지를 닮음" },
  { idiom: "사필귀정", meaning: "모든 일은 바른 데로 돌아감" },
  { idiom: "선견지명", meaning: "앞일을 미리 아는 지혜" },
  { idiom: "수구초심", meaning: "고향을 그리워하는 마음" },
  { idiom: "안분지족", meaning: "분수를 지키며 만족함" },
  { idiom: "이구동성", meaning: "여러 사람이 똑같은 말을 함" },
  { idiom: "인과응보", meaning: "행한 대로 결과를 받음" },
  { idiom: "진퇴양난", meaning: "나아갈 수도 물러설 수도 없음" },
  { idiom: "자화자찬", meaning: "스스로 자기를 칭찬함" },
  { idiom: "전전긍긍", meaning: "몹시 두려워 조심함" },
  { idiom: "학수고대", meaning: "목을 늘이고 간절히 기다림" },
  { idiom: "천신만고", meaning: "온갖 고생을 다 함" },
];

/** 명절·행사↔음식. */
export type SeasonalFact = { occasion: string; food: string };

export const SEASONAL: SeasonalFact[] = [
  { occasion: "추석", food: "송편" },
  { occasion: "설날", food: "떡국" },
  { occasion: "동짓날", food: "팥죽" },
  { occasion: "정월 대보름", food: "오곡밥" },
  { occasion: "복날", food: "삼계탕" },
  { occasion: "생일", food: "미역국" },
  { occasion: "결혼식", food: "국수" },
  { occasion: "돌잔치", food: "백설기" },
  { occasion: "이사한 날", food: "팥시루떡" },
  { occasion: "시험 보는 날", food: "찰떡" },
];

/**
 * 절기↔뜻. 어머니 세대에는 익숙하고 자녀 세대는 모르는 축이라 특히 값이 좋다.
 * 뜻이 겹치지 않게 골랐다 (춘분·추분은 "봄날/가을날" 로 구분).
 */
export type SolarTermFact = { term: string; meaning: string };

export const SOLAR_TERMS: SolarTermFact[] = [
  { term: "입춘", meaning: "봄이 시작되는 날" },
  { term: "경칩", meaning: "개구리가 잠에서 깨는 때" },
  { term: "춘분", meaning: "낮과 밤의 길이가 같아지는 봄날" },
  { term: "청명", meaning: "하늘이 맑아지는 때" },
  { term: "하지", meaning: "낮이 가장 긴 날" },
  { term: "대서", meaning: "더위가 가장 심한 때" },
  { term: "입추", meaning: "가을이 시작되는 날" },
  { term: "백로", meaning: "이슬이 내리기 시작하는 때" },
  { term: "추분", meaning: "낮과 밤의 길이가 같아지는 가을날" },
  { term: "상강", meaning: "서리가 내리기 시작하는 때" },
  { term: "입동", meaning: "겨울이 시작되는 날" },
  { term: "동지", meaning: "밤이 가장 긴 날" },
  { term: "대한", meaning: "추위가 가장 심한 때" },
  { term: "망종", meaning: "보리를 베고 모를 심는 때" },
];

/**
 * 동물↔새끼 이름. 우리말에만 있는 이름이라 어머니가 강하다.
 * 개구리-올챙이는 QUIZ 단발 문항(nat05)에 있으므로 여기 넣지 않았다.
 */
export type AnimalFact = { animal: string; baby: string };

export const ANIMALS: AnimalFact[] = [
  { animal: "소", baby: "송아지" },
  { animal: "말", baby: "망아지" },
  { animal: "개", baby: "강아지" },
  { animal: "닭", baby: "병아리" },
  { animal: "꿩", baby: "꺼병이" },
  { animal: "명태", baby: "노가리" },
  { animal: "고등어", baby: "고도리" },
  { animal: "가오리", baby: "간자미" },
];

/**
 * 몸의 기관↔하는 일.
 * 심장은 QUIZ 단발 문항(nat09)에 있으므로 여기 넣지 않았다.
 */
export type BodyFact = { part: string; work: string };

export const BODY_PARTS: BodyFact[] = [
  { part: "폐", work: "숨을 쉬게 한다" },
  { part: "위", work: "먹은 음식을 삭힌다" },
  { part: "콩팥", work: "오줌을 만든다" },
  { part: "간", work: "몸에 들어온 독을 걸러낸다" },
  { part: "뼈", work: "몸을 버티게 한다" },
  { part: "근육", work: "몸을 움직이게 한다" },
  { part: "혀", work: "맛을 느끼게 한다" },
  { part: "코", work: "냄새를 맡게 한다" },
];

/**
 * 옛 단위↔크기. 어머니는 알고 자녀는 모르는 대표적인 축이다.
 * 대략값이므로 "약" 을 붙여 정확한 환산을 묻지 않는다.
 */
export type OldUnitFact = { unit: string; size: string };

export const OLD_UNITS: OldUnitFact[] = [
  { unit: "한 되", size: "약 1.8리터" },
  { unit: "한 말", size: "열 되" },
  { unit: "한 섬", size: "열 말" },
  { unit: "한 근", size: "약 600그램" },
  { unit: "한 관", size: "약 3.75킬로그램" },
  { unit: "한 자", size: "약 30센티미터" },
  { unit: "한 치", size: "약 3센티미터" },
  { unit: "한 평", size: "약 3.3제곱미터" },
];
