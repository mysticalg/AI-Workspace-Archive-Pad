import type { SupportedPlatform } from "./archive";

export type StorageMode = "local-only" | "sync-enabled";

export interface Settings {
  id: "settings";
  storageMode: StorageMode;
  enabledPlatforms: SupportedPlatform[];
  defaultProjectId?: string;
  defaultTags: string[];
  exportDefaults: {
    includeFrontmatter: boolean;
    includeRawSnapshot: boolean;
    pageBreakBetweenTurns: boolean;
  };
  billing: {
    tier: "free" | "pro" | "team";
    licenseState: "inactive" | "trial" | "active";
  };
  onboardingCompleted: boolean;
  upgradedAt?: string;
}

