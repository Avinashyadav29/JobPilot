import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Dashboard({ go }) {
  const [s, setS] = useState(null);
  const [apps, setApps] = useState([]);
  useEffect(() => {
    api('/stats').then(setS).catch(() => {});
    api('/applications').then((a) => setApps(a.slice(0, 6))).catch(() => {});
  }, []);
  if (!s) return <p className="muted">Loading...</p>;
  const total = Object.values(s.stages).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...s.weekly.map((w) => w.n));
  return (
    <>
      <div className="stats">
        <div className="card"><span className="muted">Tracked</span><b>{total}</b></div>
        <div className="card"><span className="muted">Applied</span><b>{s.stages.applied || 0}</b></div>
        <div className="card"><span className="muted">Interviews</span><b>{s.stages.interview || 0}</b></div>
        <div className="card"><span className="muted">Response rate</span><b>{s.responseRate}%</b></div>
        <div className="card clickable" onClick={() => go('Review')}><span className="muted">Awaiting review</span><b>{s.pending}</b></div>
      </div>
      <div className="card">
        <h3>Applications per week</h3>
        {s.weekly.length === 0 && <p className="muted">Nothing yet.</p>}
        <div className="bars">
          {s.weekly.map((w) => (
            <div key={w.week} className="bar"><div style={{ height: `${(w.n / max) * 100}%` }} title={w.n} /><small>{w.week}</small></div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Recent</h3>
        {apps.length === 0 && <p className="muted">No applications yet. Add one on the Applications page.</p>}
        {apps.map((a) => (
          <div key={a.id} className="row"><span>{a.title} <span className="muted">@ {a.company}</span></span><span className={`pill ${a.stage}`}>{a.stage}</span></div>
        ))}
      </div>
    </>
  );
}
