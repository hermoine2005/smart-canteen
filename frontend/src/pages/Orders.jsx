// Order tracking, history, reorder, cancel, QR code, reviews, profile + notifications
import { useEffect, useState } from 'react'; import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api.js'; import { useApp } from '../App.jsx';
export default function Orders() {
  const { setCart } = useApp(); const nav = useNavigate();
  const [orders, setOrders] = useState([]); const [me, setMe] = useState(null); const [msg, setMsg] = useState('');
  const [review, setReview] = useState({}); const [foods, setFoods] = useState([]);
  const load = async () => { try { setOrders(await api('/orders/mine')); setMe(await api('/auth/me')); setFoods(await api('/foods')); } catch (e) { setMsg(e.message); } };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);   // live status refresh
  const cancel = async (id) => { try { await api(`/orders/${id}/cancel`, 'PUT'); setMsg('Order cancelled'); load(); } catch (e) { setMsg(e.message); } };
  const reorder = (o) => { setCart(o.items.map((i) => ({ food: foods.find((f) => f._id === i.food) || { _id: i.food, name: i.name, price: i.price }, qty: i.qty }))); nav('/'); };
  const sendReview = async (foodId) => { const r = review[foodId] || {}; try { await api('/reviews', 'POST', { food: foodId, rating: +r.rating, comment: r.comment }); setMsg('Thanks for your review!'); } catch (e) { setMsg(e.message); } };
  const saveProfile = async (e) => { e.preventDefault(); try { setMe(await api('/auth/me', 'PUT', { name: me.name, phone: me.phone })); setMsg('Profile saved'); } catch (er) { setMsg(er.message); } };
  return (<div className="container py-4">
    {msg && <div className="alert alert-info" onClick={() => setMsg('')}>{msg}</div>}
    <div className="row g-4"><div className="col-lg-8"><h4>My orders</h4>
      {!orders.length && <p className="text-muted">No orders yet. Pick something from the menu.</p>}
      {orders.map((o) => (<div className="card card-body border-0 shadow-sm mb-3" key={o._id}>
        <div className="d-flex justify-content-between"><strong>{o.pickupDate} · {o.slot}</strong><span className={`status ${o.status}`}>{o.status}</span></div>
        <ul className="my-2 ps-3">{o.items.map((i, k) => <li key={k}>{i.qty} × {i.name}</li>)}</ul>
        <div>Total ₹{o.total} {o.discount > 0 && <small className="text-muted">(saved ₹{o.discount})</small>} · {o.payment}</div>
        {!['cancelled', 'rejected', 'completed'].includes(o.status) && <div className="my-2"><QRCodeSVG value={o.qrToken} size={96} /><div><small className="text-muted">Show this at the counter · code {o.qrToken}</small></div></div>}
        <div className="d-flex gap-2 flex-wrap mt-2"><button className="btn btn-sm btn-outline-dark" onClick={() => reorder(o)}>Reorder</button>
          {['pending', 'accepted'].includes(o.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(o._id)}>Cancel order</button>}</div>
        {o.status === 'completed' && o.items.map((i) => (<div className="input-group input-group-sm mt-2" key={i.food}><span className="input-group-text">{i.name}</span>
          <select className="form-select" onChange={(e) => setReview({ ...review, [i.food]: { ...review[i.food], rating: e.target.value } })}><option value="">Rating</option>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
          <input className="form-control" placeholder="Comment" onChange={(e) => setReview({ ...review, [i.food]: { ...review[i.food], comment: e.target.value } })} />
          <button className="btn btn-brand" onClick={() => sendReview(i.food)}>Review</button></div>))}
      </div>))}</div>
    <div className="col-lg-4">{me && <><h4>Profile</h4><form onSubmit={saveProfile} className="card card-body border-0 shadow-sm mb-3">
      <input className="form-control mb-2" value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} />
      <input className="form-control mb-2" placeholder="Phone" value={me.phone || ''} onChange={(e) => setMe({ ...me, phone: e.target.value })} />
      <button className="btn btn-brand">Save profile</button></form>
      <h5>Notifications</h5>{[...me.notifications].reverse().slice(0, 6).map((n, i) => <div key={i} className="small border-bottom py-1">{n.text}</div>)}</>}</div></div></div>);
}
