import { useEffect, useState } from "react";
import { MoreVertical, Share, Smartphone, SquarePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";

const KEY = "meu-negocio:install-card-dismissed";
type Platform = "android" | "iphone";

const steps: Record<Platform, { icon: typeof Share; text: string }[]> = {
  android: [
    { icon: MoreVertical, text: "No Chrome, toque nos 3 pontinhos ⋮ no canto de cima." },
    { icon: SquarePlus, text: "Toque em \"Instalar app\" ou \"Adicionar à tela inicial\"." },
  ],
  iphone: [
    { icon: Share, text: "No Safari, toque no botão Compartilhar (quadrado com seta)." },
    { icon: SquarePlus, text: "Toque em \"Adicionar à Tela de Início\" e depois em Adicionar." },
  ],
};

/** Cartão dispensável que ensina a pôr o ícone na tela inicial. Some se o app já estiver instalado. */
export function InstallAppCard() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("android");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === "1";
    } catch {
      /* modo privado */
    }
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setPlatform("iphone");
    setVisible(!standalone && !dismissed);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* modo privado */
    }
  }

  return (
    <section
      aria-labelledby="install-title"
      className="relative mt-4 rounded-3xl border border-border bg-surface p-4"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-center gap-2 pr-8">
        <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
          <Smartphone className="size-4" />
        </span>
        <h2 id="install-title" className="text-sm font-extrabold">
          Instalar App no Celular
        </h2>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Celular">
        {(["android", "iphone"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={platform === p}
            onClick={() => setPlatform(p)}
            className={cn(
              "h-8 rounded-lg text-xs font-bold transition-colors",
              platform === p ? "bg-surface text-primary shadow-sm" : "text-muted-foreground",
            )}
          >
            {p === "android" ? "Android" : "iPhone"}
          </button>
        ))}
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {steps[platform].map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-xs font-extrabold text-success-foreground">
              {i + 1}
            </span>
            <span className="flex-1 text-pretty">{s.text}</span>
            <s.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}
