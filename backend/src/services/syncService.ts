const archiveStore = new Map<string, unknown>();

export function putSyncDocument(id: string, document: unknown) {
  archiveStore.set(id, document);
  return { id, updatedAt: new Date().toISOString() };
}

export function getSyncDocument(id: string) {
  return archiveStore.get(id);
}

export function listSyncDocuments() {
  return Array.from(archiveStore.entries()).map(([id, document]) => ({
    id,
    document,
  }));
}

