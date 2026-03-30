import { Router } from "express";
import { decryptJson, encryptJson } from "../services/encryption.js";
import { getSyncDocument, listSyncDocuments, putSyncDocument } from "../services/syncService.js";

const router = Router();

router.get("/documents", (_request, response) => {
  response.json(listSyncDocuments());
});

router.get("/documents/:id", (request, response) => {
  const document = getSyncDocument(request.params.id);
  response.json(document ?? null);
});

router.post("/documents/:id", (request, response) => {
  const encrypted = encryptJson(request.body);
  putSyncDocument(request.params.id, encrypted);
  response.json({
    id: request.params.id,
    preview: decryptJson(encrypted),
  });
});

export default router;

