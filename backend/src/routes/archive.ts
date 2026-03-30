import { Router } from "express";

const router = Router();

router.post("/import", (request, response) => {
  response.json({
    imported: true,
    fileName: request.body?.fileName ?? "unknown",
  });
});

export default router;

