// The one thing that's meant to differ between deployments of this codebase for
// different clubs: a name and an accent color, both set via environment variables
// (see .env.example) so a new club never needs a code change, only a new .env.
const HEX = /^#[0-9a-fA-F]{6}$/;

export const CLUB_NAME = process.env.CLUB_NAME?.trim() || "Tennis Club";

export const BRAND_COLOR = HEX.test(process.env.CLUB_PRIMARY_COLOR ?? "")
  ? (process.env.CLUB_PRIMARY_COLOR as string)
  : "#15803d";

// Up to two letters for the icon/favicon monogram, e.g. "Παναθηναϊκός Τένις" -> "ΠΤ".
export function clubInitials(name: string = CLUB_NAME): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "TC";
}
