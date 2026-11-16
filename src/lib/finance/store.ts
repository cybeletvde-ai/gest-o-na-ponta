import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { getSupabase } from "@/lib/supabase/client";
import { EMPTY_PROFILE, PROFILE_COLUMNS, type Profile } from "@/lib/business/types";
import * as logic from "./logic";
import type { FinanceState, Lancamento, Servico } from "./types";

// Contas reais: dados no Supabase (RLS por usuário). Modo Demonstração: só em memória.
type Mode = "none" | "user" | "demo";

interface Snapshot {
  finance: FinanceState;
  profile: Profile;
  ready: boolean;
  mode: Mode;
}

const EMPTY: FinanceState = { lancamentos: [], servicos: [] };
const SERVER: Snapshot = { finance: EMPTY, profile: EMPTY_PROFILE, ready: false, mode: "none" };

let snap: Snapshot = SERVER;
let userId: string | null = null;
let loadToken = 0;
const listeners = new Set<() => void>();

function set(next: Partial<Snapshot>) {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
}

function setFinance(finance: FinanceState) {
  set({ finance });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function useSnapshot() {
  return useSyncExternalStore(subscribe, () => snap, () => SERVER);
}

export function useFinance(): FinanceState & { ready: boolean } {
  const s = useSnapshot();
  return { ...s.finance, ready: s.ready };
}

export function useProfile(): { profile: Profile; ready: boolean; isDemo: boolean } {
  const s = useSnapshot();
  return { profile: s.profile, ready: s.ready, isDemo: s.mode === "demo" };
}

/* ---------- Linhas do banco ↔ app ---------- */

interface LancamentoRow {
  id: string;
  kind: Lancamento["kind"];
  amount: number;
  description: string;
  method: Lancamento["method"] | null;
  category: Lancamento["category"] | null;
  status: Lancamento["status"];
  date: string;
  client_name: string | null;
  created_at: string;
}

interface ServicoRow {
  id: string;
  sku: string;
  type: Servico["type"];
  name: string;
  price: number;
  cost: number | null;
}

function fromLancamentoRow(r: LancamentoRow): Lancamento {
  return {
    id: r.id,
    kind: r.kind,
    amount: Number(r.amount),
    description: r.description,
    method: r.method ?? undefined,
    category: r.category ?? undefined,
    status: r.status,
    date: r.date,
    clientName: r.client_name ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function toLancamentoRow(l: Lancamento) {
  return {
    id: l.id,
    user_id: userId,
    kind: l.kind,
    amount: l.amount,
    description: l.description,
    method: l.method ?? null,
    category: l.category ?? null,
    status: l.status,
    date: l.date,
    client_name: l.clientName ?? null,
    created_at: new Date(l.createdAt).toISOString(),
  };
}

function fromServicoRow(r: ServicoRow): Servico {
  return {
    id: r.id,
    sku: r.sku,
    type: r.type,
    name: r.name,
    price: Number(r.price),
    cost: r.cost == null ? undefined : Number(r.cost),
  };
}

function fromProfileRow(row: Record<string, unknown> | null): Profile {
  const p: Profile = { ...EMPTY_PROFILE };
  if (!row) return p;
  for (const [key, col] of Object.entries(PROFILE_COLUMNS) as [keyof Profile, string][]) {
    const v = row[col];
    if (v == null) continue;
    if (key === "creditFee" || key === "debitFee") p[key] = Number(v);
    else (p as unknown as Record<string, unknown>)[key] = String(v);
  }
  return p;
}

function toProfileRow(p: Profile) {
  const row: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(PROFILE_COLUMNS) as [keyof Profile, string][]) {
    const v = p[key];
    row[col] = typeof v === "string" ? v.trim() || null : v;
  }
  return row;
}

/* ---------- Carregamento por sessão ---------- */

export async function loadForUser(id: string, email: string | undefined) {
  const token = ++loadToken;
  userId = id;
  set({ finance: EMPTY, profile: { ...EMPTY_PROFILE, email: email ?? "" }, ready: false, mode: "user" });
  const sb = getSupabase();
  const [lanc, serv, prof] = await Promise.all([
    sb
      .from("lancamentos")
      .select("id, kind, amount, description, method, category, status, date, client_name, created_at"),
    sb.from("servicos").select("id, sku, type, name, price, cost").order("sku"),
    sb.from("profiles").select(Object.values(PROFILE_COLUMNS).join(", ")).eq("id", id).maybeSingle(),
  ]);
  if (token !== loadToken) return;
  if (lanc.error || serv.error || prof.error) {
    toast.error("Não foi possível carregar seus dados. Verifique sua conexão.");
  }
  const profile = fromProfileRow(prof.data as Record<string, unknown> | null);
  if (!profile.email && email) profile.email = email;
  set({
    finance: {
      lancamentos: ((lanc.data ?? []) as LancamentoRow[]).map(fromLancamentoRow),
      servicos: ((serv.data ?? []) as ServicoRow[]).map(fromServicoRow),
    },
    profile,
    ready: true,
  });
}

export function loadDemo() {
  ++loadToken;
  userId = null;
  set({
    finance: logic.seedState(),
    profile: {
      ...EMPTY_PROFILE,
      adminName: "Ana Demonstração",
      email: "demo@meunegocionoazul.app",
      nomeFantasia: "Negócio Exemplo",
      enquadramento: "mei",
      creditFee: 3.49,
      debitFee: 1.49,
    },
    ready: true,
    mode: "demo",
  });
}

export function clearData() {
  ++loadToken;
  userId = null;
  set(SERVER);
}

/* ---------- Gravação (otimista, com desfazer em caso de erro) ---------- */

function persist(run: () => PromiseLike<{ error: unknown }>, rollback: FinanceState) {
  if (snap.mode !== "user") return;
  run().then(({ error }) => {
    if (!error) return;
    setFinance(rollback);
    toast.error("Não foi possível salvar. Verifique sua conexão e tente de novo.");
  });
}

function newId() {
  return crypto.randomUUID();
}

export const financeActions = {
  add(item: Omit<Lancamento, "id" | "createdAt">) {
    const prev = snap.finance;
    const full: Lancamento = { ...item, id: newId(), createdAt: Date.now() };
    setFinance(logic.add(prev, full));
    persist(() => getSupabase().from("lancamentos").insert(toLancamentoRow(full)), prev);
  },
  remove(id: string) {
    const prev = snap.finance;
    setFinance(logic.remove(prev, id));
    persist(() => getSupabase().from("lancamentos").delete().eq("id", id), prev);
  },
  settle(id: string) {
    const prev = snap.finance;
    const next = logic.settle(prev, id);
    setFinance(next);
    const settled = next.lancamentos.find((l) => l.id === id);
    if (settled)
      persist(
        () =>
          getSupabase()
            .from("lancamentos")
            .update({ status: settled.status, date: settled.date })
            .eq("id", id),
        prev,
      );
  },
  saveItem(item: Omit<Servico, "id" | "sku"> & { id?: string | undefined; sku: string }) {
    const prev = snap.finance;
    const sku = logic.normalizeSku(item.sku) || logic.nextSku(prev.servicos);
    const full: Servico = { ...item, id: item.id ?? newId(), sku };
    setFinance(logic.upsertItem(prev, full));
    persist(
      () =>
        getSupabase()
          .from("servicos")
          .upsert({
            id: full.id,
            user_id: userId,
            sku: full.sku,
            type: full.type,
            name: full.name,
            price: full.price,
            cost: full.cost ?? null,
          }),
      prev,
    );
    return sku;
  },
  removeItem(id: string) {
    const prev = snap.finance;
    setFinance(logic.removeItem(prev, id));
    persist(() => getSupabase().from("servicos").delete().eq("id", id), prev);
  },
};

export const profileActions = {
  /** Salva os dados da empresa. No Modo Demonstração fica só na memória. */
  async save(profile: Profile): Promise<{ ok: boolean }> {
    const prev = snap.profile;
    set({ profile });
    if (snap.mode !== "user" || !userId) return { ok: true };
    const { error } = await getSupabase()
      .from("profiles")
      .upsert({ id: userId, ...toProfileRow(profile), updated_at: new Date().toISOString() });
    if (error) {
      set({ profile: prev });
      return { ok: false };
    }
    return { ok: true };
  },
};
