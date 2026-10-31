// Admin panel: separate layout with sidebar. One file, one small component per tab.
import { useEffect, useState } from 'react'; import { api } from '../api.js'; import { useApp } from '../App.jsx';
const TABS = ['Dashboard', 'Orders', 'Foods', 'Inventory', 'Coupons', 'Slots', 'Reviews', 'Students', 'Verify QR'];
const useLoad = (path) => { const [d, setD] = useState([]); const load = () => api(path).then(setD).catch(() => {}); useEffect(() => { load(); }, []); return [d, load]; };

function Dashboard() {
  const [s, setS] = useState(null); const [range, setRange] = useState('daily'); const [orders] = useLoad('/orders');
  useEffect(() => { api('/orders/stats/summary').then(setS); }, []);
  const report = () => {      // sales report as CSV download
    const rows = [['Date', 'Student', 'Total', 'Status'], ...orders.map((o) => [o.createdAt.slice(0, 10), o.user?.name, o.total, o.status])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'sales-report.csv'; a.click();
  };
  if (!s) return <div className="spinner-border" />;
  const data = s[range], max = Math.max(1, ...data.map((d) => d.total));
  return (<><div className="row g-3 mb-4">{[['Total orders', s.totalOrders], ['Revenue', '₹' + s.revenue], ['Pending', s.pending], ['Completed', s.completed]].map(([l, v]) => <div className="col-6 col-md-3" key={l}><div className="stat"><div className="text-muted small">{l}</div><div className="fs-3 fw-bold">{v}</div></div></div>)}</div>
    <div className="d-flex justify-content-between mb-2"><div className="btn-group">{['daily', 'weekly', 'monthly'].map((r) => <button key={r} className={`btn btn-sm ${r === range ? 'btn-brand' : 'btn-outline-dark'}`} onClick={() => setRange(r)}>{r}</button>)}</div><button className="btn btn-sm btn-saffron" onClick={report}>Download sales report</button></div>
    <div className="d-flex align-items-end gap-2 bg-white p-3 rounded" style={{ height: 200, overflowX: 'auto' }}>{!data.length && <span className="text-muted">No completed sales yet.</span>}{data.map((d) => <div key={d.label} className="text-center small"><div className="bar" style={{ height: (d.total / max) * 130 }} title={'₹' + d.total} />₹{d.total}<br />{d.label.slice(-5)}</div>)}</div>
    {s.lowStock.length > 0 && <div className="alert alert-warning mt-3"><strong>Low stock:</strong> {s.lowStock.map((i) => `${i.food?.name} (${i.stock})`).join(', ')}</div>}</>);
}
function Orders() {
  const [orders, load] = useLoad('/orders');
  const set = async (id, status) => { await api(`/orders/${id}/status`, 'PUT', { status }); load(); };
  return (<div className="table-responsive"><table className="table bg-white"><thead><tr><th>Student</th><th>Items</th><th>Pickup</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>
    {orders.map((o) => <tr key={o._id}><td>{o.user?.name}</td><td>{o.items.map((i) => `${i.qty}×${i.name}`).join(', ')}</td><td>{o.pickupDate}<br />{o.slot}</td><td>₹{o.total}</td><td><span className={`status ${o.status}`}>{o.status}</span></td>
      <td className="d-flex gap-1 flex-wrap">{o.status === 'pending' && <><button className="btn btn-sm btn-brand" onClick={() => set(o._id, 'accepted')}>Accept</button><button className="btn btn-sm btn-outline-danger" onClick={() => set(o._id, 'rejected')}>Reject</button></>}
        {o.status === 'accepted' && <button className="btn btn-sm btn-outline-dark" onClick={() => set(o._id, 'preparing')}>Preparing</button>}
        {o.status === 'preparing' && <button className="btn btn-sm btn-saffron" onClick={() => set(o._id, 'ready')}>Mark ready</button>}</td></tr>)}</tbody></table></div>);
}
// Reusable add/edit/delete table used by Foods, Coupons, Slots (reusable component + props)
function Crud({ path, fields, cols, populate }) {
  const [rows, load] = useLoad(path); const [form, setForm] = useState({}); const [err, setErr] = useState(''); const [cats] = useLoad('/categories');
  const save = async (e) => { e.preventDefault(); setErr('');
    const missing = fields.find((f) => f.required && !form[f.k] && form[f.k] !== false); if (missing) return setErr(`${missing.label} is required`);
    try { form._id ? await api(`${path}/${form._id}`, 'PUT', form) : await api(path, 'POST', form); setForm({}); load(); } catch (er) { setErr(er.message); } };
  const del = async (id) => { if (window.confirm('Delete this item?')) { await api(`${path}/${id}`, 'DELETE'); load(); } };
  return (<><form onSubmit={save} className="row g-2 bg-white p-3 rounded mb-3">{err && <div className="alert alert-danger py-1">{err}</div>}
    {fields.map((f) => <div className="col-md" key={f.k}>{f.k === 'category' ? <select className="form-select" value={form.category?._id || form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Category</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      : f.k === 'available' ? <label className="form-check"><input type="checkbox" className="form-check-input" checked={form.available ?? true} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available</label>
      : <input className="form-control" placeholder={f.label} type={f.type || 'text'} value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />}</div>)}
    <div className="col-auto"><button className="btn btn-brand">{form._id ? 'Update' : 'Add'}</button>{form._id && <button type="button" className="btn btn-link" onClick={() => setForm({})}>Cancel</button>}</div></form>
    <div className="table-responsive"><table className="table bg-white"><thead><tr>{cols.map((c) => <th key={c.k}>{c.label}</th>)}<th /></tr></thead><tbody>{rows.map((r) => <tr key={r._id}>{cols.map((c) => <td key={c.k}>{c.render ? c.render(r) : String(r[c.k])}</td>)}
      <td><button className="btn btn-sm btn-outline-dark me-1" onClick={() => setForm(r)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => del(r._id)}>Delete</button></td></tr>)}</tbody></table></div></>);
}
function Inventory() {
  const [rows, load] = useLoad('/inventory');
  const upd = async (r, stock) => { await api(`/inventory/${r._id}`, 'PUT', { stock }); load(); };
  return (<table className="table bg-white"><thead><tr><th>Food</th><th>Stock</th><th>Set stock</th></tr></thead><tbody>{rows.map((r) => <tr key={r._id} className={r.stock <= r.lowStockAt ? 'table-warning' : ''}><td>{r.food?.name}</td><td>{r.stock} {r.stock <= r.lowStockAt && '⚠ low'}</td>
    <td><input type="number" min="0" className="form-control form-control-sm w-50" defaultValue={r.stock} onBlur={(e) => +e.target.value !== r.stock && upd(r, +e.target.value)} /></td></tr>)}</tbody></table>);
}
function Reviews() { const [r] = useLoad('/reviews'); return (<>{!r.length && <p>No reviews yet.</p>}{r.map((x) => <div className="bg-white p-3 rounded mb-2" key={x._id}><strong>{x.food?.name}</strong> — {'★'.repeat(x.rating)} <small className="text-muted">by {x.user?.name}</small><div>{x.comment}</div></div>)}</>); }
function Students() { const [s, load] = useLoad('/students'); return (<table className="table bg-white"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th /></tr></thead><tbody>{s.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td><td><button className="btn btn-sm btn-outline-danger" onClick={async () => { if (window.confirm('Remove student?')) { await api(`/students/${u._id}`, 'DELETE'); load(); } }}>Remove</button></td></tr>)}</tbody></table>); }
function Verify() {
  const [token, setToken] = useState(''); const [res, setRes] = useState(null);
  const go = async (e) => { e.preventDefault(); try { const o = await api('/orders/verify', 'POST', { token }); setRes({ ok: true, text: `Verified ✔ ${o.user?.name}: ${o.items.map((i) => `${i.qty}×${i.name}`).join(', ')} — hand over the order.` }); } catch (er) { setRes({ ok: false, text: er.message }); } };
  return (<form onSubmit={go} style={{ maxWidth: 420 }}><p>Type the code shown under the student's QR code.</p><div className="input-group mb-3"><input className="form-control" value={token} onChange={(e) => setToken(e.target.value)} placeholder="QR code" /><button className="btn btn-brand">Verify pickup</button></div>{res && <div className={`alert alert-${res.ok ? 'success' : 'danger'}`}>{res.text}</div>}</form>);
}
export default function Admin() {
  const { user, logout } = useApp(); const [tab, setTab] = useState('Dashboard');
  const views = {
    Dashboard: <Dashboard />, Orders: <Orders />, Inventory: <Inventory />, Reviews: <Reviews />, Students: <Students />, 'Verify QR': <Verify />,
    Foods: <Crud path="/foods" fields={[{ k: 'name', label: 'Name', required: 1 }, { k: 'price', label: 'Price', type: 'number', required: 1 }, { k: 'image', label: 'Image URL' }, { k: 'category' }, { k: 'available' }]} cols={[{ k: 'name', label: 'Name' }, { k: 'price', label: '₹' }, { k: 'category', label: 'Category', render: (r) => r.category?.name }, { k: 'available', label: 'Available' }]} />,
    Coupons: <Crud path="/coupons" fields={[{ k: 'code', label: 'Code', required: 1 }, { k: 'percent', label: 'Percent', type: 'number', required: 1 }]} cols={[{ k: 'code', label: 'Code' }, { k: 'percent', label: '% off' }]} />,
    Slots: <Crud path="/slots" fields={[{ k: 'label', label: 'e.g. 12:00 - 12:15', required: 1 }, { k: 'maxOrders', label: 'Order limit', type: 'number' }]} cols={[{ k: 'label', label: 'Slot' }, { k: 'maxOrders', label: 'Max orders' }]} /> };
  return (<div className="d-flex admin-wrap"><div className="sidebar p-2"><h5 className="text-white p-2">Canteen Admin</h5>{TABS.map((t) => <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}<button onClick={logout}>Log out ({user.name})</button></div>
    <main className="flex-grow-1 p-4"><h3 className="mb-3">{tab}</h3>{views[tab]}</main></div>);
}
