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

-- Garante que active existe, tem default true e nao aceita NULL. Em bases
-- antigas onde a coluna foi adicionada sem default, vendedores novos
-- entravam com active NULL e sumiam do /escolher-vendedor.
alter table public.sellers add column if not exists active boolean;
alter table public.sellers alter column active set default true;
update public.sellers set active = true where active is null;
alter table public.sellers alter column active set not null;

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

-- ---------- Meta geral da BU (leads, taxa de conversao, etc) ----------
create table if not exists public.bu_meta (
  bu text not null,
  year int not null check (year between 2024 and 2100),
  month int not null check (month between 1 and 12),
  leads_meta int not null default 0,
  taxa_conversao_meta numeric(5,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bu, year, month)
);
alter table public.bu_meta drop constraint if exists bu_meta_bu_check;
alter table public.bu_meta add constraint bu_meta_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));
alter table public.bu_meta add column if not exists taxa_conversao_meta numeric(5,2) not null default 0;

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
  cliente_nome text,
  observacao text,
  ligacao_status text not null default 'sem_ligacao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_seller_date_idx
  on public.sales(seller_id, sale_date);

-- migracao idempotente: nome do cliente na venda
alter table public.sales add column if not exists cliente_nome text;

-- migracao idempotente: tudo que ja existe vira 'sem_ligacao'
alter table public.sales add column if not exists ligacao_status text;
update public.sales set ligacao_status = 'sem_ligacao' where ligacao_status is null;
alter table public.sales alter column ligacao_status set default 'sem_ligacao';
alter table public.sales alter column ligacao_status set not null;
create index if not exists sales_ligacao_idx on public.sales(ligacao_status);

-- indicacao_status: 'feita_por_indicacao' ou 'sem_indicacao'
alter table public.sales add column if not exists indicacao_status text;
update public.sales set indicacao_status = 'sem_indicacao' where indicacao_status is null;
alter table public.sales alter column indicacao_status set default 'sem_indicacao';
alter table public.sales alter column indicacao_status set not null;
create index if not exists sales_indicacao_idx on public.sales(indicacao_status);

-- ---------- Vendas do canal DIRETO (site / direct response) ----------
-- Nao pertencem a nenhum vendedor. Sao lancadas pelo admin.
-- Contam no total de faturamento e por categoria do CPPEM, mas nao
-- passam por status de ligacao/indicacao/leads.
create table if not exists public.direct_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  product_line text not null,
  valor numeric(12,2) not null default 0,
  quantidade int not null default 1,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists direct_sales_date_idx on public.direct_sales(sale_date);

