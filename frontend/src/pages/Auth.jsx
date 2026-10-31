// Login / Register / Admin login with CLIENT-SIDE validation (Practical 2 + 3)
import { useState } from 'react'; import { Link } from 'react-router-dom';
import { api } from '../api.js'; import { useApp } from '../App.jsx';
export function AuthPage({ register, admin }) {
  const { login } = useApp();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (register && f.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (f.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e); return !Object.keys(e).length;
  };
  const submit = async (ev) => {
    ev.preventDefault(); setMsg(''); if (!validate()) return;
    setBusy(true);
    try { login(await api(register ? '/auth/register' : `/auth/login${admin ? '?role=admin' : ''}`, 'POST', f)); }
    catch (err) { setMsg(err.message); } finally { setBusy(false); }
  };
  const field = (k, label, type = 'text') => (<div className="mb-3"><label className="form-label">{label}</label>
    <input type={type} className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={f[k]} onChange={set(k)} /><div className="invalid-feedback">{errors[k]}</div></div>);
  return (<div className="container py-5" style={{ maxWidth: 440 }}>
    <div className="hero mb-4"><h1 className="h3">{admin ? 'Admin sign in' : register ? 'Create your account' : 'Order lunch before the queue forms'}</h1></div>
    <form onSubmit={submit} noValidate className="card card-body border-0 shadow-sm">
      {msg && <div className="alert alert-danger py-2">{msg}</div>}
      {register && field('name', 'Full name')}{field('email', 'Email', 'email')}{field('password', 'Password', 'password')}
      <button className="btn btn-brand" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
    </form>
    <p className="mt-3 text-center">{admin ? <Link to="/login">Student login</Link> : register ? <Link to="/login">Already registered? Sign in</Link> : <><Link to="/register">New student? Register</Link> · <Link to="/admin/login">Admin</Link></>}</p>
  </div>);
}
