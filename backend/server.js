require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const { errorHandler } = require('./middleware/auth');
const app = express();

// Allowed websites (frontend URLs)
const extraOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // no origin = Postman / server-to-server, allow
    if (!origin) return callback(null, true);
    const ok =
      origin.startsWith('http://localhost') ||
      /^https:\/\/smart-canteen[a-z0-9-]*\.vercel\.app$/.test(origin) ||
      extraOrigins.includes(origin);
    callback(null, ok);
  },
}));

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