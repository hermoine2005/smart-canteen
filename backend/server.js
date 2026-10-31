// Entry point (Practical 4: Node.js, Practical 5: Express)
require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const { errorHandler } = require('./middleware/auth');
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/catalog'));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000));
}).catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });
