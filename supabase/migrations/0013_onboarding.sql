-- 0013: 어르신 초기 설정(온보딩) 정보 — profiles 에 건강·생활 컬럼 추가.
-- 가입 직후 입력(건너뛰기 가능). onboarded=false 면 홈에서 설정 배너 노출.

alter table public.profiles
  add column if not exists birth_date     date,
  add column if not exists gender         text,         -- '남' | '여'
  add column if not exists height_cm      numeric,
  add column if not exists weight_kg      numeric,
  add column if not exists wake_time      text,          -- 'HH:MM'
  add column if not exists sleep_time     text,
  add column if not exists meal_morning   text,
  add column if not exists meal_noon      text,
  add column if not exists meal_evening   text,
  add column if not exists exercise_time  text,
  add column if not exists conditions     text[],        -- 만성질환 다중
  add column if not exists allergies      text,          -- 약물 알레르기 등
  add column if not exists living          text,         -- '혼자' | '배우자와' | '가족과'
  add column if not exists emergency_name  text,
  add column if not exists emergency_phone text,
  add column if not exists onboarded       boolean not null default false;
