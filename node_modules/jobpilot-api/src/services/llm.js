export async function ask(system, prompt, maxTokens = 2000) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'LLM request failed');
  return d.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export async function askJSON(system, prompt, maxTokens = 2000) {
  const t = await ask(`${system}\nReturn ONLY valid JSON. No markdown, no commentary.`, prompt, maxTokens);
  return JSON.parse(t.replace(/```json|```/g, '').trim());
}
