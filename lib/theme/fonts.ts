import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";

// Curated, bundled (offline-safe) fonts institutions can pick from. Geist is the
// default and is already loaded in the root layout.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap" });

/** Applied to <html> so every font's CSS variable exists globally. */
export const fontVariableClasses = `${inter.variable} ${manrope.variable} ${plusJakarta.variable}`;

/** fontKey → the CSS variable to use for --font-sans. Keep keys in sync with Organization.FONT_KEYS. */
export const FONT_VARS: Record<string, string> = {
  geist: "var(--font-geist-sans)",
  inter: "var(--font-inter)",
  manrope: "var(--font-manrope)",
  "plus-jakarta": "var(--font-plus-jakarta)",
};
