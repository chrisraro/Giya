-- Add function to automatically set redeemed_at timestamp
create or replace function update_redeemed_at()
returns trigger
language plpgsql
as $$
begin
  new.redeemed_at = now();
  return new;
end;
$$;

-- Create trigger for setting redeemed_at timestamp
drop trigger if exists update_redeemed_at_trigger on public.redemptions;
create trigger update_redeemed_at_trigger
  before insert on public.redemptions
  for each row
  execute function update_redeemed_at();