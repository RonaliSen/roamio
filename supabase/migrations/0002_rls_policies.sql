alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_days enable row level security;
alter table activities enable row level security;
alter table budgets enable row level security;
alter table wardrobe_items enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table packing_items enable row level security;
alter table destinations enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- repeat this pattern for every table with a user_id column:
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trip_days" on trip_days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activities" on activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own budgets" on budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wardrobe" on wardrobe_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own outfits" on outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own packing" on packing_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfit_items" on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()))
  with check (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()));

create policy "destinations are public read" on destinations for select using (true);

-- auto-create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
