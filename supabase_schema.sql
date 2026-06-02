-- ============================================================
-- CSR Performance Dashboard — Supabase Schema
-- Paste this entire file into Supabase > SQL Editor > Run
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";


-- ── 1. TEAMS ────────────────────────────────────────────────
create table public.teams (
  id          uuid primary key default uuid_generate_v4(),
  team_name   text not null unique,          -- e.g. "Team Keljash"
  tl_email    text,                          -- links to auth.users email
  created_at  timestamptz default now()
);

-- Seed your five teams
insert into public.teams (team_name) values
  ('Team Keljash'),
  ('Team Pao'),
  ('Team Krizia'),
  ('Team Pikutin'),
  ('Team Artemis');


-- ── 2. CSR PROFILES ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key default uuid_generate_v4(),
  csr_name    text not null,
  team_id     uuid references public.teams(id) on delete set null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Seed your 16 CSRs
insert into public.profiles (csr_name, team_id) values
  ('Alliah Shannel Vizcarra', (select id from public.teams where team_name='Team Keljash')),
  ('Alphe Balakid',           (select id from public.teams where team_name='Team Keljash')),
  ('Raine Chavez',            (select id from public.teams where team_name='Team Keljash')),
  ('Cedric Josh Deniega',     (select id from public.teams where team_name='Team Pao')),
  ('Chynna Torno',            (select id from public.teams where team_name='Team Pao')),
  ('Razel Hila',              (select id from public.teams where team_name='Team Pao')),
  ('Ervin Escarda',           (select id from public.teams where team_name='Team Krizia')),
  ('Franzgian Castor',        (select id from public.teams where team_name='Team Krizia')),
  ('Rhea Mae Tugado',         (select id from public.teams where team_name='Team Krizia')),
  ('Jerald Byron Cepe',       (select id from public.teams where team_name='Team Pikutin')),
  ('Kate Valeizze Hope Pedarse', (select id from public.teams where team_name='Team Pikutin')),
  ('Venice Cuaton',           (select id from public.teams where team_name='Team Pikutin')),
  ('Lance Borlado',           (select id from public.teams where team_name='Team Artemis')),
  ('Princess Aleyah Borlado', (select id from public.teams where team_name='Team Artemis')),
  ('Rachel Hate',             (select id from public.teams where team_name='Team Artemis')),
  ('McGilbert Hitosis',       (select id from public.teams where team_name='Team Artemis'));


-- ── 3. WEEKLY SCORES ────────────────────────────────────────
create table public.weekly_scores (
  id                        uuid primary key default uuid_generate_v4(),
  csr_id                    uuid not null references public.profiles(id) on delete cascade,
  year                      smallint not null,
  quarter                   text not null check (quarter in ('Q1','Q2','Q3','Q4')),
  month                     text not null,
  week_number               smallint not null check (week_number between 1 and 6),

  -- Computed scores (TL enters raw KPIs; these can be calculated by a DB function)
  final_score               numeric(4,2) check (final_score between 0 and 5),
  kra_score_percent         smallint check (kra_score_percent between 0 and 100),
  kra_scale                 numeric(4,2) check (kra_scale between 0 and 5),
  behavioral_score_percent  smallint check (behavioral_score_percent between 0 and 100),
  behavioral_scale          numeric(4,2) check (behavioral_scale between 0 and 5),

  -- Customer KPIs
  followups_rmo             smallint check (followups_rmo between 0 and 100),
  verified_calls            smallint check (verified_calls between 0 and 100),

  -- Financial KPIs
  roas_performance          smallint check (roas_performance between 0 and 100),
  rts_compliance            smallint check (rts_compliance between 0 and 100),
  sales_encoding_accuracy   smallint check (sales_encoding_accuracy between 0 and 100),
  upsell_rate               smallint check (upsell_rate between 0 and 100),

  -- Business Process KPIs
  attendance_kpi            smallint check (attendance_kpi between 0 and 100),
  delivery_success_rate     smallint check (delivery_success_rate between 0 and 100),
  order_accuracy            smallint check (order_accuracy between 0 and 100),
  tagging_accuracy          smallint check (tagging_accuracy between 0 and 100),

  -- People Development KPIs
  esc_points                smallint,
  training_compliance       smallint check (training_compliance between 0 and 100),
  initiative_score          smallint check (initiative_score between 0 and 100),

  -- Performance Basis (raw counts)
  rts_percentage            smallint check (rts_percentage between 0 and 100),
  delivered_orders          smallint,
  returned_orders           smallint,
  for_return                smallint,
  conversion_roas           smallint check (conversion_roas between 0 and 100),

  -- KRA category breakdown
  business_process_score    smallint check (business_process_score between 0 and 100),
  customer_score            smallint check (customer_score between 0 and 100),
  people_development_score  smallint check (people_development_score between 0 and 100),
  financial_score           smallint check (financial_score between 0 and 100),

  -- Behavioral breakdown
  attendance_reliability    smallint check (attendance_reliability between 0 and 100),
  accountability_compliance smallint check (accountability_compliance between 0 and 100),
  initiative_adaptability   smallint check (initiative_adaptability between 0 and 100),
  extreme_self_care         smallint check (extreme_self_care between 0 and 100),

  -- TL notes
  weekly_insight            text,
  coaching_recommendation   text,
  tl_note                   text,
  coaching_status           text default 'Pending'
                            check (coaching_status in
                              ('On Track','Pending','Ongoing','Done',
                               'Improved','No Improvement','Escalated')),

  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),

  -- Prevent duplicate entries per CSR per week
  unique (csr_id, year, quarter, month, week_number)
);


