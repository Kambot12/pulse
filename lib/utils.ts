/** Tiny className joiner (avoids pulling in clsx/tailwind-merge). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Convert a Mongoose lean() doc into a plain, client-safe object. */
export function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
