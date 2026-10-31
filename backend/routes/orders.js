const router = require('express').Router();
const crypto = require('crypto');
const { Order, FoodItem, Coupon, PickupSlot, Inventory, User } = require('../models');
const { protect, adminOnly, wrap, fail } = require('../middleware/auth');

// POST /api/orders - totals are recalculated on the SERVER (never trust the client)
router.post('/', protect, wrap(async (req, res) => {
  const { items, pickupDate, slot, payment, coupon } = req.body;
  if (!items?.length) throw fail(400, 'Cart is empty');
  if (!pickupDate || !slot) throw fail(400, 'Choose pickup date and time slot');
  const slotDoc = await PickupSlot.findOne({ label: slot });
  if (slotDoc && (await Order.countDocuments({ slot, pickupDate, status: { $nin: ['cancelled', 'rejected'] } })) >= slotDoc.maxOrders)
    throw fail(400, 'This time slot is full');
  const lines = [];
  for (const i of items) {
    const f = await FoodItem.findById(i.food);
    if (!f || !f.available) throw fail(400, `${f?.name || 'Item'} is not available`);
    const inv = await Inventory.findOne({ food: f._id });
    if (inv && inv.stock < i.qty) throw fail(400, `Only ${inv.stock} ${f.name} left`);
    lines.push({ food: f._id, name: f.name, price: f.price, qty: i.qty });
  }
  for (const l of lines) await Inventory.findOneAndUpdate({ food: l.food }, { $inc: { stock: -l.qty } });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const c = coupon ? await Coupon.findOne({ code: coupon.toUpperCase(), active: true }) : null;
  const discount = c ? Math.round((subtotal * c.percent) / 100) : 0;
  res.status(201).json(await Order.create({ user: req.user.id, items: lines, subtotal, discount, total: subtotal - discount,
    coupon: c?.code, pickupDate, slot, payment, qrToken: crypto.randomBytes(8).toString('hex') }));
}));

router.get('/mine', protect, wrap(async (req, res) => res.json(await Order.find({ user: req.user.id }).sort('-createdAt'))));

// PUT /api/orders/:id/cancel - allowed only before preparation starts
router.put('/:id/cancel', protect, wrap(async (req, res) => {
  const o = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!o) throw fail(404, 'Order not found');
  if (!['pending', 'accepted'].includes(o.status)) throw fail(400, 'Order is already being prepared');
  o.status = 'cancelled'; await o.save();
  for (const l of o.items) await Inventory.findOneAndUpdate({ food: l.food }, { $inc: { stock: l.qty } });
  res.json(o);
}));

// ---- Admin ----
router.get('/', protect, adminOnly, wrap(async (req, res) => res.json(await Order.find().populate('user', 'name email').sort('-createdAt'))));
router.put('/:id/status', protect, adminOnly, wrap(async (req, res) => {
  const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!o) throw fail(404, 'Order not found');
  await User.findByIdAndUpdate(o.user, { $push: { notifications: { text: `Your order is now ${o.status}` } } });
  res.json(o);
}));
// POST /api/orders/verify {token} - QR pickup verification
router.post('/verify', protect, adminOnly, wrap(async (req, res) => {
  const o = await Order.findOne({ qrToken: (req.body.token || '').trim() }).populate('user', 'name');
  if (!o) throw fail(404, 'Invalid QR code');
  if (o.status === 'completed') throw fail(400, 'Order already collected');
  if (o.status !== 'ready') throw fail(400, `Order is ${o.status}, not ready yet`);
  o.status = 'completed'; await o.save(); res.json(o);
}));
// GET /api/orders/stats/summary - dashboard numbers + sales by day/week/month
router.get('/stats/summary', protect, adminOnly, wrap(async (req, res) => {
  const all = await Order.find(), done = all.filter((o) => o.status === 'completed');
  const bucket = (fmt) => { const m = {}; done.forEach((o) => { const k = fmt(o.createdAt); m[k] = (m[k] || 0) + o.total; }); return Object.entries(m).map(([label, total]) => ({ label, total })); };
  const week = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return x.toISOString().slice(0, 10); };
  res.json({ totalOrders: all.length, revenue: done.reduce((s, o) => s + o.total, 0),
    pending: all.filter((o) => o.status === 'pending').length, completed: done.length,
    daily: bucket((d) => d.toISOString().slice(0, 10)), weekly: bucket(week), monthly: bucket((d) => d.toISOString().slice(0, 7)),
    lowStock: (await Inventory.find().populate('food')).filter((i) => i.stock <= i.lowStockAt) });
}));
module.exports = router;
