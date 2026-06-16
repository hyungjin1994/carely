// 수기 작성한 Supabase 타입. 실제 프로젝트 링크 후 `npm run gen:types` 로 재생성 권장.

export type Role = "parent" | "grandparent" | "manager";
export type ExchangeStatus = "pending" | "approved" | "rejected" | "done";
export type EventType = "약" | "병원" | "운동" | "가족" | "여행" | "모임" | "생일" | "기타";
export type MeasurementKind = "glucose_fasting" | "glucose_post" | "bp" | "weight";

export type Profile = {
  id: string;
  name: string | null;
  role: Role;
  font_scale: number;
  high_contrast: boolean;
  notify_on: boolean;
  // 온보딩 정보 (0013)
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  wake_time: string | null;
  sleep_time: string | null;
  meal_morning: string | null;
  meal_noon: string | null;
  meal_evening: string | null;
  exercise_time: string | null;
  conditions: string[] | null;
  allergies: string | null;
  living: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  onboarded: boolean;
  created_at: string;
};

export type FamilyLink = {
  id: string;
  senior_id: string;
  manager_id: string;
  status: "active" | "paused";
  created_at: string;
};

export type ConnectCode = {
  code: string;
  senior_id: string;
  expires_at: string;
  used_by: string | null;
  created_at: string;
};

export type PointLedger = {
  id: string;
  user_id: string;
  delta: number;
  reason: "game" | "photo" | "exchange";
  game_id: string | null;
  created_at: string;
};

export type DailyPoints = { user_id: string; date: string; total: number };

export type GameScore = {
  id: string;
  user_id: string;
  game_id: string;
  difficulty: string;
  correct: number;
  total: number;
  points: number;
  created_at: string;
};

export type ExchangeRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: ExchangeStatus;
  approved_by: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  user_id: string;
  date: string;
  type: EventType;
  title: string;
  time: string | null;
  place: string | null;
  with_whom: string | null;
  memo: string | null;
  done: boolean;
};

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dose: string;
  times: string[];
  created_at: string;
};

export type MedDose = {
  id: string;
  med_id: string;
  user_id: string;
  scheduled_at: string;
  taken: boolean;
};

export type Photo = {
  id: string;
  owner_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type PhotoLike = {
  photo_id: string;
  user_id: string;
  created_at: string;
};

export type PhotoComment = {
  id: string;
  photo_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

export type Message = {
  id: string;
  family_id: string;
  from_id: string;
  text: string;
  photo_id: string | null;
  created_at: string;
};

export type Measurement = {
  id: string;
  user_id: string;
  kind: MeasurementKind;
  v1: number | null;
  v2: number | null;
  v3: number | null;
  memo: string | null;
  measured_at: string;
  created_at: string;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  send_at: string;
  sent: boolean;
  channel: "push" | "email";
};

type Table<R, I = Partial<R>, U = Partial<R>> = {
  Row: R;
  Insert: I;
  Update: U;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      family_links: Table<FamilyLink>;
      connect_codes: Table<ConnectCode>;
      point_ledger: Table<PointLedger>;
      daily_points: Table<DailyPoints>;
      game_scores: Table<GameScore>;
      exchange_requests: Table<ExchangeRequest>;
      events: Table<EventRow>;
      medications: Table<Medication>;
      med_doses: Table<MedDose>;
      photos: Table<Photo>;
      photo_likes: Table<PhotoLike>;
      photo_comments: Table<PhotoComment>;
      messages: Table<Message>;
      measurements: Table<Measurement>;
      push_subscriptions: Table<PushSubscription>;
      notifications: Table<Notification>;
    };
    Functions: {
      award_points: {
        Args: { p_user: string; p_raw: number; p_reason: string; p_game_id: string };
        Returns: number;
      };
      submit_game_result: {
        Args: { p_game_id: string; p_difficulty: string; p_correct: number; p_total: number; p_points: number };
        Returns: number;
      };
      redeem_connect_code: { Args: { p_code: string }; Returns: string };
      decide_exchange: { Args: { p_id: string; p_approve: boolean }; Returns: undefined };
      complete_exchange: { Args: { p_id: string }; Returns: undefined };
      is_linked: { Args: { a: string; b: string }; Returns: boolean };
    };
  };
};
