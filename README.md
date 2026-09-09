# PIXELLAR REALTY CRM
### Enterprise Multi-Tenant Real Estate CRM SaaS
**By Digital Pixellar**  
**Product Owner:** K. Yeswanth Kumar Reddy  
**Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL with Row Level Security (RLS), Razorpay Subscriptions

---

## 🏢 1. Executive Summary & Architecture

**Pixellar Realty CRM** is a production-grade, multi-tenant SaaS engineered specifically for real estate developers, builders, and marketing firms. It delivers total company-level data isolation via PostgreSQL Row-Level Security (RLS) while providing the **Platform Owner (Digital Pixellar / K. Yeswanth Kumar Reddy)** centralized oversight over subscriptions, plans, limits, and SaaS MRR/ARR.

### Core Architecture Highlights
* **Strict Multi-Tenant Database Isolation:** Every tenant entity table includes `company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE`. Row-Level Security ensures Company A cannot read or mutate Company B data under direct API or client requests.
* **Platform Owner Layer (`/platform`):** Dedicated superadmin console for K. Yeswanth Kumar Reddy to provision companies, manage subscription tiers (Starter, Growth, Business, Enterprise), grant trial overrides, and inspect platform telemetry without ambient access to tenant private customer data.
* **Anti-Double-Booking Concurrency Engine:** Optimistic locking and database transactional guards on `project_units` prevent simultaneous booking collisions on the same plot or apartment.
* **48-Hour Expiring Unit Holds:** Units placed on hold automatically release back to Available inventory via scheduled cleanup jobs.
* **Razorpay SaaS Subscription Engine:** Test-mode integration with HMAC SHA-256 webhook signature verification and an idempotent event ledger preventing duplicate billing or double entitlement activation.
* **Real Estate Collections vs SaaS Revenue Separation:** Home buyer property purchase payments are recorded and reconciled into company escrow ledgers, strictly segregated from SaaS platform subscription fees.

---

## 🚀 2. Quick Start & Local Execution

### Prerequisites
* Node.js v20+ or v22+
* npm v10+

