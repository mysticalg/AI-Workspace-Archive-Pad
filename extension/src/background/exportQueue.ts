export async function queueExport(recordId: string, format: string) {
  return {
    recordId,
    format,
    queuedAt: new Date().toISOString(),
  };
}
