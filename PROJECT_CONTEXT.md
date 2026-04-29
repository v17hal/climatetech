# CarbonSmart Solutions Africa — Farm ERP Project Context

> **Last Updated:** 2026-04-23
> **Session:** 6 — Remaining features complete

---

## What We Are Building

A full-featured SaaS web platform for **Carbon Smart Solutions Africa** — a Farm ERP that enables smart farming, soil carbon tracking, geolocation mapping, and advanced analytics for African farmers.

**Tagline:** *Climate Solutions Rooted in African Soil*
**Key Campaign:** "Drop a Seed" — visible on login, help, and dashboard

---

## Brand Identity

### Colours
| Role | Name | Hex |
|---|---|---|
| Primary | Cyan | `#40BBB9` |
| Primary | Green | `#98CF59` |
| Primary | Azure | `#22B3DB` |
| Primary | Green Secondary | `#66C390` |
| Primary | Blue | `#336599` |
| Primary | White | `#FFFFFF` |
| Support | Dark Blue | `#06192C` |
| Support | Light Green | `#A5D34B` |
| Support | Azure Light | `#70C3E8` |

**Font:** Montserrat (primary), Arial (fallback) · via Google Fonts

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Charts:** Recharts · **Maps:** Leaflet + react-leaflet · **State:** Zustand · **Routing:** React Router v6
- **Forms:** React Hook Form + Zod · **Export:** jsPDF + jspdf-autotable + xlsx
- **Weather:** OpenWeatherMap API (with mock fallback when key not set)
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Rate limiting:** express-rate-limit (200 req/15min global, 20/15min on auth)
- **Audit logging:** In-memory ring buffer (500 entries) → ready for DB persistence

---

## Complete Feature Status

### Module 1 — Auth & Farmer Enrollment
- [x] Login page — split panel, demo credentials, Zod validation
- [x] Register page — 3-step wizard (personal → farm → account)
- [x] Forgot password page — email form + confirmation state
- [x] Role-based access (Admin, AgriOfficer, Farmer, Viewer) — Zustand + JWT
- [x] Unique Farmer ID generation (CSA-YYYY-NNNNN)
- [x] Farmer profile management (FarmerFormModal)
- [x] Session management (JWT refresh tokens — backend)

### Module 2 — Dashboard
- [x] Stat cards: Farmers Enrolled, Carbon Tracked, Active Farms, Compliance Rate
- [x] Carbon trend area chart with target line
- [x] Enrollment by farm size bar chart
- [x] Live activity feed
- [x] Recent farmers table with status badges
- [x] Welcome banner with live date and key stats

### Module 3 — Carbon Tracking & Soil Health
- [x] Manual carbon data entry (CarbonEntryModal — farmer, date, method, 4 metrics)
- [x] Sensor / manual input method toggle
- [x] Historical trend chart per farmer (FarmerDetailPage)
- [x] Soil health radar chart (pH, organic matter, moisture, carbon)
- [x] Compliance summary with progress bars
- [x] Province carbon breakdown bar chart
- [x] Recent readings table with method badges
- [x] Export via Analytics module (PDF/CSV/XLS)

### Module 4 — Geolocation & Mapping
- [x] Leaflet map — full SA, custom coloured status pin markers
- [x] Farm boundary polygons (auto-generated from farm size)
- [x] Interactive click-to-draw boundary tool
- [x] Layer toggle: Street / Satellite / Terrain
- [x] Farm list sidebar synced to map selection
- [x] Popup detail on marker click with coordinates
- [x] Map statistics panel (total area, active farms, provinces, drawn boundaries)

### Module 5 — Lifestyle Metrics (LSM)
- [x] LSM scoring tool — 6 weighted questions, auto score + category
- [x] LSM category cards (LSM1–LSM5) with farm counts, click-to-expand
- [x] Targeted service recommendations per tier
- [x] Radar chart of scoring breakdown
- [x] Farm distribution pie + province stacked bar
- [x] Full farmer LSM table with score progress bars

