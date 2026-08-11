import express, { Request, Response } from "express";
import { ChatMessage, runVoiceAgent } from "../services/voiceAgent";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[]; sessionId?: string };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: "messages array is required" });
      return;
    }

    const sanitized = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "tool"))
      .map((m) => ({
        role: m.role,
        content: m.content ?? null,
        tool_call_id: m.tool_call_id,
        tool_calls: m.tool_calls,
      }));

    const result = await runVoiceAgent(sanitized);
    res.json({
      success: true,
      reply: result.reply,
      messages: result.messages,
      booking: result.booking ?? null,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Voice agent failed";
    const status =
      message.includes("GEMINI_API_KEY") || message.includes("OPENAI_API_KEY")
        ? 503
        : 500;
    res.status(status).json({ success: false, message });
  }
});

export default router;