-- ── 4. QA AUDITS ────────────────────────────────────────────
create table public.qa_audits (
  id                    uuid primary key default uuid_generate_v4(),
  csr_id                uuid not null references public.profiles(id) on delete cascade,
  chat_ref              text,
  week                  text not null,           -- "Week 1", "Week 2", etc.
  month                 text not null,
  year                  smallint not null default 2026,
  qa_score              smallint check (qa_score between 0 and 100),
  script_compliance     smallint check (script_compliance between 0 and 100),
  order_accuracy        smallint check (order_accuracy between 0 and 100),
  tone_score            smallint check (tone_score between 0 and 100),
  escalation_handling   smallint check (escalation_handling between 0 and 100),
  issue_found           text default 'None',
  coaching_needed       boolean default false,
  audited_by            text,
  audit_date            date,
  created_at            timestamptz default now()
);


-- ── 5. DAILY RECORDS ────────────────────────────────────────
create table public.daily_records (
  id                    uuid primary key default uuid_generate_v4(),
  csr_id                uuid not null references public.profiles(id) on delete cascade,
  record_date           date not null,
  conversations         smallint,
  orders_closed         smallint,
  conversion_rate       numeric(5,2),
  followups_completed   smallint,
  missed_followups      smallint default 0,
  frt                   text,                    -- "1m 20s" — store as text for flexibility
  art                   text,                    -- "4m 10s"
  backlog               smallint default 0,
  qa_flags              smallint default 0,
  tl_notes              text,
  created_at            timestamptz default now(),
  unique (csr_id, record_date)
);


