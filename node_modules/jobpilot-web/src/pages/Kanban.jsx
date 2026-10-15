import { useEffect, useState } from 'react';
import { api } from '../api.js';

const STAGES = ['saved', 'applied', 'replied', 'interview', 'offer', 'rejected'];

export default function Kanban() {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ company: '', title: '', link: '' });
  const load = () => api('/applications').then(setApps);
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    await api('/applications', { method: 'POST', body: form });
    setForm({ company: '', title: '', link: '' });
    load();
  }
  async function move(id, stage) {
    setApps((a) => a.map((x) => (x.id === id ? { ...x, stage } : x))); // optimistic
    await api(`/applications/${id}`, { method: 'PATCH', body: { stage } }).catch(load);
  }
  async function remove(id) {
    if (!confirm('Delete this application?')) return;
    await api(`/applications/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <form className="inline" onSubmit={add}>
        <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
        <input placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Link (optional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <button className="primary">Add</button>
      </form>
      <div className="board">
        {STAGES.map((st) => (
          <div key={st} className="col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => move(+e.dataTransfer.getData('id'), st)}>
            <h4>{st} <span className="muted">{apps.filter((a) => a.stage === st).length}</span></h4>
            {apps.filter((a) => a.stage === st).map((a) => (
              <div key={a.id} className="card item" draggable onDragStart={(e) => e.dataTransfer.setData('id', a.id)}>
                <b>{a.title}</b>
                <span className="muted">{a.company}</span>
                <div className="row">
                  {a.link ? <a href={a.link} target="_blank" rel="noreferrer">Open</a> : <span />}
                  <a href="#" onClick={(e) => { e.preventDefault(); remove(a.id); }}>Delete</a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
