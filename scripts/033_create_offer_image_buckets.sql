-- Create storage bucket for reward images
insert into storage.buckets (id, name, public)
values ('reward-images', 'reward-images', true)
on conflict (id) do nothing;

-- Create storage bucket for exclusive offer images
insert into storage.buckets (id, name, public)
values ('exclusive-offer-images', 'exclusive-offer-images', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Anyone can view reward images" on storage.objects;
drop policy if exists "Businesses can upload their own reward images" on storage.objects;
drop policy if exists "Businesses can update their own reward images" on storage.objects;
drop policy if exists "Businesses can delete their own reward images" on storage.objects;
drop policy if exists "Anyone can view exclusive offer images" on storage.objects;
drop policy if exists "Businesses can upload their own exclusive offer images" on storage.objects;
drop policy if exists "Businesses can update their own exclusive offer images" on storage.objects;
drop policy if exists "Businesses can delete their own exclusive offer images" on storage.objects;

-- Set up storage policies for reward images
create policy "Anyone can view reward images"
  on storage.objects for select
  using (bucket_id = 'reward-images');

create policy "Businesses can upload their own reward images"
  on storage.objects for insert
  with check (
    bucket_id = 'reward-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Businesses can update their own reward images"
  on storage.objects for update
  using (
    bucket_id = 'reward-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Businesses can delete their own reward images"
  on storage.objects for delete
  using (
    bucket_id = 'reward-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up storage policies for exclusive offer images
create policy "Anyone can view exclusive offer images"
  on storage.objects for select
  using (bucket_id = 'exclusive-offer-images');

create policy "Businesses can upload their own exclusive offer images"
  on storage.objects for insert
  with check (
    bucket_id = 'exclusive-offer-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Businesses can update their own exclusive offer images"
  on storage.objects for update
  using (
    bucket_id = 'exclusive-offer-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Businesses can delete their own exclusive offer images"
  on storage.objects for delete
  using (
    bucket_id = 'exclusive-offer-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );