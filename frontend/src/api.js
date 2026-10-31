// Small fetch wrapper: adds the JWT, throws readable errors (Practical 2/3: async + error handling)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}
