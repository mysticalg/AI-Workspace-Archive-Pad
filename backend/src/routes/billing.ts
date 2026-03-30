import { Router } from "express";
import { resolveEntitlements } from "../services/billingService.js";

const router = Router();

router.get("/plans", (_request, response) => {
  response.json({
    free: resolveEntitlements("free"),
    pro: resolveEntitlements("pro"),
    team: resolveEntitlements("team"),
  });
});

export default router;

