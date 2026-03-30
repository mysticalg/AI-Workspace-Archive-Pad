import type { Settings } from "types/settings";

export const FREE_PROJECT_LIMIT = 5;

export const hasPro = (settings: Settings) =>
  settings.billing.tier === "pro" || settings.billing.tier === "team";

export const hasTeam = (settings: Settings) => settings.billing.tier === "team";

