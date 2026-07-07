# CarbonSmart Solutions Africa — QA Test Plan

**Product:** CarbonSmart Farm ERP + Biochar Carbon-Credit dMRV Platform
**Version:** 2.0.0
**Document owner:** _____________  **Date:** _____________
**Build under test:** branch `main` / commit `__________`

---

## 1. Purpose & Scope

This document gives QA a complete, repeatable set of manual test cases covering:

- **Farm ERP** — farmer enrolment, carbon tracking, mapping, LSM, smart-farming tools, analytics.
- **Biochar dMRV** — production log, mass balance, chain-of-custody (dCoC), lab workflow, harvest/yield, seasonality, carbon ledger.
- **Role-based access control** (5 roles) and the **3 validation gates** + evidence locks.
- **Farmer value view**, **public passport**, **non-functional** (offline, i18n, GDPR, security, responsive).

Every test lists **Steps → Expected Result**. Mark each **Pass / Fail / Blocked** and log defects with the ID (e.g. `TC-DMRV-03`), screenshot, and console output.

---

## 2. Test Environment Setup

### 2.1 Prerequisites
| Item | Value |
|---|---|
| Node.js | 20+ |
| Browsers | Chrome (primary), Firefox, Safari, Edge; plus one mobile browser |
| Backend URL | http://localhost:3001 |
| Frontend URL | http://localhost:5173 |

### 2.2 Bring the system up (clean slate)
```bash
# Backend
cd server
npm install
npm run db:push          # apply schema
npm run db:seed          # load demo data (resets DB every run)
npm run dev              # → http://localhost:3001

# Frontend (new terminal)
cd client
npm install
npm run dev              # → http://localhost:5173
```

### 2.3 Health check before testing
1. Open `http://localhost:3001/api/health` → expect `{"status":"ok","service":"CarbonSmart API","version":"2.0.0"}`.
2. Open `http://localhost:5173/login` → login page renders.
3. **Re-seed between test cycles** (`npm run db:seed`) so gate/mass-balance tests start from known data.

### 2.4 Test accounts (seeded)
| Role | Email | Password |
|---|---|---|
| CSSA Admin | admin@carbonsmart.co.za | admin123 |
| Field Officer | officer@carbonsmart.co.za | officer123 |
| Lab Technician | lab@carbonsmart.co.za | lab123 |
| VVB Auditor | auditor@carbonsmart.co.za | auditor123 |
| Farmer | farmer@carbonsmart.co.za | farmer123 |

### 2.5 Reference demo data (after fresh seed)
- Batches: **BC-2026-001** (Green/eligible), **BC-2026-002** (Green/eligible), **BC-2026-003** (Rejected, H:C 0.82), **BC-2026-004** (Produced, awaiting).
- Samples: SS-2026-0001..0005 spanning all dCoC states.
- Farmers: CSA-2024-00001 (John Mwangi), -00002, -00003, CSA-2025-00004 (Grace Banda), -00005.
- One field photo is intentionally **flagged** (boundary mismatch).

> **Severity key:** S1 Critical (blocks release) · S2 Major · S3 Minor · S4 Cosmetic.

---

## 3. Test Data Cheat-Sheet (for gate testing)

| Gate | Input that PASSES | Input that TRIPS the gate |
|---|---|---|
| Gate 1 — Pyrolysis | temp ≥ 350 °C | temp < 350 °C → **rejected, not saved** |
| Gate 2 — Seasonality | harvest within regional window ±30 days & matching crop | outside window >30 days OR wrong crop → **saved but flagged** |
| Gate 3 — Lab quality | H:C < 0.70 **and** heavy metals Pass | H:C ≥ 0.70 OR heavy metals Fail → **saved, sample rejected, issuance locked** |

---

