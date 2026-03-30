export type SnippetKind =
  | "prompt"
  | "output"
  | "code"
  | "quote"
  | "decision"
  | "template";

export interface Snippet {
  id: string;
  projectId?: string;
  archiveRecordId?: string;
  kind: SnippetKind;
  title: string;
  body: string;
  tags: string[];
  sourceUrl?: string;
  platform?: string;
  createdAt: string;
}

