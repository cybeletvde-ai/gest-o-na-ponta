import { describe, expect, it } from "vitest";
import { formatCnae, maskCep, maskCnpj, maskPhone, parsePercent } from "./format";

describe("máscaras da empresa", () => {
  it("CNPJ 00.000.000/0000-00", () => {
    expect(maskCnpj("19131243000197")).toBe("19.131.243/0001-97");
    expect(maskCnpj("1913")).toBe("19.13");
    expect(maskCnpj("19.131.243/0001-97999")).toBe("19.131.243/0001-97");
  });

  it("CEP 00000-000", () => {
    expect(maskCep("01310100")).toBe("01310-100");
  });

  it("telefone fixo e celular", () => {
    expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    expect(maskPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("CNAE 0000-0/00", () => {
    expect(formatCnae(4520001)).toBe("4520-0/01");
  });

  it("taxa aceita vírgula e recusa valores inválidos", () => {
    expect(parsePercent("3,49")).toBe(3.49);
    expect(parsePercent("")).toBe(0);
    expect(parsePercent("100")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
  });
});
