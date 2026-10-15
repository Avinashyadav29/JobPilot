import { askJSON } from './llm.js';

const tokens = (s = '') => s.toLowerCase().match(/[a-z][a-z+#.]{1,}/g) || [];

function cosine(a, b) {
  const fa = {}, fb = {};
  tokens(a).forEach((t) => (fa[t] = (fa[t] || 0) + 1));
  tokens(b).forEach((t) => (fb[t] = (fb[t] || 0) + 1));
  let dot = 0, na = 0, nb = 0;
  for (const k in fa) { na += fa[k] ** 2; if (fb[k]) dot += fa[k] * fb[k]; }
  for (const k in fb) nb += fb[k] ** 2;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Returns { score: 0-100, reasons: string[] }. Uses the LLM when a key exists, else a keyword fallback.
export async function scoreJob(resume, job, keywords = []) {
  const jobText = `${job.title}\n${job.company || ''}\n${job.description || ''}`;
  try {
    const r = await askJSON(
      'You score how well a candidate fits a job. Be honest and strict; do not inflate scores.',
      `Resume:\n${resume.slice(0, 6000)}\n\nJob:\n${jobText.slice(0, 4000)}\n\nPreferred keywords: ${keywords.join(', ') || 'none'}\n\nReturn {"score": <0-100 integer>, "reasons": [<up to 4 short strings>]}`,
      500
    );
    return { score: Math.max(0, Math.min(100, Math.round(r.score))), reasons: r.reasons || [] };
  } catch (e) {
    const cos = cosine(resume, jobText);
    const hits = keywords.filter((k) => jobText.toLowerCase().includes(k.toLowerCase()));
    const score = Math.min(100, Math.round(cos * 220) + hits.length * 8);
    return {
      score,
      reasons: [`Fallback keyword match (LLM unavailable: ${e.message})`, hits.length ? `Matched keywords: ${hits.join(', ')}` : 'No preferred keywords matched'],
    };
  }
}
