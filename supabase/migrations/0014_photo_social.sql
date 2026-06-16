-- 0014: 가족 타임라인 — 사진에 좋아요/댓글.
-- 볼 수 있는 사진(본인 또는 연결가족 소유)에 한해 좋아요·댓글을 읽고, 본인 것만 작성.

create table public.photo_likes (
  photo_id   uuid not null references public.photos(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

create table public.photo_comments (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.photos(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index photo_comments_photo_idx on public.photo_comments(photo_id, created_at);

alter table public.photo_likes enable row level security;
alter table public.photo_comments enable row level security;

-- 그 사진을 볼 수 있는 사람만 읽기, 본인 것만 쓰기/지우기
create policy photo_likes_read on public.photo_likes
  for select using (
    exists (select 1 from public.photos p
      where p.id = photo_id and (p.owner_id = auth.uid() or public.is_linked(auth.uid(), p.owner_id)))
  );
create policy photo_likes_write on public.photo_likes
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.photos p
      where p.id = photo_id and (p.owner_id = auth.uid() or public.is_linked(auth.uid(), p.owner_id)))
  );

create policy photo_comments_read on public.photo_comments
  for select using (
    exists (select 1 from public.photos p
      where p.id = photo_id and (p.owner_id = auth.uid() or public.is_linked(auth.uid(), p.owner_id)))
  );
create policy photo_comments_write on public.photo_comments
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.photos p
      where p.id = photo_id and (p.owner_id = auth.uid() or public.is_linked(auth.uid(), p.owner_id)))
  );
