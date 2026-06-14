// 수기 작성한 Supabase 타입. 실제 프로젝트 링크 후 `npm run gen:types` 로 재생성 권장.

export type Role = "mom" | "child";
export type ExchangeStatus = "pending" | "approved" | "rejected" | "done";
export type EventType = "약" | "병원" | "운동" | "가족" | "기타";

export type Profile = {
  id: string;
  name: string | null;
  role: Role;
  font_scale: number;
  high_contrast: boolean;
  notify_on: boolean;
  created_at: string;
};

export type FamilyLink = {
  id: string;
  mom_id: string;
  child_id: string;
  status: "active" | "paused";
  created_at: string;
};

export type ConnectCode = {
  code: string;
  mom_id: string;
  expires_at: string;
  used_by: string | null;
  created_at: string;
};

export type PointLedger = {
  id: string;
  user_id: string;
  delta: number;
  reason: "game" | "photo";
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

export type Message = {
  id: string;
  family_id: string;
  from_id: string;
  text: string;
  photo_id: string | null;
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
      messages: Table<Message>;
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
      is_linked: { Args: { a: string; b: string }; Returns: boolean };
    };
  };
};
