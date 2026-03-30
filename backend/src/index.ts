import cors from "cors";
import express from "express";
import archiveRouter from "./routes/archive.js";
import authRouter from "./routes/auth.js";
import billingRouter from "./routes/billing.js";
import syncRouter from "./routes/sync.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "ai-workspace-archive-backend" });
});

app.use("/auth", authRouter);
app.use("/billing", billingRouter);
app.use("/sync", syncRouter);
app.use("/archive", archiveRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`AI Workspace Archive backend listening on ${port}`);
});

