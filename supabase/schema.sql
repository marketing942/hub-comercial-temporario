-- =====================================================================
-- Hub Comercial Temporario - Schema Supabase
-- Rodar no SQL Editor do Supabase do projeto.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Vendedores ----------
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bu text not null check (bu in ('cppem', 'unicive')),
  active boolean not null default true,
  avatar_color text not null default '#7c5cff',
  created_at timestamptz not null default now()
);

create index if not exists sellers_bu_idx on public.sellers(bu);

-- ---------- Metas por vendedor / mes ----------
-- ticket medio e taxa de conversao
create table if not exists public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2024 and 2100),
  ticket_medio_meta numeric(12,2) not null default 0,
  taxa_conversao_meta numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, month, year)
);

-- ---------- Metas por linha de produto ----------
-- product_line para CPPEM: 'mentorias','cursos_digitais','fisicos',
--                          'turma_pmal','turma_pmpe','turma_carreiras'
-- product_line para UNICIVE: 'matriculas'
create table if not exists public.product_goals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2024 and 2100),
  product_line text not null,
  valor_meta numeric(14,2) not null default 0,
  quantidade_meta int not null default 0,
  unique (seller_id, month, year, product_line)
);

create index if not exists product_goals_seller_period_idx
  on public.product_goals(seller_id, year, month);

-- ---------- Leads recebidos por vendedor por dia ----------
create table if not exists public.daily_leads (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  date date not null,
  qty int not null default 0,
  unique (seller_id, date)
);

create index if not exists daily_leads_seller_date_idx
  on public.daily_leads(seller_id, date);

-- ---------- Vendas ----------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  sale_date date not null default current_date,
  product_line text not null,
  valor numeric(12,2) not null default 0,
  quantidade int not null default 1,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_seller_date_idx
  on public.sales(seller_id, sale_date);

-- ---------- Frases motivacionais ----------
create table if not exists public.motivational_quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author text
);

insert into public.motivational_quotes (text, author) values
  ('Disciplina vence motivacao todo dia da semana.', 'Anonimo'),
  ('Voce nao precisa ser extraordinario pra comecar, mas precisa comecar pra ser extraordinario.', 'Zig Ziglar'),
  ('Cada NAO te aproxima do proximo SIM.', 'Comercial CPPEM'),
  ('Meta sem prazo e so um desejo.', 'Anonimo'),
  ('O melhor vendedor e o que escuta mais e fala menos.', 'Anonimo'),
  ('Vendas e transferencia de confianca.', 'Anonimo'),
  ('Foco no processo, o resultado vem.', 'Anonimo'),
  ('Quem nao mede, nao melhora.', 'Peter Drucker'),
  ('Hoje e o melhor dia pra bater meta.', 'Comercial Unicive')
on conflict do nothing;

-- ---------- RLS ----------
-- Mantemos RLS desligado: o acesso a esse banco passa SOMENTE pelas
-- rotas /api do Next, que usam a service role. O front nunca fala direto
-- com o Supabase, entao podemos confiar nas chaves de acesso do app.
alter table public.sellers           disable row level security;
alter table public.monthly_goals     disable row level security;
alter table public.product_goals     disable row level security;
alter table public.daily_leads       disable row level security;
alter table public.sales             disable row level security;
alter table public.motivational_quotes disable row level security;
