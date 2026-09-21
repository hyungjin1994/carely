-- 0021: 포인트 잔액을 DB 에서 집계한다.
--
-- ⚠️ 버그 수정. getBalance() 가 point_ledger 행을 전부 받아 JS 에서 더하고 있었다.
--
--     const { data } = await supabase.from("point_ledger").select("delta").eq(...)
--     return data.reduce((sum, r) => sum + r.delta, 0)
--
-- PostgREST 는 기본적으로 한 번에 1,000행만 돌려준다. 원장이 1,000행을 넘는
-- 순간 뒤쪽이 잘려 **잔액이 조용히 틀리게 나온다**. 실측 964행이었으므로
-- 며칠 안에 터질 상태였다.
-- 게다가 홈·포인트·환전 화면이 매번 호출하므로 행이 쌓일수록 느려진다.
--
-- SECURITY INVOKER(기본)로 두어 RLS 를 그대로 태운다.
-- point_ledger_self(본인) · point_ledger_family_read(연결된 가족) 정책이 이미
-- 있으므로, 자녀가 어르신 잔액을 볼 때도 같은 함수로 동작한다.
-- 볼 권한이 없는 사용자의 id 를 넣으면 행이 안 보여 0 이 나온다.

create or replace function public.point_balance(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
    from public.point_ledger
   where user_id = p_user;
$$;
