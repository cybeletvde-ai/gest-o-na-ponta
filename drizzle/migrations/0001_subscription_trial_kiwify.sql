ALTER TABLE public.profiles
  ADD COLUMN status_assinatura text NOT NULL DEFAULT 'trial',
  ADD COLUMN trial_ate timestamptz NOT NULL DEFAULT (now() + interval '7 days');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_assinatura_check
  CHECK (status_assinatura IN ('trial', 'ativo', 'bloqueado'));

-- Usuários do app não podem mudar a própria assinatura; só o backend (webhook) muda.
CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status_assinatura := 'trial';
      NEW.trial_ate := now() + interval '7 days';
    ELSE
      NEW.status_assinatura := OLD.status_assinatura;
      NEW.trial_ate := OLD.trial_ate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_subscription
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_fields();

-- Chamado pelo webhook da Kiwify: acha a conta pelo e-mail de login do comprador.
CREATE OR REPLACE FUNCTION public.set_subscription_status_by_email(_email text, _status text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF _status NOT IN ('trial', 'ativo', 'bloqueado') THEN
    RAISE EXCEPTION 'invalid subscription status: %', _status;
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RETURN 0;
  END IF;
  UPDATE public.profiles p
     SET status_assinatura = _status,
         updated_at = now()
   WHERE p.id IN (
     SELECT u.id FROM auth.users u WHERE lower(u.email) = lower(trim(_email))
   );
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_subscription_status_by_email(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_status_by_email(text, text) TO service_role;