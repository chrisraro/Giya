-- Create function to increment exclusive offer usage count
create or replace function increment_exclusive_offer_usage(exclusive_offer_id uuid)
returns void as $$
begin
  update exclusive_offers 
  set used_count = used_count + 1
  where id = exclusive_offer_id;
end;
$$ language plpgsql;