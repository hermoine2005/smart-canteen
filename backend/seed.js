// Run once:  npm run seed   -> creates admin, student, categories, foods, stock, slots, coupons
require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User, Category, FoodItem, Inventory, PickupSlot, Coupon } = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Category, FoodItem, Inventory, PickupSlot, Coupon].map((m) => m.deleteMany()));
  await User.create([
    { name: 'Canteen Admin', email: 'admin@canteen.com', role: 'admin', password: await bcrypt.hash('admin123', 10) },
    { name: 'Riya Student', email: 'student@canteen.com', password: await bcrypt.hash('student123', 10) }]);
  const cats = await Category.insertMany(['Snacks', 'Meals', 'Beverages', 'Desserts'].map((name) => ({ name })));
  const img = (id) => `https://images.unsplash.com/${id}?w=500&q=70`;
  const foods = await FoodItem.insertMany([
    ['Veg Sandwich', 40, 0, 'photo-1528735602780-2552fd46c7af'], ['Samosa (2 pcs)', 30, 0, 'photo-1601050690597-df0568f70950'],
    ['Veg Thali', 90, 1, 'photo-1567188040759-fb8a883dc6d8'], ['Paneer Wrap', 70, 1, 'photo-1626700051175-6818013e1d4f'],
    ['Masala Chai', 15, 2, 'photo-1571934811356-5cc061b6821f'], ['Cold Coffee', 50, 2, 'photo-1461023058943-07fcbe16d735'],
    ['Gulab Jamun', 35, 3, 'photo-1666190092689-e3968aa0c8d4'], ['Chocolate Brownie', 55, 3, 'photo-1606313564200-e75d5e30476c']
  ].map(([name, price, c, id]) => ({ name, price, category: cats[c]._id, image: img(id), description: `Fresh ${name.toLowerCase()} made daily` })));
  await Inventory.insertMany(foods.map((f, i) => ({ food: f._id, stock: i === 7 ? 3 : 40 })));
  await PickupSlot.insertMany(['11:00 - 11:15', '12:00 - 12:15', '13:00 - 13:15', '16:00 - 16:15'].map((label) => ({ label, maxOrders: 10 })));
  await Coupon.insertMany([{ code: 'SAVE10', percent: 10 }, { code: 'FEST20', percent: 20 }]);
  console.log('Seeded! admin@canteen.com / admin123   student@canteen.com / student123');
  process.exit();
})();
