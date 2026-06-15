-- 0011: 이메일 로그인 → ID 로그인 전환 (기존 사용자 데이터 전환).
-- 기존 auth 이메일의 도메인을 합성 도메인(carely.app)으로 통일한다.
-- 앱은 로그인 시 <id>@carely.app 로 매핑하므로, ID = 기존 이메일의 @ 앞부분이 된다.
--   예) hyungjin1994@coocon.net → hyungjin1994@carely.app   (아이디: hyungjin1994)
--
-- ⚠️ 주의사항
--  1) auth 스키마를 직접 수정한다 — 실행 전 백업 권장.
--  2) @ 앞부분(local part)이 겹치는 사용자가 있으면 email unique 충돌 → 아래 점검 먼저.
--  3) Supabase Auth 의 "Confirm email"(이메일 확인)을 반드시 OFF — 합성 이메일은 수신함이 없음.
--  4) 적용 후 기존 사용자는 한 번 재로그인 필요.
--  ※ 신규 빈 프로젝트는 이 파일이 필요 없다(사용자 0명). all_migrations.sql 에 포함하지 않음.

-- (점검) 도메인 제거 시 충돌하는 로컬파트 확인 — 결과가 있으면 먼저 해소할 것:
--   select lower(split_part(email,'@',1)) as id, count(*)
--   from auth.users where email is not null
--   group by 1 having count(*) > 1;

update auth.users
   set email = lower(split_part(email, '@', 1)) || '@carely.app'
 where email is not null
   and email not like '%@carely.app';

-- 이메일 provider identity 의 identity_data.email 도 동일하게 맞춤 (로그인 조회 일관성)
update auth.identities
   set identity_data = jsonb_set(
         coalesce(identity_data, '{}'::jsonb),
         '{email}',
         to_jsonb(lower(split_part(identity_data->>'email', '@', 1)) || '@carely.app')
       )
 where provider = 'email'
   and identity_data ? 'email'
   and identity_data->>'email' not like '%@carely.app';
