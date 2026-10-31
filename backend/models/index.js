// All 8 Mongoose schemas (Practical 7). Each schema = one MongoDB collection.
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });

exports.User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },          // bcrypt hash
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  phone: String,
  favorites: [ref('FoodItem')],
  notifications: [{ text: String, date: { type: Date, default: Date.now } }]
}, { timestamps: true }));

exports.Category = model('Category', new Schema({ name: { type: String, required: true, unique: true } }));

exports.FoodItem = model('FoodItem', new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: String,
  category: ref('Category'),
  available: { type: Boolean, default: true },
  description: String
}, { timestamps: true }));

exports.Inventory = model('Inventory', new Schema({
  food: { ...ref('FoodItem'), unique: true },
  stock: { type: Number, default: 0, min: 0 },
  lowStockAt: { type: Number, default: 5 }
}));

exports.PickupSlot = model('PickupSlot', new Schema({
  label: { type: String, required: true },              // e.g. "12:00 - 12:15"
  maxOrders: { type: Number, default: 10 }
}));

exports.Coupon = model('Coupon', new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  percent: { type: Number, min: 1, max: 100, required: true },
  active: { type: Boolean, default: true }
}));

exports.Review = model('Review', new Schema({
  user: ref('User'), food: ref('FoodItem'),
  rating: { type: Number, min: 1, max: 5, required: true }, comment: String
}, { timestamps: true }));

exports.Order = model('Order', new Schema({
  user: ref('User'),
  items: [{ food: ref('FoodItem'), name: String, price: Number, qty: Number }],
  subtotal: Number, discount: { type: Number, default: 0 }, total: Number,
  coupon: String,
  pickupDate: String, slot: String,
  payment: { type: String, enum: ['counter', 'online'], default: 'counter' },
  status: { type: String, enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled'], default: 'pending' },
  qrToken: String
}, { timestamps: true }));
