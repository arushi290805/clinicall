import { prisma } from "../lib/prisma";
import { isDoctorAvailable } from "../lib/availability";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

const SYSTEM_PROMPT = `You are CLINI-CALL, a helpful clinic front-desk voice agent.
Collect: patient name, age, gender, contact number, symptoms, medication, preferred doctor or specialty, and appointment date/time.
Use tools to list doctors, check availability, create the patient record, and book appointments.
ALWAYS summarize the booking details and get explicit user confirmation before calling book_appointment.
Be concise and conversational — replies will be spoken aloud.
If information is missing, ask for it. Use ISO 8601 for scheduledAt when calling tools.`;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "list_doctors",
      description: "List available doctors and their specialties",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description: "Check if a doctor is free at a given time (30-minute slots)",
      parameters: {
        type: "object",
        properties: {
          doctorId: { type: "string" },
          scheduledAt: { type: "string", description: "ISO 8601 datetime" },
        },
        required: ["doctorId", "scheduledAt"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_patient",
      description: "Create a patient intake record",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "string" },
          gender: { type: "string" },
          contactNumber: { type: "string" },
          symptoms: { type: "string" },
          medication: { type: "string" },
        },
        required: ["name", "age", "gender", "contactNumber", "symptoms", "medication"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "book_appointment",
      description:
        "Book an appointment after the user has explicitly confirmed. Requires existing userId and doctorId.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
          doctorId: { type: "string" },
          scheduledAt: { type: "string" },
          notes: { type: "string" },
          userConfirmed: {
            type: "boolean",
            description: "Must be true; user must have confirmed verbally",
          },
        },
        required: ["userId", "doctorId", "scheduledAt", "userConfirmed"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_appointment",
      description: "Fetch an appointment by id",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
];

async function runTool(name: string, argsJson: string): Promise<{ result: unknown; booking?: unknown }> {
  const args = argsJson ? JSON.parse(argsJson) : {};

  switch (name) {
    case "list_doctors": {
      const doctors = await prisma.doctor.findMany({ orderBy: { name: "asc" } });
      return { result: doctors };
    }
    case "check_availability": {
      const when = new Date(args.scheduledAt);
      const available = await isDoctorAvailable(args.doctorId, when);
      return { result: { available, doctorId: args.doctorId, scheduledAt: when.toISOString() } };
    }
    case "create_patient": {
      const user = await prisma.user.create({
        data: {
          name: args.name,
          age: String(args.age),
          gender: args.gender,
          contactNumber: String(args.contactNumber),
          symptoms: args.symptoms,
          medication: args.medication,
        },
      });
      return { result: user };
    }
    case "book_appointment": {
      if (!args.userConfirmed) {
        return {
          result: {
            error: "Booking blocked: userConfirmed must be true after explicit confirmation.",
          },
        };
      }
      const when = new Date(args.scheduledAt);
      const available = await isDoctorAvailable(args.doctorId, when);
      if (!available) {
        return { result: { error: "Doctor is not available at that time" } };
      }
      const appointment = await prisma.appointment.create({
        data: {
          userId: args.userId,
          doctorId: args.doctorId,
          scheduledAt: when,
          notes: typeof args.notes === "string" ? args.notes : "",
        },
        include: { doctor: true, user: true },
      });
      return { result: appointment, booking: appointment };
    }
    case "get_appointment": {
      const appointment = await prisma.appointment.findUnique({
        where: { id: args.id },
        include: { doctor: true, user: true },
      });
      return { result: appointment ?? { error: "Not found" } };
    }
    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}

export async function runVoiceAgent(
  messages: ChatMessage[]
): Promise<{ reply: string; messages: ChatMessage[]; booking?: unknown }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const apiKey = geminiKey || openaiKey;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const conversation: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role !== "system"),
  ];

  let booking: unknown | undefined;
  const maxRounds = 6;

  // Auto-detect Gemini key format (e.g. starting with "AQ." or "AIza") or GEMINI_API_KEY env var
  const isGeminiKey = Boolean(
    geminiKey ||
    apiKey.startsWith("AQ.") ||
    apiKey.startsWith("AIza")
  );

  const endpoint = isGeminiKey
    ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const defaultModel = isGeminiKey ? "gemini-3.6-flash" : "gpt-4o-mini";
  const model =
    process.env.GEMINI_MODEL ||
    (isGeminiKey ? "gemini-3.6-flash" : process.env.OPENAI_MODEL || "gpt-4o-mini");

  for (let round = 0; round < maxRounds; round++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: conversation,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          role: "assistant";
          content: string | null;
          tool_calls?: ToolCall[];
        };
      }>;
    };

    const assistantMessage = data.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error("Empty OpenAI response");
    }

    conversation.push({
      role: "assistant",
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls,
    });

    if (!assistantMessage.tool_calls?.length) {
      const reply = assistantMessage.content?.trim() || "How else can I help you?";
      return {
        reply,
        messages: conversation.filter((m) => m.role !== "system"),
        booking,
      };
    }

    for (const call of assistantMessage.tool_calls) {
      const { result, booking: booked } = await runTool(
        call.function.name,
        call.function.arguments
      );
      if (booked) booking = booked;
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "I need a bit more information to finish booking. Please continue.",
    messages: conversation.filter((m) => m.role !== "system"),
    booking,
  };
}
