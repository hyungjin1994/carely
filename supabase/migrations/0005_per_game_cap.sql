-- 0005: 게임 1종당 하루 적립 한도(per-game cap) 추가.
-- submit_game_result 가 일일 한도(award_points, 1000) 에 더해 게임별 한도(200)도
-- 함께 클램프한다. 한 게임만 반복해서 포인트를 몰아 받지 못하게 하기 위함.
-- per_game_cap 값은 lib/games/config.ts 의 PER_GAME_DAILY_CAP 과 동일하게 유지할 것.
-- award_points(사진 적립 등에서 공용) 는 일일 한도 전용으로 그대로 둔다.

create or replace function public.submit_game_result(
  p_game_id text, p_difficulty text, p_correct integer, p_total integer, p_points integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'Asia/Seoul')::date;
  per_game_cap constant integer := 200;   -- = lib/games/config.ts PER_GAME_DAILY_CAP
  game_total integer;
  capped integer;
  awarded integer;
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  -- 일일 행 확보 후 잠금: 같은 사용자의 동시 적립을 직렬화한다.
  -- (award_points 도 같은 행을 잠그므로, 여기서 먼저 잠가야 game_total 합산이 race-free)
  insert into public.daily_points(user_id, date, total)
  values (uid, d, 0)
  on conflict (user_id, date) do nothing;

  perform 1 from public.daily_points
    where user_id = uid and date = d
    for update;

  -- 오늘(KST) 이 게임으로 이미 적립한 포인트 합 (game_scores.points 는 실제 적립값)
  select coalesce(sum(points), 0) into game_total
    from public.game_scores
    where user_id = uid
      and game_id = p_game_id
      and (created_at at time zone 'Asia/Seoul')::date = d;

  -- 게임별 한도로 먼저 클램프 → 그 다음 일일 한도(award_points)로 클램프
  capped := least(greatest(p_points, 0), greatest(0, per_game_cap - game_total));
  awarded := public.award_points(uid, capped, 'game', p_game_id);

  insert into public.game_scores(user_id, game_id, difficulty, correct, total, points)
  values (uid, p_game_id, p_difficulty, greatest(p_correct,0), greatest(p_total,0), awarded);

  return awarded;
end;
$$;
