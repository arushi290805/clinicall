import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { create: vi.fn() },
    doctor: { findMany: vi.fn() },
    appointment: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
  },
}));

import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("voice agent route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Sure, what is your name?",
              },
            },
          ],
        }),
      })
    );
  });

  it("returns 400 without messages", async () => {
    const res = await request(app).post("/api/voice-agent").send({});
    expect(res.status).toBe(400);
  });

  it("returns assistant reply", async () => {
    const res = await request(app)
      .post("/api/voice-agent")
      .send({ messages: [{ role: "user", content: "I need an appointment" }] });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain("name");
    expect(prisma.doctor.findMany).not.toHaveBeenCalled();
  });

  it("blocks book_appointment without confirmation via tool loop", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: "book_appointment",
                      arguments: JSON.stringify({
                        userId: "u1",
                        doctorId: "d1",
                        scheduledAt: "2030-01-01T10:00:00.000Z",
                        userConfirmed: false,
                      }),
                    },
                  },
                ],
              },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Please confirm before I book.",
              },
            },
          ],
        }),
      } as Response);

    const res = await request(app)
      .post("/api/voice-agent")
      .send({ messages: [{ role: "user", content: "Book it now" }] });

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/confirm/i);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});
