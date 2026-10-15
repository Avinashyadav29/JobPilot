export const getToken = () => localStorage.getItem('jp_token');
export const setToken = (t) => (t ? localStorage.setItem('jp_token', t) : localStorage.removeItem('jp_token'));

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken()) { setToken(null); location.reload(); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
