# Smart Canteen – College Canteen Pre-Order & Management System
MERN stack: React (Vite) + Express + MongoDB (Mongoose), JWT auth, bcrypt, role-based access.

## Setup
1. Install Node 18+ and MongoDB (local, or a free MongoDB Atlas URI).
2. Backend: `cd backend && cp .env.example .env && npm install && npm run seed && npm run dev`  (http://localhost:5000)
3. Frontend: `cd frontend && cp .env.example .env && npm install && npm run dev`  (http://localhost:5173)
4. Demo logins (from seed): student `student@canteen.com / student123`, admin `admin@canteen.com / admin123` (admin login page: `/admin/login`).

## Demo workflow
Student: login → add food → apply `SAVE10` → pick date + slot → place order → see QR in *My orders*.
Admin: *Orders* → Accept → Preparing → Mark ready → *Verify QR* (paste the code) → order completed.
Student: review the food in *My orders*; Admin sees it in *Reviews*. Dashboard shows revenue/charts.

## Which file demonstrates which practical
| Practical | Concept | Files |
|---|---|---|
| 1 | HTML5, CSS3, Bootstrap 5 (navbar, cards, tables, forms, responsive grid) | `frontend/index.html`, `src/styles.css`, all JSX pages |
| 2 | JavaScript: arrays/JSON, validation, cart math, search/filter | `Menu.jsx` (cart, filter, totals), `Auth.jsx` (validation) |
| 3 | React: components, props, state, hooks, Router, context | `App.jsx`, `Admin.jsx` (`Crud` reusable component), `useState/useEffect/useMemo` |
| 4 | Node.js: server, async/await, errors, server validation | `backend/server.js`, `routes/auth.js` (validation) |
| 5 | Express: routes, middleware, auth, error handling | `middleware/auth.js`, `routes/*.js` |
| 6 | REST API: GET/POST/PUT/DELETE, Postman, docs | `routes/catalog.js` (`crud()`), `postman_collection.json`, table below |
| 7 | MongoDB + Mongoose schemas, CRUD, React↔API link | `models/index.js`, `seed.js`, `frontend/src/api.js` |

## API summary (all under `/api`, JWT required except register/login)
- `POST /auth/register`, `POST /auth/login[?role=admin]`, `GET|PUT /auth/me`, `POST /auth/favorite/:foodId`
- `GET|POST /foods`, `PUT|DELETE /foods/:id` (same pattern for `/categories /coupons /slots /inventory`; writes are admin-only)
- `POST /coupon-check`, `GET|POST /reviews`, `GET /students`, `DELETE /students/:id`
- `POST /orders`, `GET /orders/mine`, `PUT /orders/:id/cancel`
- Admin: `GET /orders`, `PUT /orders/:id/status`, `POST /orders/verify`, `GET /orders/stats/summary`

## Postman
Import `postman_collection.json`. Run *Login (admin)*, copy the token into the collection variable `token`, then run the other requests (replace `FOOD_ID`, `ORDER_ID`).

## Deployment
Backend → Render/Railway (set `MONGO_URI` to Atlas, `JWT_SECRET`, `CLIENT_URL`). Frontend → Vercel/Netlify (`npm run build`, set `VITE_API_URL` to the deployed API + `/api`; add a rewrite of all routes to `index.html`).
