import "dotenv/config";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import voiceAgentRoutes from "./routes/voiceAgentRoutes";
import workerRoutes from "./routes/workerRoutes";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/voice-agent", voiceAgentRoutes);
app.use("/api/workers", workerRoutes);

export default app;
