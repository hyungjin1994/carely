-- 사진 Storage 버킷 + 정책. 경로 규칙: {owner_id}/{filename}
-- 소유자만 쓰기, 본인+연결 가족만 읽기.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- 소유자 업로드 (경로 첫 폴더 = 본인 uid)
create policy photos_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 소유자 수정/삭제
create policy photos_modify on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 본인 + 연결 가족 읽기
create policy photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_linked(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );
