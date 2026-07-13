import { FONT_VARS } from "@/lib/theme/fonts";

const HEX = /^#[0-9a-f]{6}$/i;
const safe = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);

/**
 * Server-inlined per-institution theme. Overrides the design-token CSS variables
 * on :root so the brand paints on first render AND offline (the service worker
 * caches this HTML). Values are sanitized to hex to prevent CSS injection.
 */
export function ThemeStyle({
  brand,
  brandInk,
  accent,
  fontKey,
}: {
  brand: string;
  brandInk: string;
  accent: string;
  fontKey: string;
}) {
  const b = safe(brand, "#0ea5a4");
  const bi = safe(brandInk, "#0b6b6a");
  const a = safe(accent, "#6366f1");
  const fontVar = FONT_VARS[fontKey] ?? FONT_VARS.geist;
  const css = `:root{--brand:${b};--brand-ink:${bi};--accent:${a};--font-sans:${fontVar}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
