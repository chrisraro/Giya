-- Create storage bucket for profile pictures
insert into storage.buckets (id, name, public)
values ('profile-pics', 'profile-pics', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Anyone can view profile pictures"
  on storage.objects for select
  using (bucket_id = 'profile-pics');

create policy "Users can upload their own profile pictures"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-pics' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own profile pictures"
  on storage.objects for update
  using (
    bucket_id = 'profile-pics' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own profile pictures"
  on storage.objects for delete
  using (
    bucket_id = 'profile-pics' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
