export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function applyMask(digits: string, mask: string): string {
  let out = "";
  let i = 0;
  for (const ch of mask) {
    if (i >= digits.length) break;
    if (ch === "0") out += digits[i++];
    else out += ch;
  }
  return out;
}

/** 00.000.000/0000-00 */
export function maskCnpj(raw: string): string {
  return applyMask(onlyDigits(raw).slice(0, 14), "00.000.000/0000-00");
}

/** 00000-000 */
export function maskCep(raw: string): string {
  return applyMask(onlyDigits(raw).slice(0, 8), "00000-000");
}

/** (00) 0000-0000 ou (00) 00000-0000 */
export function maskPhone(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  return applyMask(d, d.length > 10 ? "(00) 00000-0000" : "(00) 0000-0000");
}

/** 4520001 → 4520-0/01 */
export function formatCnae(code: string | number): string {
  return applyMask(onlyDigits(String(code)).padStart(7, "0"), "0000-0/00");
}

/** "3,49" ou "3.49" → 3.49. Retorna null se inválido ou fora de 0–99,99. */
export function parsePercent(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return 0;
  if (!/^\d{1,2}(\.\d{0,2})?$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n < 100 ? n : null;
}

export function formatPercent(n: number): string {
  return n ? String(n).replace(".", ",") : "";
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "";
}
