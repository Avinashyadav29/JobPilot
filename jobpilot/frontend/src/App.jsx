import { useState } from 'react';
import { getToken, setToken } from './api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Review from './pages/Review.jsx';
import Kanban from './pages/Kanban.jsx';
import Resumes from './pages/Resumes.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = { Dashboard, Review, Kanban, Resumes, Settings };

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState('Dashboard');
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  const Page = PAGES[tab];
  return (
    <div className="app">
      <nav>
        <b className="logo">JobPilot</b>
        {Object.keys(PAGES).map((t) => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
        <span className="spacer" />
        <button onClick={() => { setToken(null); setAuthed(false); }}>Log out</button>
      </nav>
      <main><Page go={setTab} /></main>
    </div>
  );
}
