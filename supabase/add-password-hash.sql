-- Rodar isso UMA VEZ no SQL Editor do Supabase pra habilitar a feature
-- de senha individual por vendedor.
--
-- E so UMA linha — totalmente idempotente. Rodar de novo nao quebra.
--
-- Depois disso:
--   1) Em /admin/sellers, clique na chavinha ao lado de cada vendedor
--      pra definir a senha inicial dele.
--   2) O vendedor consegue logar com a chave que voce definiu, e pode
--      trocar depois no proprio painel ("Mudar minha senha").
--   3) ADMIN_PASSWORD do env continua funcionando pro login do admin.

alter table public.sellers add column if not exists password_hash text;
