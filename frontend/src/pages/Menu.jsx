// Student dashboard: recommendations, menu, search/filter, cart, coupon, slots, checkout
import { useEffect, useState, useMemo } from 'react';
import { api } from '../api.js'; import { useApp } from '../App.jsx';
export default function Menu() {
  const { user, cart, setCart } = useApp();
  const [foods, setFoods] = useState([]); const [cats, setCats] = useState([]); const [slots, setSlots] = useState([]);
  const [favs, setFavs] = useState([]); const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true); const [msg, setMsg] = useState(null);
  const [co, setCo] = useState({ code: '', percent: 0, applied: '', slot: '', date: '', payment: 'counter' });
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };
  useEffect(() => { (async () => {
    try { const [f, c, s, me] = await Promise.all([api('/foods'), api('/categories'), api('/slots'), api('/auth/me')]);
      setFoods(f); setCats(c); setSlots(s); setFavs(me.favorites.map(String)); }
    catch (e) { flash(e.message, 'danger'); } finally { setLoading(false); } })(); }, []);

  const shown = useMemo(() => foods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) && (cat === 'all' || f.category?._id === cat)), [foods, q, cat]);
  const recommended = foods.filter((f) => favs.includes(f._id)).slice(0, 3);
  const add = (food) => setCart((c) => c.some((i) => i.food._id === food._id) ? c.map((i) => i.food._id === food._id ? { ...i, qty: i.qty + 1 } : i) : [...c, { food, qty: 1 }]);
  const change = (id, d) => setCart((c) => c.map((i) => i.food._id === id ? { ...i, qty: i.qty + d } : i).filter((i) => i.qty > 0));
  const subtotal = cart.reduce((s, i) => s + i.food.price * i.qty, 0);
  const discount = Math.round((subtotal * co.percent) / 100), total = subtotal - discount;
  const toggleFav = async (id) => setFavs((await api(`/auth/favorite/${id}`, 'POST')).map(String));
  const applyCoupon = async () => { try { const c = await api('/coupon-check', 'POST', { code: co.code }); setCo({ ...co, percent: c.percent, applied: c.code }); flash(`${c.percent}% off applied`); } catch (e) { setCo({ ...co, percent: 0, applied: '' }); flash(e.message, 'danger'); } };
  const place = async () => {
    if (!cart.length) return flash('Your cart is empty', 'danger');
    if (!co.date || !co.slot) return flash('Pick a pickup date and time slot', 'danger');
    if (co.payment === 'online' && !window.confirm(`Simulated payment of ₹${total}. Pay now?`)) return;
    try { await api('/orders', 'POST', { items: cart.map((i) => ({ food: i.food._id, qty: i.qty })), pickupDate: co.date, slot: co.slot, payment: co.payment, coupon: co.applied });
      setCart([]); setCo({ ...co, percent: 0, applied: '', code: '' }); flash('Order placed! Open "My orders" for your QR code.'); }
    catch (e) { flash(e.message, 'danger'); }
  };
  return (<div className="container py-4">
    {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
    <div className="hero mb-4"><h1 className="h2">Hi {user.name.split(' ')[0]}, what are you eating today?</h1>
      <p className="mb-0">{recommended.length ? `Your favourites: ${recommended.map((f) => f.name).join(', ')}` : 'Tap the heart on a dish and we will remember it.'}</p></div>
    <div className="row g-4"><div className="col-lg-8">
      <div className="row g-2 mb-3"><div className="col-md-7"><input className="form-control" placeholder="Search food…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="col-md-5"><select className="form-select" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All categories</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div></div>
      {loading ? <div className="spinner-border" /> : !shown.length ? <p>No dishes match your search.</p> :
      <div className="row g-3">{shown.map((f) => (<div className="col-6 col-md-4" key={f._id}><div className="card food-card h-100">
        <img src={f.image} alt={f.name} /><div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between"><h6 className="mb-1">{f.name}</h6>
            <button className={`heart ${favs.includes(f._id) ? 'on' : ''}`} onClick={() => toggleFav(f._id)} aria-label="favourite">♥</button></div>
          <small className="text-muted">{f.category?.name}</small>
          <div className="mt-auto d-flex justify-content-between align-items-center pt-2"><strong>₹{f.price}</strong>
            <button className="btn btn-sm btn-brand" disabled={!f.available} onClick={() => add(f)}>{f.available ? 'Add' : 'Sold out'}</button></div></div></div></div>))}</div>}
    </div>
    <div className="col-lg-4"><div className="card card-body border-0 shadow-sm position-sticky" style={{ top: 12 }}>
      <h5>Your cart</h5>{!cart.length && <p className="text-muted">Nothing yet. Add a dish from the menu.</p>}
      {cart.map((i) => (<div key={i.food._id} className="d-flex justify-content-between align-items-center mb-2"><span>{i.food.name}</span>
        <span><button className="btn btn-sm btn-outline-secondary" onClick={() => change(i.food._id, -1)}>−</button> {i.qty} <button className="btn btn-sm btn-outline-secondary" onClick={() => change(i.food._id, 1)}>+</button> ₹{i.food.price * i.qty}</span></div>))}
      <div className="input-group my-2"><input className="form-control" placeholder="Coupon (SAVE10)" value={co.code} onChange={(e) => setCo({ ...co, code: e.target.value })} /><button className="btn btn-outline-dark" onClick={applyCoupon}>Apply</button></div>
      <input type="date" className="form-control mb-2" min={new Date().toISOString().slice(0, 10)} value={co.date} onChange={(e) => setCo({ ...co, date: e.target.value })} />
      <select className="form-select mb-2" value={co.slot} onChange={(e) => setCo({ ...co, slot: e.target.value })}><option value="">Pickup time slot</option>{slots.map((s) => <option key={s._id}>{s.label}</option>)}</select>
      <select className="form-select mb-3" value={co.payment} onChange={(e) => setCo({ ...co, payment: e.target.value })}><option value="counter">Pay cash at counter</option><option value="online">Pay online (simulated)</option></select>
      <div className="d-flex justify-content-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
      <div className="d-flex justify-content-between"><span>Discount</span><span>−₹{discount}</span></div>
      <div className="d-flex justify-content-between fw-bold fs-5 mb-3"><span>Total</span><span>₹{total}</span></div>
      <button className="btn btn-saffron" onClick={place}>Place pre-order</button></div></div></div></div>);
}
