import { google } from 'googleapis';
import { q } from '../db.js';
import { askJSON } from './llm.js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

export const oauth = () =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

export const authUrl = (state) =>
  oauth().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES, state });

function gmailFor(user) {
  const c = oauth();
  c.setCredentials(user.gmail_tokens);
  c.on('tokens', (t) =>
    q('update users set gmail_tokens = coalesce(gmail_tokens, \'{}\'::jsonb) || $1::jsonb where id=$2', [JSON.stringify(t), user.id])
  );
  return google.gmail({ version: 'v1', auth: c });
}

const b64 = (s) => Buffer.from(s, 'base64url').toString('utf8');

function bodyOf(payload) {
  let html = '', text = '';
  (function walk(p) {
    if (p.body?.data) {
      if (p.mimeType === 'text/html') html += b64(p.body.data);
      else if (p.mimeType === 'text/plain') text += b64(p.body.data);
    }
    (p.parts || []).forEach(walk);
  })(payload);
  if (html) {
    return html
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, ' $2 [$1] ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;/g, ' ')
      .replace(/\s+/g, ' ');
  }
  return text;
}

// Reads new alert emails and asks the LLM to extract the job postings from each.
export async function fetchAlertJobs(user) {
  const gmail = gmailFor(user);
  const list = await gmail.users.messages.list({ userId: 'me', q: user.alert_query, maxResults: 15 });
  const found = [];
  for (const m of list.data.messages || []) {
    const seen = await q('select 1 from processed_emails where user_id=$1 and message_id=$2', [user.id, m.id]);
    if (seen.length) continue;
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const from = msg.data.payload.headers.find((x) => x.name === 'From')?.value || '';
    const text = bodyOf(msg.data.payload).slice(0, 14000);
    try {
      const jobs = await askJSON(
        'Extract job postings from a job-alert email. Only include real postings that have a link.',
        `Email from: ${from}\n\n${text}\n\nReturn {"jobs":[{"title":"","company":"","link":"","description":"short summary if present"}]}`,
        2500
      );
      (jobs.jobs || []).forEach((j) => j.link && found.push({ ...j, source: from }));
    } catch (e) {
      console.error('alert parse failed for', m.id, e.message);
      continue; // not marked processed, will retry next sync
    }
    await q('insert into processed_emails(user_id,message_id) values($1,$2) on conflict do nothing', [user.id, m.id]);
  }
  return found;
}

export async function sendEmail(user, { to, subject, body }) {
  const gmail = gmailFor(user);
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n');
  const r = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: Buffer.from(raw).toString('base64url') } });
  return { id: r.data.id, threadId: r.data.threadId };
}

// A thread with more than one message means someone replied.
export async function checkReplies(user) {
  const apps = await q("select id, gmail_thread_id from applications where user_id=$1 and stage='applied' and gmail_thread_id is not null", [user.id]);
  const gmail = gmailFor(user);
  const replied = [];
  for (const a of apps) {
    const t = await gmail.users.threads.get({ userId: 'me', id: a.gmail_thread_id, format: 'minimal' });
    if ((t.data.messages || []).length > 1) replied.push(a.id);
  }
  return replied;
}