### Module 6 — Smart Farming Tools
- [x] **Irrigation:** usage area chart, efficiency bars, farm vs target chart, schedule table, add modal
- [x] **Pest & Disease:** severity-coded outbreak log, expandable remedies, resolve, report modal with auto-remedy, critical alert banner
- [x] **Weather:** OpenWeatherMap live API with mock fallback, province selector, refresh button, live/mock badge, 7-day forecast, rainfall history, temperature trend, regional risk table
- [x] **Inventory:** full CRUD (add/edit/delete), low-stock alerts, category filter, stock value chart
- [x] **Financials:** income/expense tracking, YTD bar chart, 6-month projection, expense breakdown, record modal

### Module 7 — Analytics & Reporting
- [x] Overview tab: KPI cards, multi-line growth chart, LSM pie + radar, province bar, enrollment area, KPI table
- [x] Report Builder: 4 templates (Carbon, Financial, Performance, Compliance)
- [x] Province/status/date range filters + reset
- [x] Column list display
- [x] Data preview table (first 5 rows inline)
- [x] Full preview modal (all rows, sticky dark header)
- [x] **PDF export** — branded layout (dark header, cyan stripe, auto-table, page-numbered footer)
- [x] **CSV export** — native, quoted values
- [x] **XLS export** — xlsx format, auto column widths

### Module 8 — Platform & Settings
- [x] Settings page: 5 tabs (Profile, Security, Notifications, Platform, Appearance)
  - Profile: name/email/phone/org, avatar initial, account details
  - Security: password change with strength meter, 2FA toggle, active sessions
  - Notifications: 6 alert toggles + 2 delivery channel toggles
  - Platform: language, timezone, currency, metric/imperial, API key management, data export/delete
  - Appearance: theme selector (light active, dark/auto placeholder)
- [x] Help & Support page: search FAQs, 6 quick guides, accordion FAQs (5 categories), contact form, direct contact details, office address
- [x] Audit Log page: admin-only, full event table (user, role, action, resource, IP, duration, status), filters, stats cards
- [x] **GDPR banner** — cookie consent (essential/analytics/functional), localStorage persistence, manage preferences
- [x] **Rate limiting** — 200 req/15min global, 20/15min on auth endpoints
- [x] **Audit logging middleware** — server-side, ring buffer, /api/v1/audit endpoint (admin-only)
- [x] **Mobile responsiveness** — sidebar overlay on mobile with backdrop, hamburger on all sizes, responsive padding

### Non-Functional
- [x] GDPR cookie consent (GDPRBanner component)
- [x] Rate limiting on backend API
- [x] Audit log (backend middleware + frontend admin view)
- [x] Mobile-responsive layout (overlay sidebar, breakpoint-aware margins)
- [x] Zero TypeScript errors across entire frontend codebase
- [x] Service worker / offline sync — SW + IndexedDB queue + auto-sync + header indicator
- [x] i18n scaffolding — react-i18next, 7 languages (EN/ZU/XH/AF/FR/PT/SW), wired to Settings
- [x] Drag-and-drop dashboard — dnd-kit, 15 widget types, add/remove/reset, localStorage save

---

## Build Order — Final Status

| # | Module | Status |
|---|---|---|
| 1 | Project scaffold + Tailwind theme + layout shell | ✅ Done |
| 2 | Auth (login, register, forgot password) + JWT backend | ✅ Done |
| 3 | Dashboard | ✅ Done |
| 4 | Farmer Management (list, detail, add/edit) | ✅ Done |
| 5 | Carbon Tracking & Soil Health | ✅ Done |
| 6 | Geolocation & Mapping | ✅ Done |
| 7 | LSM Profiles | ✅ Done |
| 8 | Smart Farming (Irrigation, Pest, Weather, Inventory, Financials) | ✅ Done |
| 9 | Analytics & Reporting (PDF/CSV/XLS export) | ✅ Done |
| 10 | Settings, Help, Audit Log, GDPR, Rate Limiting, Mobile | ✅ Done |
| 11 | Offline sync / Service Worker / IndexedDB | ✅ Done |
| 12 | i18n (7 languages) + drag-drop dashboard | ✅ Done |

