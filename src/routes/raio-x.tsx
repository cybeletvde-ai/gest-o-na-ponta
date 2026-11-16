import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  PieChart,
  QrCode,
  ScanLine,
  ThumbsUp,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { PageShell } from "@/components/app/PageShell";
import { useFinance } from "@/lib/finance/store";
import { formatBRL } from "@/lib/finance/logic";
import {
  OUT_BUCKETS,
  PERIOD_LABEL,
  periodRange,
  raioX,
  type OutBucket,
  type Period,
} from "@/lib/finance/insights";
import { METHOD_LABEL, type Method } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/raio-x")({
  head: () => ({
    meta: [
      { title: "Raio-X — A saúde do seu negócio | Meu Negócio no Azul" },
      {
        name: "description",
        content: "Lucro real, para onde foi o dinheiro, campeões de venda e formas de pagamento.",
      },
      { property: "og:title", content: "Raio-X — A saúde do seu negócio | Meu Negócio no Azul" },
      {
        property: "og:description",
        content: "Lucro real, para onde foi o dinheiro, campeões de venda e formas de pagamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RaioXPage,
});

const periods = Object.keys(PERIOD_LABEL) as Period[];

const bucketColor: Record<OutBucket, string> = {
  materiais: "bg-chart-3",
  combustivel: "bg-warning",
  ferramentas: "bg-chart-2",
  contas_fixas: "bg-chart-4",
  impostos: "bg-chart-5",
  retirada: "bg-primary",
  outros: "bg-muted-foreground",
};

const methodIcon: Record<Method, LucideIcon> = {
  pix: QrCode,
  dinheiro: Banknote,
  credito: CreditCard,
  debito: Wallet,
};

function RaioXPage() {
  const { lancamentos, servicos } = useFinance();
  const [period, setPeriod] = useState<Period>("este_mes");
  const r = raioX(lancamentos, servicos, periodRange(period));

  return (
    <PageShell title="Raio-X" subtitle="A saúde do seu negócio" icon={ScanLine}>
      <div
        className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1"
        role="group"
        aria-label="Período"
      >
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
            className="h-10 rounded-xl text-[13px] font-bold text-muted-foreground transition-colors aria-pressed:bg-surface aria-pressed:text-primary aria-pressed:shadow-sm"
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <LucroCard r={r} />

        <Card icon={PieChart} title="Para onde foi meu dinheiro?">
          {r.custos + r.retiradas === 0 ? (
            <EmptyLine>Nenhuma saída neste período.</EmptyLine>
          ) : (
            <>
              <StackedBar
                parts={r.saidasPorCategoria.map((s) => ({ pct: s.pct, color: bucketColor[s.key] }))}
              />
              <ul className="mt-4 flex flex-col gap-3">
                {OUT_BUCKETS.map(({ key, label }) => {
                  const s = r.saidasPorCategoria.find((x) => x.key === key)!;
                  return (
                    <li key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn("size-2.5 rounded-full", bucketColor[key])} />
                        <span className="flex-1 font-semibold">{label}</span>
                        <span className="font-bold">{formatBRL(s.amount)}</span>
                        <span className="w-10 text-right text-xs font-bold text-muted-foreground">
                          {s.pct}%
                        </span>
                      </div>
                      <Bar pct={s.pct} className={bucketColor[key]} />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        <Card icon={Trophy} title="Campeões de Venda">
          {r.campeoes.length === 0 ? (
            <EmptyLine>Nenhuma venda neste período.</EmptyLine>
          ) : (
            <ol className="flex flex-col gap-2">
              {r.campeoes.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2.5">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                      i === 0 && "bg-warning text-warning-foreground",
                      i === 1 && "bg-secondary text-primary",
                      i === 2 && "bg-chart-4/25 text-warning-foreground",
                    )}
                    aria-label={`${i + 1}º lugar`}
                  >
                    {i + 1}º
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.sku && <span className="font-bold">#{c.sku} · </span>}
                      {c.count} {c.count === 1 ? "venda" : "vendas"}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-success">{formatBRL(c.total)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card icon={CreditCard} title="Formas de Pagamento">
          {r.faturamento === 0 ? (
            <EmptyLine>Nenhuma entrada neste período.</EmptyLine>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {r.pagamentos.map((p) => {
                const Icon = methodIcon[p.key];
                return (
                  <li key={p.key} className="rounded-2xl bg-muted p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Icon className="size-4" />
                      {METHOD_LABEL[p.key]}
                      <span className="ml-auto text-primary">{p.pct}%</span>
                    </div>
                    <p className="mt-1 text-base font-extrabold">{formatBRL(p.amount)}</p>
                    <Bar pct={p.pct} className="bg-success" track="mt-2 bg-surface" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function LucroCard({ r }: { r: ReturnType<typeof raioX> }) {
  const positive = r.resultado >= 0;
  const hasSales = r.faturamento > 0;
  return (
    <section
      aria-label="Termômetro de Lucro Real"
      className="rounded-3xl bg-surface p-5 shadow-action ring-1 ring-border/60"
    >
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Termômetro de Lucro Real
      </h2>
      <dl className="flex flex-col gap-2.5 text-sm">
        <Row label="Faturamento Total (Entrou)" value={`+ ${formatBRL(r.faturamento)}`} tone="text-success" />
        <Row label="Custos e Contas do Negócio (Saiu)" value={`− ${formatBRL(r.custos)}`} tone="text-destructive" />
        <Row label="Minhas Retiradas (Pró-labore)" value={`− ${formatBRL(r.retiradas)}`} tone="text-primary" />
      </dl>
      <div className="my-4 h-px bg-border" />
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Resultado Final (Lucro Livre no Caixa)
      </p>
      <p
        className={cn(
          "mt-1 text-4xl font-extrabold tracking-tight",
          positive ? "text-primary" : "text-destructive",
        )}
      >
        {formatBRL(r.resultado)}
      </p>

      {hasSales ? (
        <>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Margem de lucro"
            aria-valuenow={r.margem}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn("h-full rounded-full transition-all", positive ? "bg-success" : "bg-warning")}
              style={{ width: `${positive ? Math.min(r.margem, 100) : 100}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-bold",
              positive ? "bg-success/12 text-success" : "bg-warning/20 text-warning-foreground",
            )}
          >
            {positive ? (
              <ThumbsUp className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            )}
            {positive
              ? `Sua margem de lucro está em ${r.margem}% — Negócio no Azul!`
              : `Atenção: sua margem está em ${r.margem}% — saiu mais do que entrou.`}
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          Ainda não entrou dinheiro neste período. Registre uma entrada no{" "}
          <span className="font-bold text-success">+</span> para ver sua margem.
        </p>
      )}
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("shrink-0 font-extrabold", tone)}>{value}</dd>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border/60">
      <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold">
        <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bar({ pct, className, track }: { pct: number; className?: string; track?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", track)}>
      <div className={cn("h-full rounded-full", className)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StackedBar({ parts }: { parts: { pct: number; color: string }[] }) {
  return (
    <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
      {parts
        .filter((p) => p.pct > 0)
        .map((p, i) => (
          <div key={i} className={p.color} style={{ width: `${p.pct}%` }} />
        ))}
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">{children}</p>;
}
