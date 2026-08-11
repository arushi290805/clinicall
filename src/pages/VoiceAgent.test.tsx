import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VoiceAgent from "../pages/VoiceAgent";

describe("VoiceAgent", () => {
  beforeEach(() => {
    vi.stubGlobal("speechSynthesis", {
      cancel: vi.fn(),
      speak: vi.fn(),
    });

    class MockRecognition {
      lang = "";
      interimResults = false;
      maxAlternatives = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;
      start() {
        this.onstart?.();
        this.onresult?.({
          results: [[{ transcript: "I need an appointment tomorrow" }]],
        });
        this.onend?.();
      }
      stop() {
        this.onend?.();
      }
    }

    (window as any).SpeechRecognition = MockRecognition;
    (window as any).webkitSpeechRecognition = MockRecognition;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          reply: "Got it. What is your name?",
          messages: [
            { role: "user", content: "I need an appointment tomorrow" },
            { role: "assistant", content: "Got it. What is your name?" },
          ],
          booking: null,
        }),
      }))
    );
  });

  it("sends speech transcript and renders agent reply", async () => {
    render(
      <MemoryRouter>
        <VoiceAgent />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /tap mic/i }));

    expect(
      await screen.findByText(/I need an appointment tomorrow/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Got it. What is your name/i)).toBeInTheDocument();
    });
  });
});
