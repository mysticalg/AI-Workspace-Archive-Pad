export function resolveEntitlements(tier: "free" | "pro" | "team") {
  if (tier === "team") {
    return {
      projects: "unlimited",
      sharedProjects: true,
      retentionControls: true,
    };
  }

  if (tier === "pro") {
    return {
      projects: "unlimited",
      sharedProjects: false,
      retentionControls: false,
    };
  }

  return {
    projects: 5,
    sharedProjects: false,
    retentionControls: false,
  };
}

