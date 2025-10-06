-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile during setup

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
