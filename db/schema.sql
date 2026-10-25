create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  elevation_m integer default 0,
  boundary geometry(Polygon, 4326),
  created_at timestamptz not null default now()
);

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null,
  crop text not null,
  variety text,
  planted_at date,
  soil_texture text,
  root_depth_m numeric(4, 2),
  irrigation_system text,
  application_rate_mm_h numeric(5, 2),
  irrigation_efficiency numeric(4, 3),
  geometry geometry(Polygon, 4326) not null,
  area_ha numeric(10, 4) generated always as (
    st_area(geometry::geography) / 10000
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists plots_farm_id_idx on public.plots (farm_id);
create index if not exists plots_geometry_gix on public.plots using gist (geometry);

create table if not exists public.soil_tests (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots (id) on delete cascade,
  sampled_at date not null,
  ph numeric(3, 1),
  nitrogen_ppm numeric(6, 1),
  phosphorus_ppm numeric(6, 1),
  potassium_ppm numeric(6, 1),
  organic_matter_pct numeric(4, 2),
  ec_ds_m numeric(4, 2)
);

create table if not exists public.weather_days (
  id bigserial primary key,
  farm_id uuid not null references public.farms (id) on delete cascade,
  date date not null,
  t_max numeric(4, 1),
  t_min numeric(4, 1),
  humidity_pct numeric(5, 2),
  wind_ms numeric(4, 1),
  solar_mj_m2 numeric(5, 2),
  precip_mm numeric(5, 2),
  precip_prob_pct integer,
  et0_mm numeric(5, 2),
  unique (farm_id, date)
);

create table if not exists public.irrigation_events (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots (id) on delete cascade,
  started_at timestamptz not null,
  depth_mm numeric(6, 2),
  volume_m3 numeric(10, 2),
  source text default 'manual',
  notes text
);

-- Row level security: owners can only see their own farms and dependent rows.
alter table public.farms enable row level security;
alter table public.plots enable row level security;
alter table public.soil_tests enable row level security;
alter table public.weather_days enable row level security;
alter table public.irrigation_events enable row level security;

create policy "farms_owner" on public.farms
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "plots_owner" on public.plots
  for all using (
    exists (select 1 from public.farms f where f.id = plots.farm_id and f.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.farms f where f.id = plots.farm_id and f.owner_id = auth.uid())
  );

create policy "soil_tests_owner" on public.soil_tests
  for all using (
    exists (
      select 1 from public.plots p
      join public.farms f on f.id = p.farm_id
      where p.id = soil_tests.plot_id and f.owner_id = auth.uid()
    )
  );

create policy "weather_owner" on public.weather_days
  for all using (
    exists (select 1 from public.farms f where f.id = weather_days.farm_id and f.owner_id = auth.uid())
  );

create policy "irrigation_owner" on public.irrigation_events
  for all using (
    exists (
      select 1 from public.plots p
      join public.farms f on f.id = p.farm_id
      where p.id = irrigation_events.plot_id and f.owner_id = auth.uid()
    )
  );
