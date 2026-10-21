// Tutor fuera de Claude: la app le pregunta a esta función y la función le pregunta a Claude.
// La clave de la API vive solo en Netlify (variable ANTHROPIC_API_KEY), nunca en el navegador.
// Variables opcionales en Netlify:
//   TUTOR_CLAVE   palabra que hay que escribir en la app para usar el tutor (recomendado si la dirección es pública)
//   TUTOR_LIMITE  preguntas por hora por dispositivo (30 si no se define)
//   TUTOR_MODELO  modelo de Claude (claude-opus-5-5 si no se define)
import Anthropic from "@anthropic-ai/sdk";

export const config = { path: "/api/tutor" };

const MODEL = process.env.TUTOR_MODELO || "claude-opus-5-5";
// Modelos que aceptan el respaldo automático del servidor si el pedido es rechazado
const WITH_FALLBACK = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);
const LIMIT = Math.max(1, parseInt(process.env.TUTOR_LIMITE, 10) || 30);

const SYSTEM = `Sos un tutor de guitarra y teoría musical (pop y rock en español) para un alumno adulto de nivel básico a intermedio que sigue un programa de 12 semanas.
Respondé en español rioplatense con voseo, en un máximo de 120 palabras, con precisión. Usá cifrado americano (C, Dm, G7) y grados en números romanos, como el programa.
Si no estás seguro, decilo e indicá tu nivel de confianza. No inventes datos de canciones (tonalidad, acordes): si no los sabés con certeza, decí cómo averiguarlos de oído.
Si el alumno manda un análisis, evaluá su hipótesis, señalá lo que esté mal y explicá por qué.
Solo respondés sobre guitarra, música y el programa; si te piden otra cosa, decí amablemente que solo ayudás con eso.`;

const hits = new Map(); // dispositivo -> horarios de sus pedidos (por instancia; es un freno, no una garantía)

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const cut = (s, n) => String(s ?? "").slice(0, n);

export default async (req, context) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const clave = process.env.TUTOR_CLAVE || "";
  if (req.method === "GET") return json({ ok: !!apiKey, clave: !!clave });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!apiKey) return json({ error: "El tutor no está configurado en este sitio." }, 503);
  if (clave && req.headers.get("x-tutor-clave") !== clave) return json({ error: "clave" }, 401);

  const who = context?.ip || req.headers.get("x-nf-client-connection-ip") || "?";
  const now = Date.now();
  const recent = (hits.get(who) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= LIMIT) return json({ error: `Llegaste al límite de ${LIMIT} preguntas por hora. Probá más tarde.` }, 429);
  recent.push(now);
  hits.set(who, recent);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
  const question = cut(body.pregunta, 1500).trim();
  if (!question) return json({ error: "Falta la pregunta." }, 400);

  // Historial corto: alterna alumno/tutor y siempre arranca con el alumno
  const messages = [];
  for (const m of Array.isArray(body.historial) ? body.historial.slice(-6) : []) {
    const role = m && m.rol === "u" ? "user" : "assistant";
    const text = cut(m && m.texto, 800).trim();
    if (!text || (!messages.length && role === "assistant")) continue;
    if (messages.length && messages[messages.length - 1].role === role) messages[messages.length - 1].content += "\n" + text;
    else messages.push({ role, content: text });
  }
  const ctx = cut(body.contexto, 3000).trim();
  const ask = (ctx ? `Contexto del programa: ${ctx}\n\n` : "") + `Pregunta del alumno: ${question}`;
  if (messages.length && messages[messages.length - 1].role === "user") messages[messages.length - 1].content += "\n\n" + ask;
  else messages.push({ role: "user", content: ask });

  const client = new Anthropic({ apiKey });
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages,
      ...(WITH_FALLBACK.has(MODEL) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    });
    if (res.stop_reason === "refusal") return json({ texto: "No puedo responder eso. Probá reformular la pregunta sobre la lección." });
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return json({ texto: text || "No tengo una respuesta para eso. Probá preguntarlo de otra forma." });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "El tutor está muy pedido ahora. Probá en un rato." }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "La clave de la API configurada en Netlify no es válida." }, 500);
    if (e instanceof Anthropic.APIError) return json({ error: "El tutor no pudo responder (error " + e.status + ")." }, 502);
    return json({ error: "El tutor no está disponible ahora." }, 502);
  }
};
