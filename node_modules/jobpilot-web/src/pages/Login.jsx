import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onDone }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const d = await api(`/auth/${mode}`, { method: 'POST', body: { email, password } });
      setToken(d.token);
      onDone();
    } catch (e) { setErr(e.message); }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>JobPilot</h1>
      <p className="muted">{mode === 'login' ? 'Log in to your tracker' : 'Create your account'}</p>
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input placeholder="Password (8+ characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="error">{err}</p>}
      <button className="primary">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'signup' : 'login'); }}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </a>
    </form>
  );
}
