// services/chatService.js
//
// AI doubt-solving chatbot. Uses Groq's free-tier chat completions API
// (OpenAI-compatible), scoped to academic help only via the system prompt
// below — this is a prompt-level instruction the model follows, not a
// separate capability restriction, same pattern as any LLM-based
// assistant. Deliberately stateless: no chat history is persisted
// anywhere on the server, no new database collection. The client keeps
// the last few turns in memory and resends them each call, which is what
// keeps this feature small.

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant"; // fast and generous on Groq's free tier

const SYSTEM_PROMPT = `You are a friendly study helper inside a school learning app called Vidyut, for students in India from grades 1 to 12. Your ONLY job is to help with academic doubts in Mathematics, Science, English, Social Science, and Hindi.

Rules you always follow:
- Keep answers short, simple, and encouraging, at a school student's reading level.
- When solving a problem, explain the steps, don't just give the final answer.
- If a question isn't about schoolwork, gently say you can only help with study doubts and steer the conversation back.
- If a message suggests the student is upset, anxious, or in distress rather than just confused about a topic, do not try to counsel them yourself. Keep your reply brief and kind, and encourage them to talk to a teacher, parent, or another trusted adult.
- Never discuss anything inappropriate for a school-age child.
- Keep replies under 120 words unless a step-by-step solution genuinely needs more room.`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 6; // keeps the request payload small; deep history isn't needed for doubt-solving

export async function getChatReply(message, history = []) {
  if (!GROQ_API_KEY) throw new Error("chat assistant is not configured (missing GROQ_API_KEY)");
  if (!message || !message.trim()) throw new Error("no message provided");
  if (message.length > MAX_MESSAGE_LENGTH) throw new Error("message too long");

  const trimmedHistory = (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, MAX_MESSAGE_LENGTH),
    }));

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...trimmedHistory,
    { role: "user", content: message },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 300, temperature: 0.4 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 200)}`);
    }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error("empty response from chat API");
    return reply.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export const chatConfigured = () => !!GROQ_API_KEY;
