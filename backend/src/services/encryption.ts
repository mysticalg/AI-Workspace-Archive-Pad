import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const KEY = Buffer.alloc(32, 7);

export function encryptJson(payload: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const content = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    content: content.toString("base64"),
  };
}

export function decryptJson(payload: { iv: string; authTag: string; content: string }) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const content = Buffer.concat([
    decipher.update(Buffer.from(payload.content, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(content.toString("utf8"));
}

