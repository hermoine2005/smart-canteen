// Routing + auth/cart context (React Router, Hooks, Context)
import { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthPage } from './pages/Auth.jsx'; import Menu from './pages/Menu.jsx';
import Orders from './pages/Orders.jsx'; import Admin from './pages/Admin.jsx';
export const AppCtx = createContext(); export const useApp = () => useContext(AppCtx);

function Protected({ role, children }) {            // role-based route guard
  const { user } = useApp();
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} />;
  return user.role === role ? children : <Navigate to="/" />;
}
function StudentNav() {
  const { user, logout, cart } = useApp();
  return (<nav className="navbar navbar-expand topbar px-3"><span className="navbar-brand fw-bold">Smart Canteen</span>
    <div className="navbar-nav me-auto"><NavLink className="nav-link" to="/" end>Menu</NavLink><NavLink className="nav-link" to="/orders">My orders</NavLink></div>
    <span className="text-white me-3 d-none d-md-inline">{user.name} · {cart.reduce((s, i) => s + i.qty, 0)} in cart</span>
    <button className="btn btn-sm btn-saffron" onClick={logout}>Log out</button></nav>);
}
export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));   // array of {food,qty}
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  const login = (d) => { localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); setUser(d.user); nav(d.user.role === 'admin' ? '/admin' : '/'); };
  const logout = () => { localStorage.clear(); setUser(null); setCart([]); nav('/login'); };
  return (<AppCtx.Provider value={{ user, login, logout, cart, setCart }}><Routes>
    <Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} />
    <Route path="/admin/login" element={<AuthPage admin />} />
    <Route path="/" element={<Protected role="student"><StudentNav /><Menu /></Protected>} />
    <Route path="/orders" element={<Protected role="student"><StudentNav /><Orders /></Protected>} />
    <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
    <Route path="*" element={<Navigate to="/" />} /></Routes></AppCtx.Provider>);
}
