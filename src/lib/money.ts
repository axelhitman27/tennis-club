export const eur = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });

// Accepts "5", "5.5" or "5,50" and returns whole cents, or null if invalid.
export function parseCents(input: FormDataEntryValue | null): number | null {
  const n = Number(String(input ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
