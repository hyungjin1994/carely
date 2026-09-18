-- 0015: 문제 출제 이력(quiz_seen) 추가.
--
-- 왜: 퀴즈·단어 게임은 매 판 문제를 무작위로 뽑아서, 은행이 커져도 "어제 푼 문제가
-- 또 나온다"가 사라지지 않았다(같은 날 2판째 중복 59.8%). 사용자별로 본 문제를
-- 기록해 "안 본 문제 우선 → 모자라면 오래 전에 본 것부터" 순으로 출제한다.
--
-- qid 는 문항의 안정적 식별자로 lib/games/engine.ts 가 만든다.
--   지식 파생: cap:프랑스:fwd / season:추석:rev / idiom:유비무환:fwd
--   단발 문항: quiz:kr01 / word:w01
-- 방향(fwd/rev)까지 구분한다 — "프랑스의 수도는?" 을 풀었다고
-- "파리 — 어느 나라의 수도일까요?" 까지 푼 것은 아니다.
--
-- 기록 시점은 "출제할 때"다. 중간에 그만둔 문제도 본 것으로 처리되지만,
-- 그 대신 판 시작 시 왕복 1회로 끝난다(라운드마다 기록하지 않는다).

create table public.quiz_seen (
  user_id    uuid not null references auth.users(id) on delete cascade,
  qid        text not null,
  seen_at    timestamptz not null default now(),
  seen_count integer not null default 1,
  primary key (user_id, qid)
);

-- 출제 시 "오래 전에 본 것부터" 정렬용.
create index quiz_seen_user_idx on public.quiz_seen(user_id, seen_at);

alter table public.quiz_seen enable row level security;

-- 본인 데이터만. 자녀에게 열어줄 이유가 없는 내부 상태이므로 가족 읽기 정책은 두지 않는다.
create policy quiz_seen_self on public.quiz_seen
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

/**
 * 출제한 문항들을 본 것으로 표시한다.
 * SECURITY INVOKER(기본) — 자기 행만 건드리므로 quiz_seen_self 정책으로 충분하다.
 * DEFINER 로 올릴 이유가 없다.
 */
create or replace function public.mark_quiz_seen(p_qids text[])
returns void
language sql
set search_path = public
as $$
  insert into public.quiz_seen(user_id, qid)
  select auth.uid(), q
    from unnest(p_qids) as q
   where auth.uid() is not null
   group by q   -- 같은 qid 가 두 번 오면 ON CONFLICT 가 같은 행을 두 번 건드려 에러난다
  on conflict (user_id, qid)
    do update set seen_at = now(), seen_count = quiz_seen.seen_count + 1;
$$;
