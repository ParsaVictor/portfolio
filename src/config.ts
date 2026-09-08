/**
 * ──────────────────────────────────────────────────────────────
 *  Identity & links — single source of truth.
 *  هویت و لینک‌ها — همه‌چیز را از همین‌جا عوض کن.
 * ──────────────────────────────────────────────────────────────
 */

export const identity = {
  nameEn: "Mohammad Parsa Karkooti",
  nameFa: "محمد پارسا کرکوتی",
  firstEn: "Parsa",
  lastEn: "Karkooti",
  firstFa: "پارسا",
  lastFa: "کرکوتی",
  handle: "@ParsaVictor",
  email: "1.parsa.karkooti@gmail.com",
  // Isfahan, Iran
  coords: { lat: 32.6539, lon: 51.666 },
  timezone: "Asia/Tehran",
};

export type Social = {
  key: string;
  labelEn: string;
  labelFa: string;
  href: string;
  handle: string;
};

export const socials: Social[] = [
  {
    key: "github",
    labelEn: "GitHub",
    labelFa: "گیت‌هاب",
    href: "https://github.com/ParsaVictor",
    handle: "github.com/ParsaVictor",
  },
  {
    key: "linkedin",
    labelEn: "LinkedIn",
    labelFa: "لینکدین",
    href: "https://www.linkedin.com/in/parsa-karkooti/",
    handle: "in/parsa-karkooti",
  },
  {
    key: "email",
    labelEn: "Email",
    labelFa: "ایمیل",
    href: "mailto:1.parsa.karkooti@gmail.com",
    handle: "1.parsa.karkooti@gmail.com",
  },
];

/** Scroll stages — each drives one particle shape + colour. */
export const STAGES = ["hero", "cv", "data", "web", "contact"] as const;
export type StageId = (typeof STAGES)[number];

/** Stage accent colours — the "cool → warm" journey. */
export const STAGE_COLORS: Record<StageId, string> = {
  hero: "#e9ecf5",
  cv: "#35e0ff",
  data: "#9d8cff",
  web: "#c8ff3e",
  contact: "#ff4d6d",
};
