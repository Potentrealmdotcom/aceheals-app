// Netlify function: ai-helper
// 24/7 parent helper chat. Needs the ANTHROPIC_API_KEY env var set in Netlify.
// Until then it returns 501 and the app falls back to built-in quick answers.
const SYSTEM = `You are the AceHeals Parent Helper, a warm, practical guide for parents of children with autism, sensory needs and delayed speech.
Give short, concrete, kind ideas a parent can try today (routines, visual supports, communication, sensory tools, school and IEP prep, food routines, sleep).
Rules: never diagnose, never give medical advice, doses, or tell anyone to start, stop or change a medicine, supplement, herb, diet or detox protocol. For anything health-related, say to ask the child's doctor or therapist. If a child may be in danger, tell the parent to call 911 or their local emergency number. Keep answers under 180 words. Use plain words.`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 501, body: JSON.stringify({ error: 'AI not configured yet' }) };
  try {
    const { messages } = JSON.parse(event.body || '{}');
    const clean = (Array.isArray(messages) ? messages : []).slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 1500),
    }));
    if (!clean.length || clean[0].role !== 'user') return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 500, system: SYSTEM, messages: clean }),
    });
    const data = await r.json();
    if (!r.ok) return { statusCode: 502, body: JSON.stringify({ error: 'AI service error' }) };
    const reply = (data.content || []).map((c) => c.text || '').join('').trim();
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reply }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
