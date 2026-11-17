CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name text,
  email text,
  phone text,
  credit_fee numeric(5,2) NOT NULL DEFAULT 0,
  debit_fee numeric(5,2) NOT NULL DEFAULT 0,
  cnpj text,
  razao_social text,
  nome_fantasia text,
  enquadramento text,
  cnae text,
  inscricao_estadual text,
  inscricao_municipal text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  telefone text,
  celular text,
  email_comercial text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile: select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile: insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile: update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('entrada','saida','retirada')),
  amount bigint NOT NULL CHECK (amount >= 0),
  description text NOT NULL DEFAULT '',
  method text,
  category text,
  status text NOT NULL CHECK (status IN ('done','pending')),
  date date NOT NULL DEFAULT current_date,
  client_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lancamentos_user_idx ON public.lancamentos (user_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own lancamentos: select" ON public.lancamentos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own lancamentos: insert" ON public.lancamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own lancamentos: update" ON public.lancamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own lancamentos: delete" ON public.lancamentos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sku text NOT NULL,
  type text NOT NULL CHECK (type IN ('servico','produto')),
  name text NOT NULL,
  price bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
  cost bigint CHECK (cost IS NULL OR cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sku)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own servicos: select" ON public.servicos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own servicos: insert" ON public.servicos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own servicos: update" ON public.servicos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own servicos: delete" ON public.servicos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, admin_name, nome_fantasia)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'admin_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'nome_fantasia'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();