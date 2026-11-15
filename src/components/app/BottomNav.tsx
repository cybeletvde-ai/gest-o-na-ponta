import { Link } from "@tanstack/react-router";
import { Home, Wallet, Wrench, ScanLine, Plus, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuickActionsSheet } from "./QuickActionsSheet";
import { quickActions } from "@/lib/ui/quick-actions";
import { cn } from "@/lib/utils";

type Tab = { to: "/" | "/caixa" | "/servicos" | "/raio-x"; label: string; icon: LucideIcon };

const leftTabs: Tab[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/caixa", label: "Caixa", icon: Wallet },
];
const rightTabs: Tab[] = [
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/raio-x", label: "Raio-X", icon: ScanLine },
];

function TabLink({ tab }: { tab: Tab }) {
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      activeOptions={{ exact: tab.to === "/" }}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "size-6 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span
            className={cn(
              "text-[11px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </span>
        </>
      )}
    </Link>
  );
}

export function BottomNav() {
  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface shadow-bar pb-safe"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
          {leftTabs.map((t) => (
            <TabLink key={t.to} tab={t} />
          ))}
          <div className="relative flex w-20 shrink-0 justify-center">
            <Button
              variant="fab"
              size="fab"
              aria-label="Novo lançamento"
              onClick={quickActions.open}
              className="absolute -top-7"
            >
              <Plus strokeWidth={3} />
            </Button>
          </div>
          {rightTabs.map((t) => (
            <TabLink key={t.to} tab={t} />
          ))}
        </div>
      </nav>
      <QuickActionsSheet />
    </>
  );
}
