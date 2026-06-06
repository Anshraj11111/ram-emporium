# RAM EMPORIUM — Frontend

**React 19 + Vite + TailwindCSS + Glassmorphism UI**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (proxies /api → localhost:5000)
npm run dev

# Build for production
npm run build
```

Open → `http://localhost:3000`

> Backend must be running on port 5000. See `../backend/README.md`.

---

## 📁 Structure

```
src/
├── components/
│   ├── layout/        # AppLayout, Sidebar, Topbar
│   └── ui/            # Button, Input, Select, Modal, Table,
│                      # Badge, Pagination, SearchInput, Skeleton, Card
├── lib/
│   ├── axios.js       # Axios instance + auto token refresh
│   └── utils.js       # formatters, calc helpers, cn()
├── pages/
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Customers.jsx
│   ├── Stock.jsx
│   ├── Quotations.jsx
│   ├── Billing.jsx
│   ├── Reports.jsx
│   ├── Settings.jsx
│   ├── Notifications.jsx
│   ├── Users.jsx
│   └── NotFound.jsx
├── services/
│   └── index.js       # All API call functions
├── store/
│   └── authStore.js   # Zustand auth store (persisted)
├── App.jsx            # Routes + auth guards
└── main.jsx           # React root + QueryClient + Toaster
```

---

## 🎨 Design System

| Feature | Detail |
|---------|--------|
| Style | Glassmorphism — `backdrop-filter: blur(20px)` |
| Theme | Dark — deep navy/purple gradient background |
| Font | Inter (body) + Space Grotesk (headings) |
| Icons | Lucide React |
| Charts | Recharts (Area, Bar, Line, Pie) |
| Animations | CSS keyframes — fadeInUp, slideInLeft, orbFloat, shimmer |
| Colors | Brand indigo `#6366f1` + purple `#8b5cf6` + cyan `#06b6d4` |

---

## 🔑 Key Features

| Page | Features |
|------|----------|
| **Login** | Animated glassmorphism form, OTP forgot-password flow |
| **Dashboard** | Live stats, area chart, low-stock alerts, recent bills, top products |
| **Products** | CRUD, autocomplete search <100ms, low-stock badge, category filter |
| **Customers** | CRUD, GST/non-GST filter, mobile search |
| **Stock** | Live stock levels, purchase entry, adjustment, paginated ledger |
| **Quotations** | Full item builder with live calc, duplicate, PDF download, convert→bill |
| **Billing** | GST/Non-GST bill creation, customer+product autocomplete, live totals, PDF |
| **Reports** | Daily/Monthly/Yearly/Top Products/Customer-wise/Low Stock/Profit |
| **Settings** | Shop info, logo upload, invoice prefixes, bank details |
| **Notifications** | Real-time alerts, mark read/all-read |
| **Users** | Admin-only, register users, activate/deactivate |

---

## 🔐 Auth Flow

1. Login → JWT access token (15m) + refresh token (7d) stored in localStorage
2. Axios interceptor auto-attaches `Authorization: Bearer <token>` header
3. On 401 → auto refresh → retry original request
4. On refresh failure → clear storage → redirect to `/login`
5. Zustand store persisted via `localStorage` key `ram-auth`

---

## 📦 Tech Stack

| Library | Version | Use |
|---------|---------|-----|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| TailwindCSS | 3.4 | Utility CSS |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state + caching |
| Zustand | 4 | Auth store |
| Axios | 1.7 | HTTP client |
| React Hook Form | 7 | Form management |
| Zod | 3 | Validation schemas |
| Recharts | 2.12 | Charts |
| Lucide React | 0.447 | Icons |
| React Hot Toast | 2.4 | Notifications |

---

## 🌐 Proxy

In development, Vite proxies `/api/*` → `http://localhost:5000`.  
In production, configure your web server (Nginx/Apache) to proxy `/api` to the backend.

---

## 🏗️ Production Build

```bash
npm run build
# Output: dist/ folder — serve with any static file server
```

**Nginx config snippet:**
```nginx
location / {
  root /var/www/ram-emporium/dist;
  try_files $uri /index.html;
}
location /api {
  proxy_pass http://localhost:5000;
}
```
