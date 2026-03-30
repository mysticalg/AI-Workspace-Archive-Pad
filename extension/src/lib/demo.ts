import { db } from "db/dexie";
import type { ArchiveMessage, ArchiveRecord, SupportedPlatform } from "types/archive";
import type { Project } from "types/project";
import type { Settings } from "types/settings";
import type { Snippet } from "types/snippet";

export interface DemoPageStatus {
  supported: boolean;
  supportedUrl: boolean;
  captureReady: boolean;
  enabled: boolean;
  permissionGranted: boolean;
  platform: SupportedPlatform;
  title: string;
  hasSelection: boolean;
  reason: string;
}

const TIMESTAMPS = {
  created: "2026-03-21T09:30:00.000Z",
  updated: "2026-03-29T15:45:00.000Z",
  recent: "2026-03-29T16:15:00.000Z",
  previous: "2026-03-28T12:10:00.000Z",
  research: "2026-03-27T10:45:00.000Z",
  client: "2026-03-26T14:20:00.000Z",
  export: "2026-03-29T16:20:00.000Z",
};

function textMessage(id: string, role: ArchiveMessage["role"], text: string): ArchiveMessage {
  return {
    id,
    role,
    contentBlocks: [{ type: "text", text }],
  };
}

export function isDemoMode() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
}

export function getDemoPageStatus(): DemoPageStatus {
  return {
    supported: true,
    supportedUrl: true,
    captureReady: true,
    enabled: true,
    permissionGranted: true,
    platform: "chatgpt",
    title: "Launch pricing matrix and store positioning",
    hasSelection: true,
    reason: "Demo workspace ready. Capture actions reflect the shipped UI without requiring a live account.",
  };
}

const demoPermissionStatuses: Record<SupportedPlatform, boolean> = {
  chatgpt: true,
  claude: true,
  gemini: false,
  perplexity: true,
  copilot: false,
  other: false,
};

export function getDemoPermissionStatuses(platforms: SupportedPlatform[]) {
  return Object.fromEntries(
    platforms.map((platform) => [platform, demoPermissionStatuses[platform] ?? false]),
  ) as Record<SupportedPlatform, boolean>;
}

const DEMO_SETTINGS: Settings = {
  id: "settings",
  storageMode: "local-only",
  enabledPlatforms: ["chatgpt", "claude", "gemini", "perplexity"],
  defaultProjectId: "project_launch_ops",
  defaultTags: ["archive", "launch"],
  exportDefaults: {
    includeFrontmatter: true,
    includeRawSnapshot: false,
    pageBreakBetweenTurns: true,
  },
  billing: {
    tier: "pro",
    licenseState: "trial",
  },
  onboardingCompleted: true,
  upgradedAt: TIMESTAMPS.created,
};

const DEMO_PROJECTS: Project[] = [
  {
    id: "project_launch_ops",
    title: "Launch Ops",
    description: "Chrome Web Store launch, pricing checks, and release messaging.",
    tags: ["launch", "store", "pricing"],
    status: "active",
    color: "#2f6df6",
    createdAt: TIMESTAMPS.created,
    updatedAt: TIMESTAMPS.updated,
    exportHistory: [
      {
        id: "project_export_launch_pdf",
        projectId: "project_launch_ops",
        format: "pdf",
        createdAt: TIMESTAMPS.export,
        recordIds: ["record_launch_pricing", "record_launch_research"],
      },
    ],
  },
  {
    id: "project_client_workbench",
    title: "Client Workbench",
    description: "Reusable prompts, delivery notes, and exported client-facing drafts.",
    tags: ["client", "delivery"],
    status: "approved",
    color: "#16a085",
    createdAt: "2026-03-18T08:15:00.000Z",
    updatedAt: TIMESTAMPS.client,
    exportHistory: [],
  },
  {
    id: "project_research_vault",
    title: "Research Vault",
    description: "Competitive scans, citations, and synthesis captured across models.",
    tags: ["research", "sources"],
    status: "draft",
    color: "#f4a942",
    createdAt: "2026-03-14T11:00:00.000Z",
    updatedAt: TIMESTAMPS.research,
    exportHistory: [],
  },
];

