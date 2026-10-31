const router = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models');
const { wrap, fail, protect } = require('../middleware/auth');
const sign = (u) => jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register  (server-side validation)
router.post('/register', wrap(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || name.length < 2) throw fail(400, 'Name must be at least 2 characters');
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw fail(400, 'Enter a valid email');
  if (!password || password.length < 6) throw fail(400, 'Password must be at least 6 characters');
  if (await User.findOne({ email })) throw fail(409, 'Email already registered');
  const user = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: { id: user._id, name, email, role: user.role } });
}));

// POST /api/auth/login  (?role=admin is used by the separate admin login page)
router.post('/login', wrap(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) throw fail(401, 'Wrong email or password');
  if (req.query.role === 'admin' && user.role !== 'admin') throw fail(403, 'Not an admin account');
  res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

// GET/PUT /api/auth/me  (profile + notifications + favourites)
router.get('/me', protect, wrap(async (req, res) => res.json(await User.findById(req.user.id).select('-password'))));
router.put('/me', protect, wrap(async (req, res) => {
  res.json(await User.findByIdAndUpdate(req.user.id, { name: req.body.name, phone: req.body.phone }, { new: true }).select('-password'));
}));
router.post('/favorite/:foodId', protect, wrap(async (req, res) => {   // toggle favourite
  const u = await User.findById(req.user.id), id = req.params.foodId;
  u.favorites = u.favorites.some((f) => String(f) === id) ? u.favorites.filter((f) => String(f) !== id) : [...u.favorites, id];
  await u.save(); res.json(u.favorites);
}));
module.exports = router;
