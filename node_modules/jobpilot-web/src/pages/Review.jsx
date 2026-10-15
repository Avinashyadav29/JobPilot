import { useEffect, useState } from 'react';
import { api } from '../api.js';

function DraftEditor({ d, onDone }) {
  const [v, setV] = useState(d);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const save = () => api(`/drafts/${d.id}`, { method: 'PATCH', body: v });

  async function send() {
    setBusy(true); setMsg('');
    try {
      await save();
      const r = await api(`/drafts/${d.id}/send`, { method: 'POST' });
      alert(r.emailed ? 'Email sent and application marked as applied.' : 'Marked as applied. Use the job link to apply.');
      onDone();
    } catch (e) { setMsg(e.message); setBusy(false); }
  }

  return (
    <div className="card">
      <div className="row"><b>{d.title} <span className="muted">@ {d.company}</span></b>{d.link && <a href={d.link} target="_blank" rel="noreferrer">Job link</a>}</div>
      <label>To (recruiter email; leave empty to apply via the link)<input value={v.to_email || ''} onChange={set('to_email')} /></label>
      <label>Subject<input value={v.email_subject || ''} onChange={set('email_subject')} /></label>
      <label>Email<textarea rows="7" value={v.email_body || ''} onChange={set('email_body')} /></label>
      <label>LinkedIn connection note<textarea rows="2" value={v.connection_note || ''} onChange={set('connection_note')} /></label>
      <details>
        <summary>Tailored resume (review carefully: it must only contain your real experience)</summary>
        <textarea rows="16" value={v.tailored_resume || ''} onChange={set('tailored_resume')} />
      </details>
      {msg && <p className="error">{msg}</p>}
      <div className="row"><button onClick={async () => { await save(); setMsg('Saved'); }}>Save</button><button className="primary" disabled={busy} onClick={send}>Send / mark applied</button></div>
    </div>
  );
}

export default function Review() {
  const [jobs, setJobs] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const load = async () => {
    setJobs(await api('/jobs?status=review'));
    setDrafts(await api('/drafts'));
  };
  useEffect(() => { load().catch(() => {}); }, []);
  const act = async (id, a) => { await api(`/jobs/${id}/${a}`, { method: 'POST' }).catch((e) => alert(e.message)); load(); };

  return (
    <>
      <div className="row"><h2>Review queue</h2><button onClick={load}>Refresh</button></div>
      <h3>Matches waiting for your decision</h3>
      {jobs.length === 0 && <p className="muted">Nothing waiting. Sync Gmail in Settings or add a test job.</p>}
      {jobs.map((j) => (
        <div key={j.id} className="card">
          <div className="row"><b>{j.title} <span className="muted">@ {j.company}</span></b><span className="pill score">{j.match_score}%</span></div>
          <ul>{(j.match_reasons || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
          <div className="row">{j.link ? <a href={j.link} target="_blank" rel="noreferrer">Job link</a> : <span />}
            <span><button onClick={() => act(j.id, 'skip')}>Skip</button> <button className="primary" onClick={() => act(j.id, 'approve')}>Approve</button></span></div>
        </div>
      ))}
      <h3>Drafts ready to send</h3>
      {drafts.length === 0 && <p className="muted">No drafts yet. After you approve a job, the draft appears here in a minute (hit Refresh).</p>}
      {drafts.map((d) => <DraftEditor key={d.id} d={d} onDone={load} />)}
    </>
  );
}
