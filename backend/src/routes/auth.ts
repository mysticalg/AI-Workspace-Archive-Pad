import { Router } from "express";

const router = Router();

router.post("/login", (_request, response) => {
  response.json({
    token: "dev-token",
    user: {
      id: "local-user",
      email: "demo@aiworkspacearchive.local",
    },
  });
});

export default router;

