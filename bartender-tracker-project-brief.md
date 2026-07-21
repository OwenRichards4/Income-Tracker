# Project Brief: Bartender Tip & Earnings Tracker

## Context
I'm a CS graduate with software/data engineering experience (AWS, SQL/Postgres, Python — including Pandas/NumPy from data analytics study — and JS/TypeScript/React/Node/Svelte). I'm building this as a portfolio project to demonstrate modern AI-assisted web development, and I'll be using you throughout the build. I work as a bartender and want a tool I'll actually use to log shifts and understand my real earnings for tax purposes.

## Core Concept
An app for logging bartending shifts (hours, tips, hourly wage) right after a shift ends — fast enough to use on a phone walking to the car. It should help me understand my effective hourly rate, track earnings over time, and prepare for tax season (quarterly estimates, annual summaries).

## Platform
Single Next.js codebase built as a **PWA** (installable to iOS/Android home screen, offline-capable via service worker, syncs when back online) rather than separate native apps. Should feel native on mobile but also work well on desktop/PC.

## Proposed Architecture
- **Frontend**: Next.js (App Router) + TypeScript + React + Tailwind CSS
- **Core API**: Next.js API routes / Server Actions (handles CRUD, auth checks)
- **Database**: Postgres (via Supabase)
- **ORM**: Prisma or Drizzle
- **Auth**: Supabase Auth or Clerk
- **Analytics service**: Python + FastAPI + Pandas/NumPy, deployed separately (e.g., AWS Lambda via Mangum), reading from the same Postgres DB. Handles the numerical heavy lifting: quarterly tax withholding projections, trend analysis (best shifts by day/time, tip-rate seasonality), anomaly/under-reporting detection, simple forecasting of expected earnings.
- **AI layer**: Anthropic (Claude) API for two things — (1) natural-language shift entry, e.g. "6 hours, $140 tips, $2.83 base" parsed into structured data, and (2) plain-English summaries of earnings/tax standing. Division of labor: LLM handles language, Python/Pandas handles the math/modeling.
- **Hosting**: Vercel for the Next.js app; AWS for the analytics service (tie-in to my AWS background).

## Feature Priorities (rough, open to refinement)
1. Fast shift logging (manual form + AI natural-language entry)
2. Dashboard: effective hourly rate, earnings trends over time
3. Tax prep: quarterly estimated tax projections, exportable summary (CSV/PDF)
4. Offline support for logging without signal
5. (Stretch) anomaly detection / under-reporting flags, forecasting

## Finalized Data Model
Tips and hourly wage are tracked separately: hourly wage is already taxed via employer payroll (small amount, low personal significance), while tips are the primary income and are effectively unwithheld/self-reported. Manual logging only (no clock-in/out precision) — fast entry is the priority over exact timestamps.

```
shifts
  id, date, hours_worked, tips_amount

wage_entries
  id, pay_date, gross_pay, net_pay   -- withheld amount = gross - net, derived not stored

settings
  name, base_hourly_rate, state, filing_status,
  estimated_income_tax_rate (editable, default ~12%),
  fica_rate (fixed, 7.65%, display-only),
  week_start_day, default_view
```

## Tax Estimate Approach
Flat-rate estimate, not full bracket modeling — appropriate given the "No Tax on Tips" federal deduction (up to $25,000/year in qualified tips deducted from taxable income, enacted July 2025) is far above realistic bartender tip income, and FICA (7.65%) applies to all tips regardless of that deduction. Estimate = (tips × FICA rate) + (tips × user's estimated income tax rate). Wage income is excluded from the estimate since it's already withheld via `wage_entries`. Note: this deduction is a temporary provision (2025–2028) and withholding rules around it may evolve — revisit if it becomes materially relevant.

## Dashboard Layout (agreed direction)
- Top: filter tabs (week/month/year/total) governing the whole view + settings link
- Three metric cards: monthly income, estimated tax owed, take-home estimate
- Two primary actions: "Log tips" (primary button), "Log weekly check" (secondary button)
- Two charts: average tips by day of week (bar), tips-per-hour trend over time (line)
- Recent entries table: date, type, hours, amount

## Settings Screen (agreed direction)
Grouped into four sections:
1. **Work info**: name, base hourly rate, state, filing status
2. **Tax estimate**: editable income tax rate, fixed FICA rate (reference only), note on the $25k tip deduction cap
3. **App behavior**: week start day, default view on load
4. **Account & data**: export to CSV, delete all data

## What I want from you right now
Do **not** start writing code or scaffolding the project yet. I want to plan and make deliberate decisions first, starting with UI/UX design direction (mockups/wireframes, visual style, core screens) before any implementation. Please treat this message as project context to reference going forward, and wait for my explicit direction on where to begin.