## 4. Authentication & Session (TC-AUTH)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-AUTH-01 | Valid login (each role) | For each of the 5 accounts: go to /login, enter creds, Sign In | Redirect to /dashboard (farmer → farmer view); welcome toast; role-appropriate sidebar | S1 |
| TC-AUTH-02 | Demo autofill | Click a demo-credential row on the login page | Email + password fields auto-populate | S3 |
| TC-AUTH-03 | Invalid password | Login with correct email, wrong password | Error toast "Invalid credentials"; stays on login | S2 |
| TC-AUTH-04 | Empty/short fields | Submit blank; submit password < 6 chars | Inline Zod validation errors; no request sent | S3 |
| TC-AUTH-05 | Session persists | Log in, refresh the browser (F5) | Still authenticated, same page | S2 |
| TC-AUTH-06 | Logout | Click logout in sidebar | Redirect to /login; back-button does not re-enter app | S2 |
| TC-AUTH-07 | Protected route guard | While logged out, visit /dashboard directly | Redirected to /login | S1 |
| TC-AUTH-08 | Token refresh | Log in, leave idle >15 min, then perform an action | Action succeeds (access token silently refreshed), no forced logout | S2 |
| TC-AUTH-09 | Registration (new farmer) | /register → complete 3-step wizard → submit | 201; auto-login; new farmer ID `CSA-YYYY-NNNNN`; lands on dashboard | S1 |
| TC-AUTH-10 | Duplicate email | Register with `farmer@carbonsmart.co.za` | Error "Email already registered" (409) | S2 |
| TC-AUTH-11 | Offline login fallback | Stop the backend, log in with a demo account | Logs in with "(offline demo mode)" toast | S3 |
| TC-AUTH-12 | Rate limiting | Fire >20 login attempts in 15 min (script or rapid clicks) | Later attempts return 429 "Too many auth attempts" | S3 |

---

## 5. Role-Based Access Control (TC-RBAC)

> Verify both the **UI** (hidden nav/buttons) and the **API** (direct call returns 403). For API checks use DevTools console or curl with the role's token.

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-RBAC-01 | Admin sees everything | Login admin | Sidebar shows Farmers, Carbon, Map, LSM, **dMRV Registry** (all 6), Lab Portal, Smart Farming, Analytics, Audit Log, Settings | S2 |
| TC-RBAC-02 | Field Officer nav | Login officer | Sees dMRV Registry + Smart Farming; **no** Audit Log | S2 |
| TC-RBAC-03 | Lab Technician nav | Login lab | Sees **Lab Portal**; does **not** see dMRV Registry or Smart Farming | S2 |
| TC-RBAC-04 | VVB Auditor nav | Login auditor | Sees dMRV Registry + Audit Log; every page shows a **"Read-only audit access"** badge; no create/edit buttons | S1 |
| TC-RBAC-05 | Farmer nav | Login farmer | Sees Dashboard + **My Farm Impact** + Smart Farming; no dMRV Registry, no Audit Log | S1 |
| TC-RBAC-06 | Auditor write blocked (API) | As auditor, attempt any POST/PATCH (e.g. create batch) via console/curl | **403** "VVB Auditor access is strictly read-only" | S1 |
| TC-RBAC-07 | Farmer cannot create batch | As farmer, POST /api/v1/biochar | **403** Insufficient permissions | S1 |
| TC-RBAC-08 | Field Officer cannot edit historical batch | As officer, PATCH /api/v1/biochar/:id | **403** (edits are admin-only) | S2 |
| TC-RBAC-09 | Field Officer cannot enter lab results | As officer, POST /api/v1/samples/:id/results | **403** (chemistry is lab-owned) | S1 |
| TC-RBAC-10 | Farmer cannot view another farm | As farmer, GET /api/v1/impact/{other-farmer-db-id} | **403** "may only view their own dashboard" | S1 |
| TC-RBAC-11 | Audit log admin/auditor only | As farmer/officer, GET /api/v1/audit | **403** | S2 |

---

## 6. Farmer Enrolment & Management (TC-FARM)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-FARM-01 | Farmers list loads (live) | Admin → Farmers | List populated from API; header shows green **"Live data"** badge | S1 |
| TC-FARM-02 | Search | Type a name / farm / farmer ID in search | List filters to matching rows | S3 |
| TC-FARM-03 | Province & status filter | Apply province + status filters | Only matching farmers shown; reset clears | S3 |
| TC-FARM-04 | Farmer detail | Click a farmer row | Detail page: profile, carbon history chart, alerts | S2 |
| TC-FARM-05 | Unique farmer ID format | Inspect any farmer / register new | ID matches `CSA-YYYY-NNNNN`; sequential, unique | S2 |
| TC-FARM-06 | Update status | Admin/officer changes a farmer status (active/inactive/pending) | Persists after refresh; success toast | S2 |
| TC-FARM-07 | Mock fallback | Stop backend, open Farmers | Page still renders with **"Demo data"** badge (no crash) | S2 |

---

## 7. Biochar Inventory & Gate 1 (TC-BIO)