### Installation
```bash
# 1. Clone or navigate to the project directory
cd "C:\Users\ICONIC DIGITALS\.gemini\antigravity\scratch\pixellar-realty-crm"

# 2. Dependencies are pre-installed. If running fresh:
npm install

# 3. Populate development database with sample companies and platform owner:
npm run seed

# 4. Provision Platform Owner superadmin account (K. Yeswanth Kumar Reddy):
npm run seed:platform-owner

# 5. Run the automated test suite (32 tests covering isolation, concurrency, RBAC, Razorpay):
npm test

# 6. Start the development server:
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 3. Pre-Seeded Personas & Demo Workspaces

The system comes pre-seeded with two strictly isolated companies and one platform superadmin:

| Persona | Organization | Role | URL |
| :--- | :--- | :--- | :--- |
| **K. Yeswanth Kumar Reddy** | Digital Pixellar | **Platform Owner (Superadmin)** | `/platform/dashboard` |
| **Vikram Malhotra** | Skyline Developers & Builders | **Company Owner** | `/app/skyline-developers/dashboard` |
| **Priya Nambiar** | Skyline Developers & Builders | **Company Admin** | `/app/skyline-developers/dashboard` |
| **Rahul Varma** | Skyline Developers & Builders | **Sales Manager** | `/app/skyline-developers/dashboard` |
| **Arjun Reddy** | Skyline Developers & Builders | **Sales Executive / Agent** | `/app/skyline-developers/dashboard` |
| **Sneha Patel** | Skyline Developers & Builders | **Telecaller** | `/app/skyline-developers/dashboard` |
| **Karthik Rao** | Skyline Developers & Builders | **Accounts & Finance** | `/app/skyline-developers/dashboard` |
| **Ananya Sharma** | Greenfield Estates (Tenant B) | **Company Owner** | `/app/greenfield-estates/dashboard` |

> 💡 **Workspace & Role Switching:** While navigating any tenant page, use the top header dropdowns to instantly switch between **Company A (Skyline)** and **Company B (Greenfield)** or test different roles. The membership is revalidated on every server request.

---

## 🛡️ 4. Role & Permission Matrix (RBAC)

Enforced at the server layer and PostgreSQL RLS policies:

| Capability | Platform Owner | Company Owner | Company Admin | Sales Manager | Sales Agent | Telecaller | Accounts | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Companies & Plans** | **Full** | No | No | No | No | No | No | No |
| **Platform MRR & Audit** | **Full** | No | No | No | No | No | No | No |
| **Company Settings & Branding** | No | **Full** | Edit | No | No | No | No | Read |
| **SaaS Billing & Upgrade** | No | **Full** | Read | No | No | No | No | No |
| **Manage Team & Final Owner** | No | **Protected** | **Full** | Team only | No | No | No | No |
| **View Leads** | No | All | All | Team | Assigned | Assigned | Customer | All |
| **Plot / Unit Hold (48h)** | No | Yes | Yes | Yes | Yes | No | No | No |
| **Book Unit (Locking)** | No | Yes | Yes | Yes | Allowed | No | No | No |
| **Record Customer Payments** | No | Yes | Yes | No | No | No | **Full** | No |
| **Reconcile Cleared Funds** | No | Yes | Yes | No | No | No | **Full** | No |
| **Channel Partner Commissions** | No | **Full** | Yes | No | No | No | **Full** | No |

*Rule:* Trigger prevents deleting or demoting the final active Company Owner in any workspace.

---

## 💳 5. SaaS Pricing & Subscription Tiers

Administered directly by the Platform Owner:

1. **Starter Tier (₹4,999/mo):** 5 Users, 2 Projects, 500 Leads/mo, 2 GB Storage.
2. **Growth Tier (₹9,999/mo):** 15 Users, 5 Projects, 2,500 Leads/mo, 10 GB Storage, Round-robin, Broker commissions.
3. **Business Tier (₹19,999/mo):** 50 Users, 15 Projects, 10,000 Leads/mo, 50 GB Storage, Full integrations.
4. **Enterprise Tier (₹39,999/mo):** 200 Users, 50 Projects, 50,000 Leads/mo, 200 GB Storage, Dedicated SLA.

---

## 🧪 6. Automated Test Suite (32 Tests)

Run the verification suite:
```bash
npm test
```

### Verified Scenarios:
* [x] Company A query contains ZERO Company B leads.
* [x] Company A cannot query Company B leads via direct ID lookups.
* [x] Simultaneous double-booking attempts on the same plot/unit fail with concurrency conflict.
* [x] Expired 48-hour holds are automatically cleaned and released.
* [x] Telecallers and Sales Agents are denied access to financial ledgers.
* [x] Final active Company Owner deletion is strictly blocked.
* [x] Single-use team invitations join the correct company with the assigned role.
* [x] Replay of consumed invitation tokens is rejected.
* [x] Valid Razorpay HMAC SHA-256 signatures are verified.
* [x] Forged Razorpay webhook signatures are rejected.
* [x] Duplicate Razorpay webhook replays are handled idempotently.
* [x] Phone number normalization and in-company duplicate detection succeed without leaking across companies.

---

## 📂 7. Project Structure

```
pixellar-realty-crm/
├── .data/                      # Persistent state file (pixellar-state.json)
├── scripts/
│   ├── provision-platform-owner.ts  # Platform owner CLI provisioning
│   └── seed-database.ts             # Development seed script
├── src/
│   ├── app/
│   │   ├── api/                # Inbound webhook, Razorpay webhook, cron
│   │   ├── app/[slug]/         # Multi-tenant workspace (dashboard, leads, inventory, visits, bookings)
│   │   ├── platform/           # Platform Owner superadmin console
│   │   ├── login/              # Universal login
│   │   ├── invite/accept/      # Single-use invitation acceptance
│   │   └── page.tsx            # Marketing landing page
│   ├── components/
│   │   ├── layout/             # Sidebars & headers (Tenant & Platform)
│   │   └── ui/                 # Accessible Badge, Button, Modal, StatCard
│   ├── data/
│   │   └── seed.ts             # Seed datasets (Companies, Units, Leads, Bookings)
│   ├── lib/
│   │   ├── auth/               # RBAC matrix and session resolvers
│   │   ├── billing/            # Razorpay SDK and webhook handler
│   │   ├── db/                 # Database engine and optimistic locks
│   │   └── supabase/           # Client, Server, and Admin Supabase clients
│   └── types/
│       └── index.ts            # TypeScript data definitions
├── supabase/
│   └── migrations/             # Production PostgreSQL schema, DDL, and RLS
├── tests/
│   └── run-all-tests.ts        # 32 automated verification checks
└── .env.example                # Environment variables template
```

---

## 📄 8. Production Deployment & Database Migration

### Supabase Production Database Setup:
1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/migrations/20260908000000_pixellar_schema.sql` and click **Run**.
4. Copy your project URL, anon key, and service role key into your production environment variables (`.env.production` or Vercel dashboard).

### Vercel Deployment:
1. Push this repository to GitHub.
2. Import project into Vercel.
3. Configure environment variables matching `.env.example`.
4. Deploy. Build succeeds with static and dynamic App Router routes.

---
**PIXELLAR REALTY CRM** • Developed by Digital Pixellar • Product Owner: K. Yeswanth Kumar Reddy