-- Visitas diarias do site (para calculo de conversao do canal direto)
create table if not exists public.direct_visits (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  qty int not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists direct_visits_date_idx on public.direct_visits(date);

-- RLS destas tabelas e ligado em supabase/enable-rls.sql (NAO desligar).

-- ---------- Metas de LONGO PRAZO (multi-mes) ----------
-- Ex.: "Meta de matriculas do Colegio de agosto/2026 a janeiro/2027".
-- A meta persiste independente do mes visualizado no dashboard. O
-- realizado = base_count (alunos ja matriculados antes do inicio) +
-- somatorio de quantidade das vendas dentro do periodo, filtrando por
-- product_line relevante da BU (matriculas). O dashboard sempre acumula
-- de start_year/start_month ate HOJE (nao respeita o filtro de mes).
create table if not exists public.long_term_goals (
  id uuid primary key default gen_random_uuid(),
  bu text not null check (bu in ('cppem','unicive','colegio_cppem')),
  label text not null,
  base_count int not null default 0,
  target int not null default 0,
  start_year int not null,
  start_month int not null check (start_month between 1 and 12),
  end_year int not null,
  end_month int not null check (end_month between 1 and 12),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists long_term_goals_bu_active_idx on public.long_term_goals(bu, active);

-- Seed: Meta de Matriculas 2027 do Colegio (127/350, ago/2026 -> jan/2027).
-- Idempotente: so insere se nao ja existir ativa pra colegio_cppem.
insert into public.long_term_goals
  (bu, label, base_count, target, start_year, start_month, end_year, end_month, active)
select 'colegio_cppem', 'Meta de Matriculas 2027', 127, 350, 2026, 8, 2027, 1, true
where not exists (
  select 1 from public.long_term_goals where bu = 'colegio_cppem' and active = true
);

-- ---------- Regras de Comissao / Gamificacao ----------
-- Regras por BU (min% pra ter comissao, bonus de podio coletivo, etc)
create table if not exists public.commission_rules (
  bu text primary key check (bu in ('cppem','unicive','colegio_cppem')),
  min_meta_pct numeric(5,2) not null default 80,
  cumulative boolean not null default false,
  bu_bonus_extra_pct numeric(5,2) not null default 10,
  top1_bonus numeric(10,2) not null default 300,
  top2_bonus numeric(10,2) not null default 200,
  top3_bonus numeric(10,2) not null default 100,
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.commission_rules drop constraint if exists commission_rules_bu_check;
alter table public.commission_rules add constraint commission_rules_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));

-- Tiers (linhas da tabela % Meta Ind -> % Comissao) por BU
create table if not exists public.commission_tiers (
  id uuid primary key default gen_random_uuid(),
  bu text not null check (bu in ('cppem','unicive','colegio_cppem')),
  meta_pct numeric(5,2) not null,
  commission_pct numeric(5,2) not null,
  unique (bu, meta_pct)
);
alter table public.commission_tiers drop constraint if exists commission_tiers_bu_check;
alter table public.commission_tiers add constraint commission_tiers_bu_check
  check (bu in ('cppem','unicive','colegio_cppem'));
create index if not exists commission_tiers_bu_idx on public.commission_tiers(bu, meta_pct);

-- Seed defaults conforme prints (idempotente via on conflict do nothing).
insert into public.commission_rules (bu, min_meta_pct, cumulative, bu_bonus_extra_pct, top1_bonus, top2_bonus, top3_bonus, notes) values
  ('cppem', 80, false, 10, 300, 200, 100, 'Comissao a partir de 80% da meta. Comissao = % vendida pelo vendedor.'),
  ('unicive', 80, false, 10, 300, 200, 100, 'Comissao nao acumulativa. % baseada na receita em matriculas do mes.'),
  ('colegio_cppem', 80, false, 10, 300, 200, 100, 'Mesmo modelo da UNICIVE por enquanto.')
on conflict (bu) do nothing;

-- CPPEM tiers
insert into public.commission_tiers (bu, meta_pct, commission_pct) values
  ('cppem', 80, 2),
  ('cppem', 90, 2.5),
  ('cppem', 100, 3),
  ('cppem', 110, 3.5),
  ('cppem', 120, 4)
on conflict (bu, meta_pct) do nothing;

-- UNICIVE tiers
insert into public.commission_tiers (bu, meta_pct, commission_pct) values
  ('unicive', 80, 6),
  ('unicive', 90, 8),
  ('unicive', 100, 11),
  ('unicive', 120, 14),
  ('unicive', 140, 16)
on conflict (bu, meta_pct) do nothing;

-- Colegio CPPEM: mesmo modelo temporario da UNICIVE
insert into public.commission_tiers (bu, meta_pct, commission_pct) values
  ('colegio_cppem', 80, 6),
  ('colegio_cppem', 90, 8),
  ('colegio_cppem', 100, 11),
  ('colegio_cppem', 120, 14),
  ('colegio_cppem', 140, 16)
on conflict (bu, meta_pct) do nothing;

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
-- IMPORTANTE: RLS DEVE ficar LIGADO. Rode supabase/enable-rls.sql.
-- A anon key e publica (NEXT_PUBLIC_) e, com RLS desligado, qualquer um
-- com a URL do projeto conseguiria ler/escrever direto no PostgREST,
-- contornando as rotas /api. Ligar RLS sem policies para anon/authenticated
-- bloqueia isso; so a service_role (usada no backend) acessa os dados.
-- (Ver supabase/enable-rls.sql para o comando completo.)