const DEMO_RECORDS: ArchiveRecord[] = [
  {
    id: "record_launch_pricing",
    projectId: "project_launch_ops",
    platform: "chatgpt",
    sourceUrl: "https://chatgpt.com/c/demo-launch-pricing",
    sourceTitle: "Launch pricing matrix and store positioning",
    sourceAccountLabel: "demo@workspace.archive",
    capturedAt: TIMESTAMPS.recent,
    originalCreatedAt: TIMESTAMPS.recent,
    originalUpdatedAt: TIMESTAMPS.recent,
    modelName: "GPT-5.4",
    messages: [
      textMessage(
        "msg_launch_user",
        "user",
        "Draft a pricing matrix for a Chrome extension that archives visible AI chats locally.",
      ),
      textMessage(
        "msg_launch_assistant",
        "assistant",
        "Position the free tier around local-only capture, and reserve batch export plus sync for paid plans.",
      ),
    ],
    attachments: [],
    tags: ["launch", "pricing", "store"],
    notes: "Use this record as the main source for pricing copy and store screenshots.",
    summary: "Pricing matrix, tier boundaries, and positioning language for launch week.",
    cleanText:
      "Draft a pricing matrix for a Chrome extension that archives visible AI chats locally. Position the free tier around local-only capture, and reserve batch export plus sync for paid plans.",
    rawSnapshotHtml: "<article>Demo launch pricing conversation</article>",
    dedupeHash: "demo-dedupe-launch-pricing",
    exportCount: 2,
    exportHistory: [
      {
        id: "record_export_launch_md",
        format: "markdown",
        createdAt: TIMESTAMPS.previous,
      },
      {
        id: "record_export_launch_pdf",
        format: "pdf",
        createdAt: TIMESTAMPS.export,
      },
    ],
    isFallbackCapture: false,
  },
  {
    id: "record_launch_research",
    projectId: "project_launch_ops",
    platform: "perplexity",
    sourceUrl: "https://www.perplexity.ai/search/demo-competitive-scan",
    sourceTitle: "Competitive scan for AI knowledge tools",
    sourceAccountLabel: "demo@workspace.archive",
    capturedAt: TIMESTAMPS.previous,
    originalCreatedAt: TIMESTAMPS.previous,
    originalUpdatedAt: TIMESTAMPS.previous,
    modelName: "Sonar Large",
    messages: [
      textMessage(
        "msg_research_user",
        "user",
        "Summarize the strongest differentiators for a local-first AI archive extension.",
      ),
      textMessage(
        "msg_research_assistant",
        "assistant",
        "Permission gating, export portability, and project structure are clearer differentiators than generic chat history search.",
      ),
    ],
    attachments: [],
    tags: ["research", "positioning"],
    notes: "Cross-check against store copy before submitting.",
    summary: "Differentiators focused on local storage, explicit permissions, and clean export.",
    cleanText:
      "Summarize the strongest differentiators for a local-first AI archive extension. Permission gating, export portability, and project structure are clearer differentiators than generic chat history search.",
    rawSnapshotHtml: "<article>Demo competitive scan conversation</article>",
    dedupeHash: "demo-dedupe-launch-research",
    exportCount: 1,
    exportHistory: [
      {
        id: "record_export_research_json",
        format: "json",
        createdAt: TIMESTAMPS.export,
      },
    ],
    isFallbackCapture: false,
  },
  {
    id: "record_client_brief",
    projectId: "project_client_workbench",
    platform: "claude",
    sourceUrl: "https://claude.ai/chat/demo-client-brief",
    sourceAccountLabel: "demo@workspace.archive",
    sourceTitle: "Client workshop facilitation brief",
    capturedAt: TIMESTAMPS.client,
    originalCreatedAt: TIMESTAMPS.client,
    originalUpdatedAt: TIMESTAMPS.client,
    modelName: "Claude Sonnet 4.5",
    messages: [
      textMessage(
        "msg_client_user",
        "user",
        "Turn this discovery call into a workshop brief with risks, owners, and open questions.",
      ),
      textMessage(
        "msg_client_assistant",
        "assistant",
        "Here is a concise brief organized by delivery milestones, known blockers, and next approvals.",
      ),
    ],
    attachments: [],
    tags: ["client", "brief"],
    notes: "Good screenshot candidate because it shows a client-facing workflow.",
    summary: "Workshop brief with owners, blockers, and next approvals.",
    cleanText:
      "Turn this discovery call into a workshop brief with risks, owners, and open questions. Here is a concise brief organized by delivery milestones, known blockers, and next approvals.",
    rawSnapshotHtml: "<article>Demo client brief conversation</article>",
    dedupeHash: "demo-dedupe-client-brief",
    exportCount: 1,
    exportHistory: [
      {
        id: "record_export_client_docx",
        format: "docx",
        createdAt: TIMESTAMPS.client,
      },
    ],
    isFallbackCapture: false,
  },
  {
    id: "record_research_notes",
    projectId: "project_research_vault",
    platform: "gemini",
    sourceUrl: "https://gemini.google.com/app/demo-research-synthesis",
    sourceTitle: "Research synthesis with source notes",
    sourceAccountLabel: "demo@workspace.archive",
    capturedAt: TIMESTAMPS.research,
    originalCreatedAt: TIMESTAMPS.research,
    originalUpdatedAt: TIMESTAMPS.research,
    modelName: "Gemini 2.5 Pro",
    messages: [
      textMessage(
        "msg_gemini_user",
        "user",
        "Condense these linked notes into three arguments with direct citation reminders.",
      ),
      textMessage(
        "msg_gemini_assistant",
        "assistant",
        "The synthesis prioritizes reviewer trust, explicit source mapping, and high-signal summary blocks.",
      ),
    ],
    attachments: [],
    tags: ["research", "citations"],
    notes: "Capture used for search demo.",
    summary: "Three research arguments with citation reminders and source mapping.",
    cleanText:
      "Condense these linked notes into three arguments with direct citation reminders. The synthesis prioritizes reviewer trust, explicit source mapping, and high-signal summary blocks.",
    rawSnapshotHtml: "<article>Demo Gemini research synthesis</article>",
    dedupeHash: "demo-dedupe-research-notes",
    exportCount: 0,
    exportHistory: [],
    isFallbackCapture: false,
  },
];

