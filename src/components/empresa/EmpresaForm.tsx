import { useState, type ComponentProps } from "react";
import { Building2, Loader2, LogOut, MapPin, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceGroup, Field, inputClass } from "@/components/app/forms/fields";
import { authActions } from "@/lib/auth/session";
import { profileActions } from "@/lib/finance/store";
import {
  formatPercent,
  maskCep,
  maskCnpj,
  maskPhone,
  onlyDigits,
  parsePercent,
} from "@/lib/business/format";
import { lookupCep, lookupCnpj } from "@/lib/business/lookup";
import { ENQUADRAMENTO_LABEL, type Enquadramento, type Profile } from "@/lib/business/types";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./SettingsCard";

type TextKey = Exclude<keyof Profile, "creditFee" | "debitFee" | "enquadramento">;

const enquadramentos = (Object.keys(ENQUADRAMENTO_LABEL) as Enquadramento[]).map((v) => ({
  value: v,
  label: ENQUADRAMENTO_LABEL[v],
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmpresaForm({ initial, isDemo }: { initial: Profile; isDemo: boolean }) {
  const [p, setP] = useState<Profile>(initial);
  const [creditFee, setCreditFee] = useState(formatPercent(initial.creditFee));
  const [debitFee, setDebitFee] = useState(formatPercent(initial.debitFee));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [busy, setBusy] = useState<null | "cnpj" | "cep" | "save" | "logout">(null);

  const update = (patch: Partial<Profile>) => setP((prev) => ({ ...prev, ...patch }));

  function text(key: TextKey, extra?: Partial<ComponentProps<typeof Input>>) {
    return (
      <Input
        id={`empresa-${key}`}
        className={inputClass}
        value={p[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        {...extra}
      />
    );
  }

  async function buscarCnpj() {
    setErrors((e) => ({ ...e, cnpj: undefined }));
    setBusy("cnpj");
    try {
      const data = await lookupCnpj(p.cnpj);
      update(data);
      toast.success("Dados do CNPJ preenchidos!", { description: data.razaoSocial });
    } catch (err) {
      setErrors((e) => ({ ...e, cnpj: err instanceof Error ? err.message : "Erro ao buscar." }));
    } finally {
      setBusy(null);
    }
  }

  async function onCep(raw: string) {
    const cep = maskCep(raw);
    update({ cep });
    setErrors((e) => ({ ...e, cep: undefined }));
    if (onlyDigits(cep).length !== 8) return;
    setBusy("cep");
    try {
      update(await lookupCep(cep));
    } catch (err) {
      setErrors((e) => ({ ...e, cep: err instanceof Error ? err.message : "Erro ao buscar." }));
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const e: Record<string, string> = {};
    const credit = parsePercent(creditFee);
    const debit = parsePercent(debitFee);
    if (credit === null) e.creditFee = "Use um número de 0 a 99,99.";
    if (debit === null) e.debitFee = "Use um número de 0 a 99,99.";
    if (!p.adminName.trim()) e.adminName = "Informe seu nome.";
    if (!p.nomeFantasia.trim()) e.nomeFantasia = "Informe o nome fantasia.";
    if (p.cnpj && onlyDigits(p.cnpj).length !== 14) e.cnpj = "CNPJ incompleto.";
    if (p.cep && onlyDigits(p.cep).length !== 8) e.cep = "CEP incompleto.";
    if (p.emailComercial && !EMAIL_RE.test(p.emailComercial.trim()))
      e.emailComercial = "E-mail inválido.";
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Confira os campos destacados.");
      return;
    }
    setBusy("save");
    const { ok } = await profileActions.save({
      ...p,
      creditFee: credit ?? 0,
      debitFee: debit ?? 0,
      uf: p.uf.trim().toUpperCase(),
    });
    setBusy(null);
    if (!ok) return toast.error("Não foi possível salvar. Tente novamente.");
    toast.success(isDemo ? "Salvo só nesta demonstração." : "Dados da empresa salvos!");
  }

  async function logout() {
    setBusy("logout");
    await authActions.signOut();
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        void save();
      }}
    >
      <SettingsCard
        id="card-admin"
        icon={UserRound}
        step={1}
        title="Administrador e Taxas"
        description="Quem cuida do negócio e as taxas da sua maquininha de cartão."
      >
        <Field label="Nome completo" htmlFor="empresa-adminName" error={errors.adminName}>
          {text("adminName", { autoComplete: "name" })}
        </Field>
        <Field label="E-mail" htmlFor="empresa-email">
          {text("email", { type: "email", readOnly: true, className: cn(inputClass, "bg-muted text-muted-foreground") })}
        </Field>
        <Field label="Celular / WhatsApp" htmlFor="empresa-phone">
          <Input
            id="empresa-phone"
            className={inputClass}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            value={p.phone}
            onChange={(e) => update({ phone: maskPhone(e.target.value) })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taxa de Crédito (%)" htmlFor="fee-credit" error={errors.creditFee}>
            <Input
              id="fee-credit"
              className={inputClass}
              inputMode="decimal"
              placeholder="Ex: 3,49"
              value={creditFee}
              onChange={(e) => setCreditFee(e.target.value)}
            />
          </Field>
          <Field label="Taxa de Débito (%)" htmlFor="fee-debit" error={errors.debitFee}>
            <Input
              id="fee-debit"
              className={inputClass}
              inputMode="decimal"
              placeholder="Ex: 1,49"
              value={debitFee}
              onChange={(e) => setDebitFee(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground text-pretty">
          Essas taxas são descontadas automaticamente das novas entradas pagas no cartão.
        </p>
      </SettingsCard>

      <SettingsCard
        id="card-fiscal"
        icon={Building2}
        step={2}
        title="Dados Fiscais da Empresa"
        description="Digite o CNPJ e toque em Buscar para preencher tudo automaticamente."
      >
        <Field label="CNPJ" htmlFor="empresa-cnpj" error={errors.cnpj}>
          <div className="flex gap-2">
            <Input
              id="empresa-cnpj"
              className={cn(inputClass, "min-w-0 flex-1 tabular-nums")}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={p.cnpj}
              onChange={(e) => update({ cnpj: maskCnpj(e.target.value) })}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 rounded-xl px-3 font-bold text-primary"
              disabled={busy === "cnpj"}
              onClick={() => void buscarCnpj()}
            >
              {busy === "cnpj" ? <Loader2 className="animate-spin" /> : <Search />}
              Buscar CNPJ
            </Button>
          </div>
        </Field>
        <Field label="Razão Social" htmlFor="empresa-razaoSocial">
          {text("razaoSocial")}
        </Field>
        <Field label="Nome Fantasia" htmlFor="empresa-nomeFantasia" error={errors.nomeFantasia}>
          {text("nomeFantasia", { autoComplete: "organization" })}
        </Field>
        <Field label="Enquadramento">
          <ChoiceGroup
            label="Enquadramento"
            options={enquadramentos}
            value={p.enquadramento || undefined}
            onChange={(v) => update({ enquadramento: v })}
          />
        </Field>
        <Field label="CNAE Principal" htmlFor="empresa-cnae">
          {text("cnae", { placeholder: "Ex: 9511-8/00 - Reparação de computadores" })}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inscrição Estadual (IE)" htmlFor="empresa-inscricaoEstadual">
            {text("inscricaoEstadual", { placeholder: "Isento" })}
          </Field>
          <Field label="Inscrição Municipal (IM)" htmlFor="empresa-inscricaoMunicipal">
            {text("inscricaoMunicipal")}
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        id="card-endereco"
        icon={MapPin}
        step={3}
        title="Endereço e Contato Comercial"
        description="Digite o CEP para buscar o endereço automaticamente."
      >
        <Field label="CEP" htmlFor="empresa-cep" error={errors.cep}>
          <div className="relative">
            <Input
              id="empresa-cep"
              className={cn(inputClass, "pr-10 tabular-nums")}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={p.cep}
              onChange={(e) => void onCep(e.target.value)}
            />
            {busy === "cep" && (
              <Loader2
                className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-label="Buscando endereço"
              />
            )}
          </div>
        </Field>
        <Field label="Logradouro" htmlFor="empresa-logradouro">
          {text("logradouro", { autoComplete: "address-line1" })}
        </Field>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Field label="Número" htmlFor="empresa-numero">
            {text("numero")}
          </Field>
          <Field label="Complemento" htmlFor="empresa-complemento">
            {text("complemento", { autoComplete: "address-line2" })}
          </Field>
        </div>
        <Field label="Bairro" htmlFor="empresa-bairro">
          {text("bairro")}
        </Field>
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field label="Cidade" htmlFor="empresa-cidade">
            {text("cidade", { autoComplete: "address-level2" })}
          </Field>
          <Field label="Estado (UF)" htmlFor="empresa-uf">
            <Input
              id="empresa-uf"
              className={cn(inputClass, "uppercase")}
              maxLength={2}
              autoComplete="address-level1"
              value={p.uf}
              onChange={(e) => update({ uf: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase() })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone" htmlFor="empresa-telefone">
            <Input
              id="empresa-telefone"
              className={inputClass}
              inputMode="tel"
              placeholder="(00) 0000-0000"
              value={p.telefone}
              onChange={(e) => update({ telefone: maskPhone(e.target.value) })}
            />
          </Field>
          <Field label="Celular" htmlFor="empresa-celular">
            <Input
              id="empresa-celular"
              className={inputClass}
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={p.celular}
              onChange={(e) => update({ celular: maskPhone(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="E-mail Comercial" htmlFor="empresa-emailComercial" error={errors.emailComercial}>
          {text("emailComercial", { type: "email", inputMode: "email", placeholder: "contato@empresa.com" })}
        </Field>
      </SettingsCard>

      <Button type="submit" variant="entrada" size="submit" disabled={busy === "save"}>
        {busy === "save" ? "Salvando..." : "Salvar Dados da Empresa"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 rounded-2xl border-destructive/40 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={busy === "logout"}
        onClick={() => void logout()}
      >
        <LogOut />
        {isDemo ? "Sair do Modo Demonstração" : "Sair da Conta (Logout)"}
      </Button>
    </form>
  );
}
