import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type Turn = {
  role: "user" | "assistant";
  content: string;
};

type AgentMessage = {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: unknown[];
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const VoiceAgent: React.FC = () => {
  const navigate = useNavigate();
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm the CLINI-CALL booking agent. Tell me who needs an appointment and I'll help book it.",
    },
  ]);
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    const text = turns[turns.length - 1];
    if (
      text?.role === "assistant" &&
      text.content &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.content);
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [turns]);

  const sendTranscript = async (transcript: string) => {
    const trimmed = transcript.trim();
    if (!trimmed) return;

    setError("");
    setBusy(true);
    setTurns((prev) => [...prev, { role: "user", content: trimmed }]);

    const nextHistory: AgentMessage[] = [
      ...history,
      { role: "user", content: trimmed },
    ];

    try {
      const result = await apiFetch<{
        success: boolean;
        reply: string;
        messages: AgentMessage[];
        booking: Record<string, unknown> | null;
      }>("/api/voice-agent", {
        method: "POST",
        body: JSON.stringify({ messages: nextHistory }),
      });

      setHistory(result.messages || nextHistory);
      setTurns((prev) => [...prev, { role: "assistant", content: result.reply }]);
      if (result.booking) {
        setBooking(result.booking);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice agent failed";
      setError(message);
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble reaching the booking service. Please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    window.speechSynthesis.cancel();
    const recog = new SR();
    recognitionRef.current = recog;
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onerror = () => {
      setListening(false);
      setError("Could not capture speech. Please try again.");
    };
    recog.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      void sendTranscript(transcript);
    };

    recog.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/85 backdrop-blur rounded-3xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-900">Voice booking agent</h1>
            <p className="text-sm text-gray-600">Speak naturally to book an appointment</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Back
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {turns.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  turn.role === "user"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-950 border border-emerald-100"
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {busy && (
            <p className="text-sm text-emerald-700 animate-pulse">Agent is thinking…</p>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          </div>
        )}

        {booking && (
          <div className="px-6 pb-2">
            <div className="text-sm bg-lime-50 border border-lime-200 rounded-xl px-3 py-2 text-emerald-900">
              Booking created
              {"doctor" in booking && booking.doctor
                ? ` with ${(booking.doctor as { name?: string }).name || "your doctor"}`
                : ""}
              .{" "}
              <button
                className="underline font-semibold"
                onClick={() =>
                  navigate("/appointment", { state: { appointment: booking } })
                }
              >
                View confirmation
              </button>
            </div>
          </div>
        )}

        <div className="px-6 py-5 border-t border-emerald-100 flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={listening ? stopListening : startListening}
            className={`flex-1 h-14 rounded-2xl font-bold text-white transition ${
              listening
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-700 hover:bg-emerald-800"
            } disabled:opacity-60`}
          >
            {listening ? "Listening… tap to stop" : busy ? "Please wait…" : "Hold to talk / tap mic"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgent;
