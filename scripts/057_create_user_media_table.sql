-- Create user media table to store references to uploaded media files
create table if not exists public.user_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_type text not null check (user_type in ('customer', 'business', 'influencer')),
  media_url text not null,
  media_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_media enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own media" on public.user_media;
drop policy if exists "Users can insert their own media" on public.user_media;
drop policy if exists "Users can delete their own media" on public.user_media;

-- RLS policies
create policy "Users can view their own media"
  on public.user_media for select
  using (user_id = auth.uid());

create policy "Users can insert their own media"
  on public.user_media for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own media"
  on public.user_media for delete
  using (user_id = auth.uid());

-- Create indexes
create index if not exists idx_user_media_user_id on public.user_media(user_id);
create index if not exists idx_user_media_user_type on public.user_media(user_type);
create index if not exists idx_user_media_created_at on public.user_media(created_at);