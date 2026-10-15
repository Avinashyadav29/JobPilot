import { q } from '../db.js';
import { enqueue } from '../queue.js';
import { fetchAlertJobs, checkReplies } from './gmail.js';
import { scoreJob } from './matcher.js';
import { askJSON } from './llm.js';
import * as tg from './telegram.js';
import { setStage } from '../routes/applications.js';

const masterResume = async (userId) =>
  (await q('select * from resumes where user_id=$1 order by is_master desc, created_at desc limit 1', [userId]))[0];

export async function syncUser(userId) {
  const [u] = await q('select * from users where id=$1', [userId]);
  if (!u?.gmail_tokens) return 0;
  let added = 0;
  for (const j of await fetchAlertJobs(u)) {
    const [row] = await q(
      'insert into jobs(user_id,title,company,link,description,source) values($1,$2,$3,$4,$5,$6) on conflict (user_id,link) do nothing returning id',
      [userId, j.title, j.company, j.link, j.description, j.source]
    );
    if (row) { added++; await enqueue('match', { jobId: row.id }); }
  }
  for (const appId of await checkReplies(u)) await setStage(userId, appId, 'replied');
  return added;
}

export async function matchJob(jobId) {
  const [job] = await q('select * from jobs where id=$1', [jobId]);
  if (!job) return;
  const [user] = await q('select * from users where id=$1', [job.user_id]);
  const resume = await masterResume(job.user_id);
  if (!resume) return console.log('No resume yet; skipping match for job', jobId);
  const { score, reasons } = await scoreJob(resume.content, job, user.keywords);
  const status = score >= user.match_threshold ? 'review' : 'low';
  await q('update jobs set match_score=$1, match_reasons=$2, status=$3 where id=$4', [score, JSON.stringify(reasons), status, jobId]);
  if (status === 'review') {
    await tg.send(
      user.telegram_chat_id,
      `${score}% match\n${job.title} @ ${job.company || 'Unknown'}\n${reasons.map((r) => '• ' + r).join('\n')}\n${job.link || ''}`,
      [
        { text: 'Approve', callback_data: `approve:${jobId}` },
        { text: 'Skip', callback_data: `skip:${jobId}` },
      ]
    );
  }
}

export async function approveJob(userId, jobId) {
  const [job] = await q("update jobs set status='approved' where id=$1 and user_id=$2 and status='review' returning *", [jobId, userId]);
  if (!job) return null;
  const resume = await masterResume(userId);
  await q('insert into applications(user_id,job_id,resume_id,company,title,link) values($1,$2,$3,$4,$5,$6)', [
    userId, job.id, resume?.id || null, job.company || 'Unknown', job.title, job.link,
  ]);
  await enqueue('draft', { jobId: job.id });
  return job;
}

export const skipJob = async (userId, jobId) =>
  (await q("update jobs set status='skipped' where id=$1 and user_id=$2 and status='review' returning *", [jobId, userId]))[0];

export async function draftJob(jobId) {
  const [job] = await q('select * from jobs where id=$1', [jobId]);
  const [user] = await q('select * from users where id=$1', [job.user_id]);
  const resume = await masterResume(job.user_id);
  if (!resume) return;
  const out = await askJSON(
    `You help a job seeker apply. STRICT RULES: only reword and reorder the candidate's REAL experience to fit the job. Never invent skills, employers, degrees, dates or numbers that are not in the resume. If something is missing, leave it out.`,
    `Resume:\n${resume.content.slice(0, 7000)}\n\nJob:\n${job.title} at ${job.company || ''}\n${(job.description || '').slice(0, 3500)}\n\nReturn {"tailored_resume":"full resume text","email_subject":"","email_body":"short, specific cold email under 150 words","connection_note":"LinkedIn note under 280 characters"}`,
    4000
  );
  const [app] = await q('select id from applications where job_id=$1 order by id desc limit 1', [jobId]);
  await q(
    'insert into drafts(user_id,job_id,application_id,email_subject,email_body,tailored_resume,connection_note) values($1,$2,$3,$4,$5,$6,$7)',
    [job.user_id, jobId, app?.id, out.email_subject, out.email_body, out.tailored_resume, out.connection_note]
  );
  await q("update jobs set status='drafted' where id=$1", [jobId]);
  await tg.send(user.telegram_chat_id, `Draft ready for ${job.title} @ ${job.company || ''}. Open the Review page to edit and send.`);
}
