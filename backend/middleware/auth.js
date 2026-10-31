const jwt = require('jsonwebtoken');
// Authentication: verifies the JWT sent as "Authorization: Bearer <token>"
exports.protect = (req, res, next) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Please login first' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Invalid or expired token' }); }
};
// Authorization (role-based access control)
exports.adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only' });
// Central error handler (registered last in server.js)
exports.errorHandler = (err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
// Wrap async handlers so errors reach errorHandler (Practical 4: async handling)
exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.fail = (status, message) => Object.assign(new Error(message), { status });
