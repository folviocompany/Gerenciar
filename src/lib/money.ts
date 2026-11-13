/** Valores financeiros em centavos (inteiros), nunca em ponto flutuante. */

export function toCents(value: string | number | bigint | null | undefined): bigint {
  if (value === null || value === undefined || value === "") {
    return 0n;
  }

  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error("Valor monetário inválido: use centavos inteiros");
    }
    return BigInt(value);
  }

  if (!/^-?\d+$/.test(value.trim())) {
    throw new Error("Valor monetário inválido");
  }

  return BigInt(value.trim());
}

export function addCents(...values: Array<string | number | bigint | null | undefined>): bigint {
  return values.reduce<bigint>((total, value) => total + toCents(value), 0n);
}

export function subtractCents(
  left: string | number | bigint | null | undefined,
  right: string | number | bigint | null | undefined,
): bigint {
  return toCents(left) - toCents(right);
}

export function formatBRLFromCents(cents: string | number | bigint | null | undefined): string {
  const amount = toCents(cents);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / 100n;
  const fraction = absolute % 100n;
  const wholeFormatted = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formatted = `${wholeFormatted},${fraction.toString().padStart(2, "0")}`;

  return `${negative ? "-" : ""}R$ ${formatted}`;
}

export function parseBRLToCents(input: string): bigint {
  const normalized = input.trim().replace(/\s/g, "").replace(/^R\$/i, "").replace(/\./g, "");

  if (!normalized) {
    throw new Error("Informe um valor");
  }

  const match = /^(-)?(\d+)(?:,(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    throw new Error("Valor inválido");
  }

  const sign = match[1] ? -1n : 1n;
  const whole = BigInt(match[2]);
  const fraction = BigInt((match[3] ?? "0").padEnd(2, "0"));

  return sign * (whole * 100n + fraction);
}

export function shareAmountCents(totalCents: bigint, basisPoints: number): bigint {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) {
    throw new Error("Percentual de participação inválido");
  }

  return (totalCents * BigInt(basisPoints)) / 10000n;
}
