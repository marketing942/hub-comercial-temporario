-- =====================================================================
-- Hub Comercial Temporario - Schema Supabase
-- Rodar no SQL Editor do Supabase do projeto.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Vendedores ----------
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bu text not null check (bu in ('cppem', 'unicive', 'colegio_cppem')),
  bus text[] not null default '{}',
  active boolean not null default true,
  avatar_color text not null default '#22c55e',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- atualiza check pra incluir colegio_cppem se ja existia
alter table public.sellers drop constraint if exists sellers_bu_check;
alter table public.sellers add constraint sellers_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));

-- migracao se ja existia sem avatar_url
alter table public.sellers add column if not exists avatar_url text;
-- multi-BU: array de BUs em que o vendedor atua
alter table public.sellers add column if not exists bus text[] not null default '{}';
update public.sellers set bus = array[bu]
  where coalesce(array_length(bus, 1), 0) = 0;

create index if not exists sellers_bu_idx on public.sellers(bu);
create index if not exists sellers_bus_idx on public.sellers using gin (bus);

-- ---------- Storage: bucket de avatares ----------
-- Criar o bucket 'avatars' como PUBLICO. Rodar uma vez.
-- (Se ja existir, o insert e ignorado.)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ---------- Metas por vendedor / mes ----------
-- ticket medio e taxa de conversao + meta total do vendedor
create table if not exists public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2024 and 2100),
  ticket_medio_meta numeric(12,2) not null default 0,
  taxa_conversao_meta numeric(5,2) not null default 0,
  valor_meta numeric(14,2) not null default 0,
  quantidade_meta int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, month, year)
);

-- migracoes idempotentes
alter table public.monthly_goals add column if not exists valor_meta numeric(14,2) not null default 0;
alter table public.monthly_goals add column if not exists quantidade_meta int not null default 0;
alter table public.monthly_goals add column if not exists leads_meta int not null default 0;

-- multi-BU: meta por (seller, bu, year, month) — vendedor multi-BU tem
-- entradas separadas por BU.
alter table public.monthly_goals add column if not exists bu text;
update public.monthly_goals mg set bu = s.bu
  from public.sellers s where s.id = mg.seller_id and (mg.bu is null or mg.bu = '');
alter table public.monthly_goals alter column bu set not null;
alter table public.monthly_goals drop constraint if exists monthly_goals_seller_id_month_year_key;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'monthly_goals_seller_bu_year_month_key'
  ) then
    alter table public.monthly_goals
      add constraint monthly_goals_seller_bu_year_month_key
      unique (seller_id, bu, year, month);
  end if;
end$$;

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

-- ---------- Metas POR LINHA DE PRODUTO DA BU ----------
-- (independente de vendedor — usado pelo dashboard de receita por categoria)
create table if not exists public.bu_product_goals (
  id uuid primary key default gen_random_uuid(),
  bu text not null check (bu in ('cppem','unicive','colegio_cppem')),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2024 and 2100),
  product_line text not null,
  valor_meta numeric(14,2) not null default 0,
  quantidade_meta int not null default 0,
  unique (bu, year, month, product_line)
);
alter table public.bu_product_goals drop constraint if exists bu_product_goals_bu_check;
alter table public.bu_product_goals add constraint bu_product_goals_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));
create index if not exists bu_product_goals_period_idx
  on public.bu_product_goals(bu, year, month);

-- ---------- Meta geral da BU (leads, etc) ----------
create table if not exists public.bu_meta (
  bu text not null,
  year int not null check (year between 2024 and 2100),
  month int not null check (month between 1 and 12),
  leads_meta int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bu, year, month)
);
alter table public.bu_meta drop constraint if exists bu_meta_bu_check;
alter table public.bu_meta add constraint bu_meta_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));

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
-- ligacao_status: 'consegui_direto', 'consegui_indireto', 'sem_ligacao'
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  sale_date date not null default current_date,
  product_line text not null,
  valor numeric(12,2) not null default 0,
  quantidade int not null default 1,
  observacao text,
  ligacao_status text not null default 'sem_ligacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_seller_date_idx
  on public.sales(seller_id, sale_date);

-- migracao idempotente: tudo que ja existe vira 'sem_ligacao'
alter table public.sales add column if not exists ligacao_status text;
update public.sales set ligacao_status = 'sem_ligacao' where ligacao_status is null;
alter table public.sales alter column ligacao_status set default 'sem_ligacao';
alter table public.sales alter column ligacao_status set not null;
create index if not exists sales_ligacao_idx on public.sales(ligacao_status);

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
