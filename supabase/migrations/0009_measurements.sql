-- 0009: 측정(건강수치) 테이블 + RLS.
-- 어르신이 입력(self for all), 관리자(연결된 가족)는 읽기(family_read).
-- 매핑: glucose_fasting/glucose_post → v1=mg/dL · bp → v1=수축/v2=이완/v3=맥박 · weight → v1=kg

create table public.measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('glucose_fasting','glucose_post','bp','weight')),
  v1          numeric,
  v2          numeric,
  v3          numeric,
  memo        text,
  measured_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index measurements_user_idx on public.measurements(user_id, measured_at desc);

alter table public.measurements enable row level security;

create policy measurements_self on public.measurements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy measurements_family_read on public.measurements
  for select using (public.is_linked(auth.uid(), user_id));
