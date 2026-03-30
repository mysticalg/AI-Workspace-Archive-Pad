import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "db/dexie";
import { deleteRecord } from "./appState";
import {
  ensureSettings,
  ensureStarterProject,
  markExport,
  saveArchiveRecord,
  saveSnippet,
  upsertProject,
  wipeLocalData,
} from "./storage";
import { makeCaptureDraft } from "../test/fixtures";

async function resetDb() {
  db.close();
  await db.delete();
  await db.open();
}

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

describe("storage lifecycle", () => {
  it("enables all supported platforms by default", async () => {
    const settings = await ensureSettings();

    expect(settings.enabledPlatforms).toEqual(["chatgpt", "claude", "gemini", "perplexity"]);
    expect(settings.onboardingCompleted).toBe(false);
  });

  it("deletes a single archive record without touching the rest of the archive", async () => {
    const starter = await ensureStarterProject();
    const first = await saveArchiveRecord(
      makeCaptureDraft({
        sourceUrl: "https://chatgpt.com/c/delete-1",
        sourceTitle: "Delete target",
      }),
      { projectId: starter.id },
    );
    const second = await saveArchiveRecord(
      makeCaptureDraft({
        sourceUrl: "https://chatgpt.com/c/delete-2",
        sourceTitle: "Keep target",
      }),
      { projectId: starter.id },
    );

    await deleteRecord(first.record.id);

    const records = await db.archiveRecords.toArray();
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe(second.record.id);
  });

  it("tracks record and project export history", async () => {
    const project = await upsertProject({ title: "Launch exports" });
    const saved = await saveArchiveRecord(
      makeCaptureDraft({
        sourceUrl: "https://chatgpt.com/c/export-1",
        sourceTitle: "Export target",
      }),
      { projectId: project.id },
    );

    await markExport([saved.record.id], "pdf", project.id);

    const record = await db.archiveRecords.get(saved.record.id);
    const refreshedProject = await db.projects.get(project.id);

    expect(record?.exportCount).toBe(1);
    expect(record?.exportHistory).toHaveLength(1);
    expect(record?.exportHistory[0]?.format).toBe("pdf");
    expect(refreshedProject?.exportHistory).toHaveLength(1);
    expect(refreshedProject?.exportHistory[0]?.recordIds).toEqual([saved.record.id]);
  });

  it("wipes local data and recreates a clean starter workspace", async () => {
    const starter = await ensureStarterProject();
    const saved = await saveArchiveRecord(
      makeCaptureDraft({
        sourceUrl: "https://chatgpt.com/c/wipe-1",
        sourceTitle: "Wipe target",
      }),
      { projectId: starter.id },
    );

    await saveSnippet({
      projectId: starter.id,
      archiveRecordId: saved.record.id,
      kind: "decision",
      title: "Launch decision",
      body: "Keep local-only as the default.",
      tags: ["release"],
      platform: "chatgpt",
    });

    const settings = await ensureSettings();
    await db.settings.put({
      ...settings,
      onboardingCompleted: true,
      defaultProjectId: starter.id,
    });

    await wipeLocalData();

    const nextSettings = await ensureSettings();
    const projects = await db.projects.toArray();

    expect(await db.archiveRecords.count()).toBe(0);
    expect(await db.snippets.count()).toBe(0);
    expect(projects).toHaveLength(1);
    expect(projects[0]?.title).toBe("Inbox");
    expect(nextSettings.onboardingCompleted).toBe(false);
    expect(nextSettings.defaultProjectId).toBe(projects[0]?.id);
    expect(nextSettings.enabledPlatforms).toEqual(["chatgpt", "claude", "gemini", "perplexity"]);
  });
});
