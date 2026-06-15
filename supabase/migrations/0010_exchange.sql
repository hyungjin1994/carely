-- 0010: 환전 정상화 — 포인트 차감 reason 추가 + 완료 RPC.

-- point_ledger.reason 에 'exchange' 추가 (음수 delta 로 잔액 차감)
alter table public.point_ledger drop constraint if exists point_ledger_reason_check;
alter table public.point_ledger
  add constraint point_ledger_reason_check check (reason in ('game','photo','exchange'));

-- 환전 완료: 관리자가 입금을 마친 뒤 호출. 상태 done + 어르신 포인트 차감(원장 음수 1건).
create or replace function public.complete_exchange(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_owner uuid;
  v_amount integer;
  v_status text;
begin
  select user_id, amount, status into v_owner, v_amount, v_status
    from public.exchange_requests where id = p_id for update;
  if v_owner is null then
    raise exception 'not_found';
  end if;
  if not public.is_linked(uid, v_owner) then
    raise exception 'forbidden';
  end if;
  if v_status <> 'pending' then
    raise exception 'not_pending';
  end if;

  update public.exchange_requests
    set status = 'done', approved_by = uid
    where id = p_id;

  insert into public.point_ledger(user_id, delta, reason, game_id)
    values (v_owner, -v_amount, 'exchange', null);
end;
$$;
