---
name: Dashboard duplicate endpoints
description: There are two dashboard routes — the real one delegates to dashboardMetricsNew.ts
---

# Dashboard Endpoints

The app has TWO dashboard-related routes:
- `/api/dashboard/summary` (routes.ts ~line 159) — inline implementation, NOT used by frontend
- `/api/dashboard/metrics` (routes.ts ~line 502) — used by frontend; delegates to `server/services/dashboardMetricsNew.ts`

**Why:** Historical: the inline `/summary` route was built first, then a service-based approach was added. Frontend hooks use `/metrics`.

**How to apply:** Any dashboard metric changes (monthlyTrend, atRiskStudents, etc.) must be made in `server/services/dashboardMetricsNew.ts`, NOT in the inline route block around line 195-490.