-- ── 6. FOLLOW-UP TRACKER ────────────────────────────────────
create table public.followup_tracker (
  id                uuid primary key default uuid_generate_v4(),
  csr_id            uuid not null references public.profiles(id) on delete cascade,
  month             text not null,
  year              smallint not null default 2026,
  total_due         smallint,
  completed         smallint,
  missed            smallint,
  contact_rate      numeric(5,2),
  orders_recovered  smallint,
  revenue_recovered integer,
  created_at        timestamptz default now(),
  unique (csr_id, month, year)
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each TL can only read/write their own team's data.
-- Admin role bypasses all restrictions.
-- ============================================================

alter table public.teams              enable row level security;
alter table public.profiles           enable row level security;
alter table public.weekly_scores      enable row level security;
alter table public.qa_audits          enable row level security;
alter table public.daily_records      enable row level security;
alter table public.followup_tracker   enable row level security;

-- Helper: get the team_id for the currently logged-in TL
create or replace function public.my_team_id()
returns uuid language sql stable as $$
  select id from public.teams
  where tl_email = auth.jwt() ->> 'email'
  limit 1;
$$;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select (auth.jwt() ->> 'role') = 'admin';
$$;

-- TEAMS: TLs see only their own team; admin sees all
create policy "TL sees own team" on public.teams
  for select using (
    is_admin() or tl_email = auth.jwt() ->> 'email'
  );

-- PROFILES: TLs see only their team's CSRs
create policy "TL sees own team profiles" on public.profiles
  for all using (
    is_admin() or team_id = my_team_id()
  );

-- WEEKLY SCORES: TLs read/write only for their CSRs
create policy "TL manages own weekly scores" on public.weekly_scores
  for all using (
    is_admin() or csr_id in (
      select id from public.profiles where team_id = my_team_id()
    )
  );

-- QA AUDITS
create policy "TL manages own QA audits" on public.qa_audits
  for all using (
    is_admin() or csr_id in (
      select id from public.profiles where team_id = my_team_id()
    )
  );

-- DAILY RECORDS
create policy "TL manages own daily records" on public.daily_records
  for all using (
    is_admin() or csr_id in (
      select id from public.profiles where team_id = my_team_id()
    )
  );

-- FOLLOW-UP TRACKER
create policy "TL manages own followups" on public.followup_tracker
  for all using (
    is_admin() or csr_id in (
      select id from public.profiles where team_id = my_team_id()
    )
  );


-- ============================================================
-- AUTO-CALCULATE FINAL SCORE (DB function)
-- Called whenever a weekly_scores row is inserted or updated.
-- Formula: weighted average of KRA (70%) + Behavioral (30%)
-- scaled to 1.00–5.00.
-- ============================================================

create or replace function public.calc_final_score()
returns trigger language plpgsql as $$
declare
  kra_avg   numeric;
  beh_avg   numeric;
  raw_score numeric;
begin
  -- KRA average (Customer 25%, Financial 35%, Business Process 25%, People 15%)
  kra_avg := (
    coalesce(new.customer_score, 0)          * 0.25 +
    coalesce(new.financial_score, 0)         * 0.35 +
    coalesce(new.business_process_score, 0)  * 0.25 +
    coalesce(new.people_development_score, 0)* 0.15
  );

  -- Behavioral average (equal weight across 4 dimensions)
  beh_avg := (
    coalesce(new.attendance_reliability, 0)    +
    coalesce(new.accountability_compliance, 0) +
    coalesce(new.initiative_adaptability, 0)   +
    coalesce(new.extreme_self_care, 0)
  ) / 4.0;

  -- Combined raw score (0–100 range)
  raw_score := kra_avg * 0.70 + beh_avg * 0.30;

  -- Scale to 1.00–5.00
  new.final_score            := round(1 + (raw_score / 100.0) * 4, 2);
  new.kra_score_percent      := round(kra_avg);
  new.kra_scale              := round(1 + (kra_avg / 100.0) * 4, 2);
  new.behavioral_score_percent := round(beh_avg);
  new.behavioral_scale       := round(1 + (beh_avg / 100.0) * 4, 2);
  new.updated_at             := now();

  return new;
end;
$$;

create trigger trg_calc_final_score
  before insert or update on public.weekly_scores
  for each row execute function public.calc_final_score();


-- ============================================================
-- USEFUL VIEWS (pre-built queries for the dashboard)
-- ============================================================

-- Team averages view (used by Team Performance page)
create or replace view public.vw_team_averages as
select
  t.team_name,
  round(avg(ws.final_score), 2)             as avg_final_score,
  round(avg(ws.kra_scale), 2)               as avg_kra_scale,
  round(avg(ws.behavioral_scale), 2)        as avg_behavioral_scale,
  round(avg(ws.conversion_roas), 1)         as avg_conversion,
  round(avg(ws.delivery_success_rate), 1)   as avg_delivery,
  round(avg(ws.upsell_rate), 1)             as avg_upsell,
  count(distinct ws.csr_id)                 as csr_count,
  ws.year, ws.quarter, ws.month
from public.weekly_scores ws
join public.profiles p  on p.id = ws.csr_id
join public.teams t     on t.id = p.team_id
group by t.team_name, ws.year, ws.quarter, ws.month;

-- CSR ranking view (used by CSR Ranking page)
create or replace view public.vw_csr_ranking as
select
  p.id as csr_id,
  p.csr_name,
  t.team_name,
  round(avg(ws.final_score), 2)             as avg_final_score,
  round(avg(ws.kra_scale), 2)               as avg_kra_scale,
  round(avg(ws.behavioral_scale), 2)        as avg_behavioral_scale,
  round(avg(ws.conversion_roas), 1)         as avg_conversion,
  round(avg(ws.rmo_percent), 1)             as avg_rmo,         -- note: mapped from followups_rmo
  round(avg(ws.rts_compliance), 1)          as avg_rts,
  round(avg(ws.delivery_success_rate), 1)   as avg_delivery,
  round(avg(ws.upsell_rate), 1)             as avg_upsell,
  ws.year, ws.quarter
from public.weekly_scores ws
join public.profiles p on p.id = ws.csr_id
join public.teams t    on t.id = p.team_id
group by p.id, p.csr_name, t.team_name, ws.year, ws.quarter
order by avg_final_score desc;

-- QA missing audits view (flags CSRs with < 2 audits per week)
create or replace view public.vw_qa_missing as
select
  p.csr_name,
  t.team_name,
  qa.week,
  qa.month,
  qa.year,
  count(*) as audit_count
from public.qa_audits qa
join public.profiles p on p.id = qa.csr_id
join public.teams t    on t.id = p.team_id
group by p.csr_name, t.team_name, qa.week, qa.month, qa.year
having count(*) < 2;


-- ============================================================
-- Done. Your database is ready.
-- Next step: connect your React app using the Supabase JS client.
-- See deployment_steps.md for the full guide.
-- ============================================================
