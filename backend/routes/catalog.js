// Generic CRUD (GET/POST/PUT/DELETE) for Categories, Foods, Coupons, Slots, Inventory
const router = require('express').Router();
const { Category, FoodItem, Coupon, PickupSlot, Inventory, Review, User } = require('../models');
const { protect, adminOnly, wrap, fail } = require('../middleware/auth');

function crud(path, Model, populate = '') {
  router.get(`/${path}`, protect, wrap(async (req, res) => res.json(await Model.find().populate(populate))));
  router.post(`/${path}`, protect, adminOnly, wrap(async (req, res) => res.status(201).json(await Model.create(req.body))));
  router.put(`/${path}/:id`, protect, adminOnly, wrap(async (req, res) => {
    const d = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!d) throw fail(404, 'Not found'); res.json(d);
  }));
  router.delete(`/${path}/:id`, protect, adminOnly, wrap(async (req, res) => {
    await Model.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' });
  }));
}
crud('categories', Category); crud('foods', FoodItem, 'category'); crud('coupons', Coupon);
crud('slots', PickupSlot); crud('inventory', Inventory, 'food');

// Coupon check used by the cart: POST /api/coupon-check {code}
router.post('/coupon-check', protect, wrap(async (req, res) => {
  const c = await Coupon.findOne({ code: (req.body.code || '').toUpperCase(), active: true });
  if (!c) throw fail(404, 'Invalid or expired coupon'); res.json(c);
}));

// Reviews
router.get('/reviews', protect, wrap(async (req, res) =>
  res.json(await Review.find(req.query.food ? { food: req.query.food } : {}).populate('user', 'name').populate('food', 'name').sort('-createdAt'))));
router.post('/reviews', protect, wrap(async (req, res) => {
  const { food, rating, comment } = req.body;
  if (!food || !(rating >= 1 && rating <= 5)) throw fail(400, 'Rating 1-5 required');
  res.status(201).json(await Review.create({ user: req.user.id, food, rating, comment }));
}));

// Registered students (admin)
router.get('/students', protect, adminOnly, wrap(async (req, res) => res.json(await User.find({ role: 'student' }).select('-password'))));
router.delete('/students/:id', protect, adminOnly, wrap(async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }));
module.exports = router;
