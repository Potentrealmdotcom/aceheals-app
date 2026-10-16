// Netlify function: ai-helper
// 24/7 parent helper chat. Needs ONE key set in Netlify: GEMINI_API_KEY (free) or GROQ_API_KEY (free) or ANTHROPIC_API_KEY.
// Until then it returns 501 and the app falls back to built-in quick answers.
const SYSTEM = `You are the AceHeals Parent Helper, a warm, practical guide for parents of children with autism, sensory needs and delayed speech.
Give short, concrete, kind ideas a parent can try today (routines, visual supports, communication, sensory tools, school and IEP prep, food routines, sleep).
Rules: never diagnose, never give medical advice, doses, or tell anyone to start, stop or change a medicine, supplement, herb, diet or detox protocol. For anything health-related, say to ask the child's doctor or therapist. If a child may be in danger, tell the parent to call 911 or their local emergency number. Keep answers under 180 words. Use plain words.`;

async function viaGemini(key, clean) {
  const model = process.env.AI_MODEL || 'gemini-flash-latest';
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: clean.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 600, temperature: 0.6 },
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error('gemini ' + r.status);
  return ((data.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
}

async function viaGroq(key, clean) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'llama-3.3-70b-versatile', max_tokens: 600, temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM }, ...clean] }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error('groq ' + r.status);
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function viaAnthropic(key, clean) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 500, system: SYSTEM, messages: clean }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error('anthropic ' + r.status);
  return (data.content || []).map((c) => c.text || '').join('').trim();
}

// Free options first: GEMINI_API_KEY (Google AI Studio, free, no card) or GROQ_API_KEY (free tier).
export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  const { GEMINI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY } = process.env;
  if (!GEMINI_API_KEY && !GROQ_API_KEY && !ANTHROPIC_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'AI not configured yet' }) };
  try {
    const { messages } = JSON.parse(event.body || '{}');
    const clean = (Array.isArray(messages) ? messages : []).slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 1500),
    }));
    if (!clean.length || clean[0].role !== 'user') return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
    const reply = GEMINI_API_KEY ? await viaGemini(GEMINI_API_KEY, clean)
      : GROQ_API_KEY ? await viaGroq(GROQ_API_KEY, clean)
      : await viaAnthropic(ANTHROPIC_API_KEY, clean);
    if (!reply) return { statusCode: 502, body: JSON.stringify({ error: 'Empty reply' }) };
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'AI service error' }) };
  }
}