**Page:** Admin/Officer → dMRV Registry → **Biochar Inventory** (`/dmrv/biochar`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-BIO-01 | Mass-balance cards | Open page | 4 cards: Total Produced, Shipped, Applied, Remaining (1 decimal) + "proves no leakage" note; numbers reconcile (Produced − Shipped − Applied = Remaining) | S1 |
| TC-BIO-02 | Production log table | Open page | Rows for BC-2026-001..004 with feedstock badge, pyrolysis °C, weight, region, dCoC status badge, eligibility icon | S1 |
| TC-BIO-03 | dCoC status colours | Inspect status column | produced=gray, sampled/lab_received=orange, results_entered=**green**, rejected=**red** | S3 |
| TC-BIO-04 | **Gate 1 — reject <350 °C** | New Production Log → set pyrolysis temp `300`, fill rest, submit | Submission **blocked**; red banner with exact text "…minimum of 350°C to achieve permanent carbon crystallisation…"; no new row created | **S1** |
| TC-BIO-05 | Gate 1 — accept ≥350 °C | New Production Log → temp `520`, submit | 201; new batch `BC-2026-005` appears; dCoC = Produced; not yet eligible | S1 |
| TC-BIO-06 | Batch number sequence | Create two batches | Numbers increment `BC-2026-005`, `-006` | S3 |
| TC-BIO-07 | Log shipment | Open a batch's Manage modal → Log Shipment (date, weight, destination, waybill, mileage) | Shipment added; Remaining decreases by weight | S2 |
| TC-BIO-08 | **Mass-balance guard (over-ship)** | Try to ship more tonnes than Remaining | **422** error banner "only X t remain…"; nothing saved | **S1** |
| TC-BIO-09 | Log application | Manage modal → Log Application (farmer dropdown, date, weight) | Application added; Remaining decreases; farmer's stored CO₂e will reflect this (see TC-IMP) | S2 |
| TC-BIO-10 | Over-apply guard | Apply more than Remaining | 422 mass-balance error; nothing saved | S2 |
| TC-BIO-11 | Field validation | Submit New Production Log with blank/negative weight | Inline validation; request rejected | S3 |

---

## 8. Chain of Custody / dCoC & Evidence Locks (TC-DCOC)

**Page:** dMRV Registry → **dCoC Tracker** (`/dmrv/dcoc`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-DCOC-01 | Traffic-light legend | Open page | Legend explains Yellow (sampled)/Orange (lab received)/Green (results)/Red (rejected) | S3 |
| TC-DCOC-02 | Status counts | Open page | Count cards match the table totals per status | S3 |
| TC-DCOC-03 | Sample table | Open page | SS-2026-0001..0005 with coloured status badge, batch, farmer, waybill, sampled date, **photo thumbnail** | S2 |
| TC-DCOC-04 | Photo & certificate links | Click a photo thumb / certificate link on a Green sample | Photo opens (from /uploads); lab PDF opens in new tab | S2 |
| TC-DCOC-05 | **Evidence lock — no photo** | Log Field Sample flow, attempt to create a sample without uploading a photo | Blocked; "a geotagged field photo must be attached…" | **S1** |
| TC-DCOC-06 | Log field sample (happy path) | Log Field Sample → upload photo (with lat/lng/deviceId, farmer) → then create sample with optional batch | Photo uploads; sample created as **Yellow — Sampled**; new SS code | S1 |
| TC-DCOC-07 | Geospatial verify — inside boundary | Upload sample photo with GPS inside farmer's plot | Photo badge "Verified Location" (green) | S2 |
| TC-DCOC-08 | **Geospatial verify — outside boundary** | Upload photo with GPS far outside plot | Photo flagged "Boundary Mismatch"; **admin audit alert** raised (check Alerts/Audit) | **S1** |

---

## 9. Laboratory Workflow & Gate 3 (TC-LAB)

**Page:** Lab Technician → **Lab Portal** (`/lab`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-LAB-01 | Queue renders | Login lab, open Lab Portal | Sample Queue (Awaiting receipt / Awaiting results) + Completed table (with C-org, H/C, heavy-metals) | S1 |
| TC-LAB-02 | Log receipt (→ Orange) | On a "sampled" row → Log Receipt → enter waybill/tracking # | Sample advances to **lab_received** (Awaiting results) | S1 |
| TC-LAB-03 | **Evidence lock — no waybill** | Log Receipt with blank waybill | Blocked; "waybill / tracking number is required…" | S2 |
| TC-LAB-04 | **Evidence lock — no PDF** | Enter Results without uploading a certificate PDF | Blocked; "lab certificate PDF must be attached…" | **S1** |
| TC-LAB-05 | Enter results (→ Green, PASS) | Enter Results → upload PDF, C-org 75, H:C `0.45`, heavy metals **Pass**, submit | Success "verified (Green)"; sample = results_entered; linked batch becomes **issuance-eligible** | S1 |
| TC-LAB-06 | **Gate 3 — high H:C** | Enter Results with H:C `0.82`, heavy metals Pass | Entry **saved** but modal shows red CRITICAL "permanently locked…"; sample = **Rejected**; batch issuance **locked** (eligible = false) | **S1** |
| TC-LAB-07 | **Gate 3 — heavy metals fail** | Enter Results with H:C `0.4`, heavy metals **Fail** | Same as TC-LAB-06 (rejected + locked) | **S1** |
| TC-LAB-08 | Results immutable | Try to enter results again on a completed sample | **409** "results already entered / immutable" | S2 |
| TC-LAB-09 | Order enforced | Enter Results on a sample still in "sampled" (not received) | **422** must be received first | S2 |
| TC-LAB-10 | Rejected batch propagation | After TC-LAB-06, open Biochar & Ledger pages for that batch | Batch shows Rejected + not eligible; Ledger creditable = 0 | S1 |

---

## 10. Camera Log (TC-CAM)

**Page:** dMRV Registry → **Camera Log** (`/dmrv/camera-log`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-CAM-01 | Grid renders | Open page | Photo cards in responsive grid; images load from /uploads | S2 |
| TC-CAM-02 | **Required metadata** | Inspect each card | Shows **UTC timestamp**, **GPS to exactly 5 decimal places**, and **Device ID** | **S1** |
| TC-CAM-03 | Filter pills | Click All / Verified / Flagged / Pending | Grid filters accordingly; the seeded flagged photo appears under "Flagged" | S3 |
| TC-CAM-04 | Verification badges | Inspect cards | Verified=green, Boundary Mismatch=red, Pending=gray | S3 |

---

## 11. Yield & Harvest + Gate 2 (TC-YIELD)

**Page:** dMRV Registry → **Yield & Harvest** (`/dmrv/harvest`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-YIELD-01 | Summary + chart | Open page | Per region+crop: project/control plots, tonnes, **Yield Increase %** (green if >0), flagged count; bar chart project vs control | S2 |
| TC-YIELD-02 | Yield calc sanity | Compare Limpopo/Maize row to data | % ≈ (avg project dry tonnes − avg control dry tonnes)/control ×100 | S2 |
| TC-YIELD-03 | Record harvest (in-season) | Record Harvest → Limpopo, Maize, date within window, weight, moisture, project | 201; row **not flagged** | S1 |
| TC-YIELD-04 | **Gate 2 — out of season** | Record Harvest → Limpopo, Maize, date `2026-10-15` (>30 days past window) | Record **saved** but amber alert "…deviates from regional agricultural baseline… Gold Standard VVB notification logged"; row flagged "Out-of-Season Audit Required" | **S1** |
| TC-YIELD-05 | Gate 2 — wrong crop | Record Harvest → Limpopo, `Tobacco` (no baseline), in-window date | Saved but flagged | S2 |
| TC-YIELD-06 | Moisture normalisation | Enter two harvests, same wet weight, different moisture | Yield % uses dry weight (higher moisture → lower dry weight) | S3 |

---

## 12. Seasonality Planner (TC-SEA)

**Page:** dMRV Registry → **Seasonality** (`/dmrv/seasonality`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-SEA-01 | Plans table | Open page | Region, crop, year, planned vs actual planting, harvest window; variance badge (amber if >14 days) | S3 |
| TC-SEA-02 | Add plan (admin) | Admin → Add Plan → fill + save | New plan row; used by Gate 2 for that region | S2 |
| TC-SEA-03 | Window validation | Add Plan with windowEnd before windowStart | 422 error "window end must be after start" | S3 |
| TC-SEA-04 | Set actual date | Admin sets actual planting date on a plan | Persists; variance recalculates | S3 |
| TC-SEA-05 | Officer cannot add | Login officer, open Seasonality | Read-only (Add hidden) or 403 on API | S2 |

---

## 13. Carbon Calculation Ledger (TC-LEDGER)

**Page:** dMRV Registry → **Carbon Ledger** (`/dmrv/ledger`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-LEDGER-01 | Formula explainer | Open page | Shows Gross = weight × C-org% × **3.67**; Deductions = km × diesel factor; Net = Gross − Deductions | S3 |
| TC-LEDGER-02 | Totals cards | Open page | Gross, Deductions, Net, **Creditable** CO₂e + "≈ N cars off the road for a year" | S2 |
| TC-LEDGER-03 | Per-batch math | Pick BC-2026-001 (40 t, 78% C-org) | Gross ≈ 40 × 0.78 × 3.67 = **114.5** t; verify Net = Gross − deductions | S1 |
| TC-LEDGER-04 | Rejected batch = 0 credit | Find BC-2026-003 (rejected) | Row tinted red; **Creditable = 0**; not eligible | S1 |
| TC-LEDGER-05 | Export CSV | Click Export CSV | CSV downloads with all rows; opens correctly in Excel | S3 |

---

## 14. Farmer Value & Impact (TC-IMP)

**Page:** Farmer → **My Farm Impact** (`/impact`)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-IMP-01 | Loads own farm | Login farmer, open page | Dashboard for John Mwangi's farm (no dropdown) | S1 |
| TC-IMP-02 | Soil Health — pH gauge | Inspect Section A | Colour bar Acidic→Neutral→Alkaline, marker at latest pH, plain-language advice | S2 |
| TC-IMP-03 | Nutrient (EC) | Inspect | EC value + High/Moderate/Low label + "fertiliser locked in root zone" note | S3 |
| TC-IMP-04 | Root Room trend | Inspect | Bulk-density line chart over time + trend arrow (improving if latest < first) | S3 |
| TC-IMP-05 | Water Holding | Inspect | "+X% Water Retention" indicator | S3 |
| TC-IMP-06 | Carbon Bank counter | Inspect Section B | Large stored CO₂e figure; "≈ N cars off the road" comparison; biochar applied tonnes | S1 |
| TC-IMP-07 | Payout ledger | Inspect | Total Value Earned (R, formatted) + chronological payout rows (payment/discount badges) | S2 |
| TC-IMP-08 | Evidence timeline | Inspect Section C | Field-history photos with before/after/sample/field badges, dates, verified badge | S2 |
| TC-IMP-09 | Passport QR | Inspect | QR code renders; encodes `/passport/CSA-2024-00001` | S2 |
| TC-IMP-10 | Data reflects applications | Note stored CO₂e → as admin apply more eligible biochar to this farm → reload impact | Stored CO₂e increased | S2 |
| TC-IMP-11 | Staff pick a farm | Login admin, open /impact | Farmer dropdown appears; selecting one loads that farm | S3 |
| TC-IMP-12 | No profile | (If a staff user has no farmer profile) open /impact as that user | Friendly "no farm profile linked" message, no crash | S3 |

---

## 15. Public Sustainable Passport (TC-PASS)

**Page:** `http://localhost:5173/passport/CSA-2024-00001` (no login)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-PASS-01 | Public access | Open URL in a **logged-out** / incognito window | Page renders without auth | S1 |
| TC-PASS-02 | Content | Inspect | Farmer/farm identity, crops, practices, dMRV stats (stored CO₂e, cars, biochar t, verified samples/photos) | S2 |
| TC-PASS-03 | Methodology badges | Inspect | Verra, Puro.earth, Gold Standard shown | S3 |
| TC-PASS-04 | **No financial leakage** | Inspect page & network response | **No** payout/earnings/financial data anywhere | **S1** |
| TC-PASS-05 | QR round-trip | Scan the QR from TC-IMP-09 with a phone | Opens this same passport page | S2 |
| TC-PASS-06 | Unknown ID | Open /passport/CSA-0000-99999 | Friendly "Passport not found" (404) | S3 |

---

## 16. Carbon Tracking & Soil Health (TC-CARB)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-CARB-01 | Carbon page loads | Admin → Carbon Tracking | Trend chart, soil radar, compliance summary, readings table | S2 |
| TC-CARB-02 | Add reading | New reading modal → farmer, date, method, metrics → save | Row appears; success toast | S1 |
| TC-CARB-03 | Sensor/manual toggle | Toggle input method in modal | Method badge reflects choice | S3 |
| TC-CARB-04 | **Offline queue** | Go offline (DevTools → Network → Offline), submit a reading | "Saved offline — will sync when online" toast; entry shows locally | S2 |
| TC-CARB-05 | Sync on reconnect | Go back online after TC-CARB-04 | Queued reading syncs to server (verify via API/refresh) | S2 |

---

## 17. Geolocation & Mapping (TC-MAP)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-MAP-01 | Map renders | Admin → Farm Map | Leaflet map, farm markers, SA extent | S2 |
| TC-MAP-02 | Boundary polygons | Inspect | Farm boundaries drawn as polygons | S3 |
| TC-MAP-03 | Draw boundary | Use click-to-draw tool | Polygon draws; area/stats update | S3 |
| TC-MAP-04 | Layer toggle | Switch Street/Satellite/Terrain | Tiles change | S4 |
| TC-MAP-05 | Marker popup | Click a marker | Popup with farmer + coordinates | S3 |

---

## 18. LSM Profiles (TC-LSM)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-LSM-01 | Scoring tool | LSM Profiles → answer 6 questions | Auto score + LSM1–LSM5 category | S2 |
| TC-LSM-02 | Category cards | Inspect | LSM1–5 cards with counts, click to expand recommendations | S3 |
| TC-LSM-03 | Charts | Inspect | Pie distribution, province stacked bar, radar breakdown | S4 |

---

## 19. Smart Farming Tools (TC-SF)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-SF-01 | Irrigation | Smart → Irrigation | Usage charts, schedule table, add modal | S3 |
| TC-SF-02 | Pest & Disease | Smart → Pest | Outbreak log, severity coding, remedy, resolve, report modal | S3 |
| TC-SF-03 | Weather (mock) | Smart → Weather (no API key) | Forecast renders with "mock" badge | S3 |
| TC-SF-04 | Weather (live) | Set `VITE_OPENWEATHER_API_KEY`, reload | Live data with "live" badge, province selector works | S3 |
| TC-SF-05 | Inventory CRUD | Smart → Inventory → add/edit/delete | Item persists (live) or updates locally; low-stock alert on low qty | S2 |
| TC-SF-06 | Financials | Smart → Financials | Income/expense charts, projection, record modal | S3 |

---

## 20. Analytics & Reporting (TC-RPT)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-RPT-01 | Overview | Analytics → Overview | KPI cards + charts render | S3 |
| TC-RPT-02 | Report builder | Pick a template, apply filters, preview | Column list + preview table populate | S2 |
| TC-RPT-03 | **PDF export** | Export PDF | Branded PDF downloads, opens, is paginated | S2 |
| TC-RPT-04 | **CSV export** | Export CSV | Valid CSV, opens in Excel | S2 |
| TC-RPT-05 | **XLS export** | Export XLS | Valid .xlsx with column widths | S2 |

---

## 21. Audit Log (TC-AUD)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-AUD-01 | Log renders (admin) | Admin → Audit Log | Event table (user, role, action, resource, IP, duration, status); "Live data" badge | S2 |
| TC-AUD-02 | Persistence | Perform actions, **restart the backend**, reopen Audit Log | Prior entries still present (DB-persisted, not lost) | S1 |
| TC-AUD-03 | Auditor read access | Login auditor → Audit Log | Can view the full trail | S2 |
| TC-AUD-04 | Filters | Filter by action/role, search | Table filters correctly | S3 |

---

## 22. Non-Functional (TC-NFR)

| ID | Test | Steps | Expected Result | Sev |
|---|---|---|---|---|
| TC-NFR-01 | GDPR banner | First visit (clear localStorage) | Cookie consent banner; choices persist after reload | S3 |
| TC-NFR-02 | i18n | Settings → Platform → change language (e.g. Zulu, Afrikaans) | UI strings switch live | S3 |
| TC-NFR-03 | Responsive | Resize to mobile / use device emulation on all key pages | Sidebar collapses to overlay; layout reflows; no horizontal scroll | S2 |
| TC-NFR-04 | PWA/offline shell | Load app, go offline, navigate | Cached shell loads; offline indicator shows | S3 |
| TC-NFR-05 | Cross-browser | Run smoke path in Chrome/Firefox/Safari/Edge | Consistent rendering & behaviour | S2 |
| TC-NFR-06 | Console clean | Perform full happy-path with DevTools open | No uncaught errors in console | S2 |
| TC-NFR-07 | Security headers | Inspect a response (DevTools/curl) | Helmet headers present; CORS limited to the client origin | S3 |
| TC-NFR-08 | No secrets in client | Search built bundle / network | No JWT secret, no server-only keys exposed | S2 |
| TC-NFR-09 | Perf sanity | Load dashboard, dMRV pages | Pages interactive within a few seconds on a normal connection | S3 |

---

## 23. End-to-End Scenario (TC-E2E) — full biochar lifecycle

> One continuous flow across roles. Re-seed first. This is the primary release-gate scenario.

1. **Officer** logs a production batch (temp 520 °C, rice husk, 30 t) → batch created, dCoC = Produced. *(Gate 1 pass)*
2. **Officer** tries a second batch at 300 °C → **rejected** (Gate 1). ✅ blocked.
3. **Officer** uploads a geotagged field photo **inside** a farmer's boundary → Verified.
4. **Officer** logs a soil sample from that photo → Yellow (Sampled).
5. **Lab** logs receipt with a waybill → Orange (Lab Received).
6. **Lab** enters results with PDF, H:C 0.45, metals Pass → **Green**; batch becomes issuance-eligible.
7. **Officer** logs shipments + an application of the batch to the farmer → mass balance updates; over-shipping is blocked.
8. **Officer** records an in-season harvest (project + control plots) → yield % computed; an out-of-season one is **flagged** (Gate 2).
9. **Admin** opens **Carbon Ledger** → batch shows Gross/Net/Creditable CO₂e; **Admin** records a payout.
10. **Farmer** logs in → **My Farm Impact** shows stored CO₂e, payout, evidence timeline, passport QR.
11. Open the **public passport** (logged out) → verified page, **no financials**.
12. **Auditor** logs in → can read all dMRV pages + audit log, **cannot** edit anything.
13. **Restart backend** → re-open Audit Log → all events still present.

**Expected:** every step behaves as described; all 3 gates and evidence locks enforce; mass balance always reconciles.

---

## 24. Regression checklist (run before every release)

- [ ] All 5 roles log in and see the correct nav (TC-RBAC-01..05)
- [ ] Gate 1 blocks <350 °C (TC-BIO-04)
- [ ] Gate 3 rejects & locks on bad chemistry (TC-LAB-06/07)
- [ ] Gate 2 flags out-of-season harvest (TC-YIELD-04)
- [ ] Evidence locks (no photo / waybill / PDF) all block (TC-DCOC-05, TC-LAB-03/04)
- [ ] Mass balance never goes below zero via UI (TC-BIO-08/10)
- [ ] Auditor is read-only everywhere (TC-RBAC-06)
- [ ] Public passport hides financials (TC-PASS-04)
- [ ] Camera log shows GPS to 5 dp + device ID (TC-CAM-02)
- [ ] Audit log survives restart (TC-AUD-02)
- [ ] Full E2E scenario passes (TC-E2E)
- [ ] Client build passes: `cd client && npm run build`
- [ ] Backend tests pass: `cd server && npm test` (57 tests)
- [ ] No console errors on happy path (TC-NFR-06)

---

## 25. Automated coverage (already in the repo — run alongside manual QA)

```bash
cd server && npm test     # 57 vitest/supertest tests:
                          #  - carbon engine (3.67, deductions, mass balance, yield)
                          #  - all 3 validation gates + evidence locks + geo verifier
                          #  - RBAC (401/403), dCoC chain, immutability, passport, access control
```
These cover backend logic. **Manual QA in this document covers the UI, cross-role journeys, and non-functional areas the automated suite does not.**

---

## 26. Defect reporting template

```
ID:            TC-____-__
Title:
Severity:      S1 / S2 / S3 / S4
Environment:   OS / Browser / build commit
Role used:
Preconditions: (seed state)
Steps:         1. …
Expected:
Actual:
Evidence:      screenshot / video / console log / network response
Notes:
```

---

## 27. Known limitations (not defects — do not raise)

- Database is **SQLite** for dev/demo (production target is PostgreSQL — provider swap).
- **Weather** uses mock data unless `VITE_OPENWEATHER_API_KEY` is set.
- **LSM scoring** and some **dashboard growth-trend** numbers are frontend-computed (not persisted).
- **Inventory live mode** uses the first farmer as owner (no farm-selector on that page).
- GDPR cookie banner overlays lower content until dismissed (expected on first visit).
- Carbon-entry modal posts even in demo mode; a mock-farmer id may surface a server error toast while the local entry still renders.
```
```
