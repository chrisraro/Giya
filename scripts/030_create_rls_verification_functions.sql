-- Helper functions to verify RLS policies

-- Function to check if RLS is enabled for a table
create or replace function public.check_rls_status(table_name text)
returns table(enabled boolean)
language sql
security definer
as $$
  select row_security as enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = table_name
  and n.nspname = 'public';
$$;

-- Function to get policies for a table
create or replace function public.get_policies_for_table(table_name text)
returns table(
  policyname text,
  cmd text,
  qual text,
  with_check text
)
language sql
security definer
as $$
  select p.polname::text as policyname,
         p.polcmd::text as cmd,
         pg_get_expr(p.polqual, p.polrelid)::text as qual,
         pg_get_expr(p.polwithcheck, p.polrelid)::text as with_check
  from pg_policy p
  join pg_class c on p.polrelid = c.oid
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = table_name
  and n.nspname = 'public';
$$;