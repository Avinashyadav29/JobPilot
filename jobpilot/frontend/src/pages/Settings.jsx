import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');
  const [job, setJob] = useState({ title: '', company: '', link: '', description: '' });
  useEffect(() => { api('/settings').then(setS); }, []);
  if (!s) return <p className="muted">Loading...</p>;

  async function save() {
    await api('/settings', { method: 'PATCH', body: { match_threshold: +s.match_threshold, keywords: s.keywords, alert_query: s.alert_query, telegram_chat_id: s.telegram_chat_id } });
    setMsg('Saved');
  }
  async function connectGmail() { location.href = (await api('/gmail/auth-url')).url; }
  async function sync() { await api('/jobs/sync', { method: 'POST' }); setMsg('Sync queued. New matches show up on the Review page.'); }
  async function addTest(e) {
    e.preventDefault();
    await api('/jobs/manual', { method: 'POST', body: job });
    setJob({ title: '', company: '', link: '', description: '' });
    setMsg('Test job queued for scoring.');
  }

  return (
    <>
      {msg && <p className="muted">{msg}</p>}
      <div className="card">
        <label>Match threshold: {s.match_threshold}%<input type="range" min="40" max="95" value={s.match_threshold} onChange={(e) => setS({ ...s, match_threshold: e.target.value })} /></label>
        <label>Preferred keywords (comma separated)<input value={(s.keywords || []).join(', ')} onChange={(e) => setS({ ...s, keywords: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
        <label>Gmail search for job alerts<input value={s.alert_query} onChange={(e) => setS({ ...s, alert_query: e.target.value })} /></label>
        <label>Telegram chat id (message your bot /start to get it)<input value={s.telegram_chat_id || ''} onChange={(e) => setS({ ...s, telegram_chat_id: e.target.value })} /></label>
        <button className="primary" onClick={save}>Save settings</button>
      </div>
      <div className="card">
        <h3>Gmail {s.gmail_connected && <span className="pill score">connected</span>}</h3>
        <div className="row"><button onClick={connectGmail}>{s.gmail_connected ? 'Reconnect Gmail' : 'Connect Gmail'}</button>
          {s.gmail_connected && <button onClick={sync}>Sync alerts now</button>}</div>
      </div>
      <form className="card" onSubmit={addTest}>
        <h3>Add a test job (no Gmail needed)</h3>
        <input placeholder="Title" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} required />
        <input placeholder="Company" value={job.company} onChange={(e) => setJob({ ...job, company: e.target.value })} />
        <input placeholder="Link" value={job.link} onChange={(e) => setJob({ ...job, link: e.target.value })} />
        <textarea rows="4" placeholder="Paste the job description" value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} />
        <button className="primary">Score it</button>
      </form>
    </>
  );
}
