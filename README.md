# ERP Trading

Web ERP for an international B2B trading company that sources medical and non-medical products from global suppliers for clients in Angola. It replaces scattered WhatsApp, email and spreadsheet work with one system for orders, suppliers, quotes, margins and shipping documents.

> Version history: [CHANGELOG.md](CHANGELOG.md) · Status: in active development

## Stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Prisma ORM · PostgreSQL · NextAuth · dnd-kit · react-pdf · ExcelJS · Recharts · Zod

## What it does

- **Order pipeline:** horizontal kanban with drag and drop (request received, procurement, quote sent, approved, in transit, delivered, did not proceed with a mandatory reason).
- **Suppliers and products:** supplier database with evaluations and certifications, product catalogue with variants, presentations and price history.
- **Quote comparison and margins:** side-by-side supplier quotes, margin rules per order and fixed costs.
- **Logistics:** freight forwarders, shipments and a document checklist per order.
- **Generated documents:** proforma invoice, purchase order and packing list as PDF.
- **Two fixed roles** (Admin and User), full audit trail with "created by X on behalf of Y", Excel export for admins only.
- **PHC integration layer:** pluggable connector interface (manual CSV import implemented) so a direct connection can be added later without changing the rest of the system.
- **Principles:** no blocking mandatory fields (soft warnings instead), non-blocking alerts, mobile-first, dark theme by default, at most two clicks to any action.

## Data model

36 Prisma models covering users, audit events, suppliers, products, clients, orders and status history, quotes, comparisons, margins, exchange rates, shipments, documents, alerts and import batches.

## Project map

🟦 app (frontend) · 🟩 database and backend · 🟧 tests and scripts · 🟪 AI workflow · ⬜ config and assets

| | Folder | What is in it |
|---|---|---|
| 🟦 | `src/app/`, `src/components/` | Next.js pages and UI (kanban pipeline, forms, documents) |
| 🟩 | `src/server/`, `src/lib/` | Server logic, auth, margins, PHC connector interface |
| 🟩 | `prisma/schema.prisma`, `prisma/migrations/` | 36-model data schema and migrations |
| 🟧 | `prisma/seed/` | Seed scripts (admin and optional demo data, driven by environment variables) |
| 🟪 | `CLAUDE.md`, `AGENTS.md`, `.claude/` | Instructions for AI coding agents |
| ⬜ | `public/` and root files | Assets, Next.js, Tailwind and TypeScript configuration |

<!-- Demo: add your screenshots to docs/screenshots/ and uncomment.
## Demo
![Home](docs/screenshots/home.png)
[Watch the video](https://youtu.be/...)
-->

## Run locally

```bash
npm install
cp .env.example .env   # PostgreSQL URLs, Supabase storage and auth secret
npx prisma migrate dev
npm run db:seed        # needs ADMIN_EMAIL in .env
npm run dev
```

## License

Copyright (c) 2026 Munir Habib. All rights reserved. The source code is public for portfolio review only; see [LICENSE](LICENSE).
