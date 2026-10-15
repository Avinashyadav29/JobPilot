import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Resumes() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const load = () => api('/resumes').then(setList);
  useEffect(() => { load(); }, []);

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try { await api('/resumes', { method: 'POST', form }); setErr(''); load(); } catch (x) { setErr(x.message); }
  }
  async function savePasted() {
    try { await api('/resumes', { method: 'POST', body: { name: name || 'Resume', content: text } }); setText(''); setErr(''); load(); } catch (x) { setErr(x.message); }
  }

  return (
    <>
      <h2>Resumes</h2>
      <p className="muted">The master resume is what job matches are scored against. Tailored versions are created from it.</p>
      <div className="card">
        <label>Upload PDF or TXT<input type="file" accept=".pdf,.txt" onChange={upload} /></label>
        <label>Or paste text<input placeholder="Name (e.g. Master 2026)" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <textarea rows="8" placeholder="Paste your resume text" value={text} onChange={(e) => setText(e.target.value)} />
        {err && <p className="error">{err}</p>}
        <button className="primary" onClick={savePasted}>Save pasted resume</button>
      </div>
      {list.map((r) => (
        <div key={r.id} className="card">
          <div className="row"><b>{r.name} {r.is_master && <span className="pill score">master</span>}</b>
            <span>{!r.is_master && <button onClick={async () => { await api(`/resumes/${r.id}/master`, { method: 'POST' }); load(); }}>Make master</button>} <button onClick={async () => { await api(`/resumes/${r.id}`, { method: 'DELETE' }); load(); }}>Delete</button></span></div>
          <p className="muted pre">{r.preview}...</p>
        </div>
      ))}
    </>
  );
}