---

## How to Run

### Frontend
```bash
cd client
npm run dev   # → http://localhost:5173
```

### Optional: Live weather data
```bash
# Create client/.env.local and add:
VITE_OPENWEATHER_API_KEY=your_key_here
# Free key at https://openweathermap.org/api
# Leave empty to use built-in mock data (works without a key)
```

### Backend
```bash
cd server
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
npx prisma generate
npm run db:push
npm run dev   # → http://localhost:3001
```

### Demo Credentials (frontend — no DB required)
| Email | Password | Role |
|---|---|---|
| admin@carbonsmart.co.za | admin123 | Admin |
| officer@carbonsmart.co.za | officer123 | Agri Officer |
| farmer@carbonsmart.co.za | farmer123 | Farmer |

---

## Session Log

### Sessions 1–5 — 2026-04-23
All 9 feature modules built. See individual session entries in git history.

### Session 7 — 2026-04-23
**Features Built: Offline Sync, i18n, Drag-and-Drop Dashboard**

**Offline Sync:**
- `public/sw.js` — full service worker: network-first for API, cache-first for assets, SPA navigation fallback, background sync event
- `public/manifest.json` — PWA manifest (installable on mobile)
- `src/services/offlineQueue.ts` — IndexedDB queue via `idb`: enqueue/dequeue/sync with JWT auth
- `src/hooks/useOfflineSync.ts` — React hook: online/offline detection, auto-sync on reconnect, SW message listener, SW registration
- Header updated: offline badge (orange) + pending sync count + one-click sync button

**i18n — 7 Languages:**
- `src/i18n/index.ts` — react-i18next + LanguageDetector, localStorage persistence
- Locale files: English (en), Zulu (zu), Xhosa (xh), Afrikaans (af), French (fr), Portuguese (pt), Swahili (sw)
- Each locale covers: nav, common UI, auth, dashboard, farmers, carbon, LSM, settings, help, offline strings
- Settings → Platform tab language switcher now calls `i18n.changeLanguage()` live — instant UI language switch

**Drag-and-Drop Dashboard:**
- `src/pages/dashboard/CustomDashboardPage.tsx` — 15 widget types across 4 categories (Stats, Charts, Tables, Misc)
- dnd-kit: pointer + keyboard sensors, rect sorting strategy, drag handle per widget
- Add Widget panel (15 options, disabled if already on board)
- Remove widget via × button in edit mode
- Reset to default layout
- Layout persisted to localStorage (`cs-dashboard-layout`)
- Route: `/dashboard/custom` — linked from main dashboard via "Customise Dashboard" button

**Zero TypeScript errors across all files.**

### Session 6 — 2026-04-23
- Audited context file — identified and documented all genuinely missing features
- **Built:** Settings page (5 tabs: profile, security, notifications, platform, appearance)
- **Built:** Help & Support page (search, accordion FAQs, guides, contact form, office info)
- **Built:** Forgot password page (email form + confirmation state)
- **Built:** GDPR cookie consent banner (3 categories, localStorage persistence)
- **Built:** Audit log (backend middleware + ring buffer + admin route + frontend page)
- **Built:** Rate limiting middleware (global + auth-specific)
- **Built:** Mobile responsiveness (overlay sidebar, backdrop, hamburger always visible)
- **Built:** Weather API service (OpenWeatherMap live + mock fallback, risk calculator)
- **Added:** Audit Log to sidebar nav, `/settings/audit` route
- **Added:** `/forgot-password` public route
- **Updated:** All routes wired in App.tsx — zero TypeScript errors