const DEMO_SNIPPETS: Snippet[] = [
  {
    id: "snippet_export_policy",
    projectId: "project_launch_ops",
    archiveRecordId: "record_launch_pricing",
    kind: "decision",
    title: "Export policy note",
    body: "Keep Markdown and JSON in the free tier. Batch export stays behind Pro until sync is real.",
    tags: ["launch", "pricing"],
    sourceUrl: "https://chatgpt.com/c/demo-launch-pricing",
    platform: "chatgpt",
    createdAt: TIMESTAMPS.previous,
  },
  {
    id: "snippet_client_template",
    projectId: "project_client_workbench",
    archiveRecordId: "record_client_brief",
    kind: "template",
    title: "Workshop recap template",
    body: "Objective, decisions, blockers, next owner, follow-up date.",
    tags: ["client", "template"],
    sourceUrl: "https://claude.ai/chat/demo-client-brief",
    platform: "claude",
    createdAt: TIMESTAMPS.client,
  },
];

export async function seedDemoWorkspace() {
  await db.transaction(
    "rw",
    db.projects,
    db.archiveRecords,
    db.snippets,
    db.settings,
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.archiveRecords.clear(),
        db.snippets.clear(),
        db.settings.clear(),
      ]);
      await db.projects.bulkPut(DEMO_PROJECTS);
      await db.archiveRecords.bulkPut(DEMO_RECORDS);
      await db.snippets.bulkPut(DEMO_SNIPPETS);
      await db.settings.put(DEMO_SETTINGS);
    },
  );
}
