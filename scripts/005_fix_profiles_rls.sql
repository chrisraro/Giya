-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile during setup

-- Drop existing policy if it exists
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);