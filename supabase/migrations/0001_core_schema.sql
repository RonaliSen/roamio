create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country text not null,
  summary text not null,
  hero_image text not null,
  best_months int[] not null default '{}',
  style_tags text[] not null default '{}',
  daily_budget_low int not null,
  daily_budget_high int not null
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  destination_slug text not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  travelers int not null default 1,
  interests text[] not null default '{}',
  currency text not null default 'EUR',
  created_at timestamptz default now()
);

create table trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  day_index int not null,
  date date not null
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references trip_days on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  category text not null default 'sightseeing',
  start_time time,
  notes text,
  sort_order int not null default 0
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  accommodation int not null default 0,
  transport int not null default 0,
  food int not null default 0,
  activities int not null default 0,
  local_transport int not null default 0,
  shopping int not null default 0
);

create table wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null,
  image_url text,
  warmth int not null default 2,
  weight_grams int not null default 200
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trip_id uuid references trips on delete cascade,
  name text not null
);

create table outfit_items (
  outfit_id uuid not null references outfits on delete cascade,
  wardrobe_item_id uuid not null references wardrobe_items on delete cascade,
  primary key (outfit_id, wardrobe_item_id)
);

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null,
  packed boolean not null default false
);

create index on trips (user_id);
create index on trip_days (trip_id);
create index on activities (trip_day_id);
