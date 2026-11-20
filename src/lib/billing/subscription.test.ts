import { describe, expect, it } from "vitest";

import { accessFor, trialBannerText } from "./subscription";

const NOW = Date.parse("2026-11-18T12:00:00Z");
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("controle de assinatura", () => {
  it("status 'ativo' libera o acesso completo", () => {
    expect(accessFor({ status: "ativo", trialAte: iso(NOW - 30 * DAY) }, NOW)).toEqual({ kind: "ativo" });
  });

  it("'trial' com trial_ate no futuro libera e conta os dias restantes", () => {
    expect(accessFor({ status: "trial", trialAte: iso(NOW + 7 * DAY) }, NOW)).toEqual({ kind: "trial", daysLeft: 7 });
    expect(accessFor({ status: "trial", trialAte: iso(NOW + 2 * 3_600_000) }, NOW)).toEqual({ kind: "trial", daysLeft: 1 });
  });

  it("'trial' vencido bloqueia", () => {
    expect(accessFor({ status: "trial", trialAte: iso(NOW - 1000) }, NOW)).toEqual({ kind: "expirado", reason: "trial" });
  });

  it("'bloqueado' bloqueia mesmo dentro do teste", () => {
    expect(accessFor({ status: "bloqueado", trialAte: iso(NOW + 5 * DAY) }, NOW)).toEqual({ kind: "expirado", reason: "bloqueado" });
  });

  it("texto da faixa de teste", () => {
    expect(trialBannerText(5)).toBe("Período de teste grátis: restam 5 dias");
    expect(trialBannerText(1)).toBe("Período de teste grátis: resta 1 dia");
  });
});
