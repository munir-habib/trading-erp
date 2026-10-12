# Architecture

This document explains how ERP Trading is built and why. It is written from the code in this repository (`prisma/schema.prisma`, `src/app`, `src/server`, `src/lib`).

## Map

Everything the app contains, by area.

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, Arial, sans-serif','fontSize':'16px','lineColor':'#94a3b8','cScale0':'#4f46e5','cScaleLabel0':'#ffffff','cScale1':'#0891b2','cScaleLabel1':'#ffffff','cScale2':'#059669','cScaleLabel2':'#ffffff','cScale3':'#d97706','cScaleLabel3':'#ffffff','cScale4':'#db2777','cScaleLabel4':'#ffffff','cScale5':'#7c3aed','cScaleLabel5':'#ffffff','cScale6':'#2563eb','cScaleLabel6':'#ffffff','cScale7':'#0d9488','cScaleLabel7':'#ffffff','cScale8':'#ea580c','cScaleLabel8':'#ffffff','cScale9':'#9333ea','cScaleLabel9':'#ffffff','cScale10':'#16a34a','cScaleLabel10':'#ffffff','cScale11':'#e11d48','cScaleLabel11':'#ffffff'}}}%%
mindmap
  root((ERP Trading))
    Home
      Dashboard
    Orders
      New order
      Order detail
      Cart
      Seven state pipeline
      Status history
      Kanban board
      Notes and attachments
      Did not proceed with a reason
    Clients
      Clients
    Suppliers
      Suppliers
      Certifications
      Evaluations
      Status Active Potential Inactive
    Catalogue
      Products and variants
      Presentations
      Commercial name mappings
      Supplier product codes
      Price history
    Quotes
      Comparisons
      Supplier quotes
      Award applied to the order
    Margins
      Margin rules
      Fixed costs
      Exchange rates
      Colour coded result
      Triangulation helper
    Logistics
      Forwarders
      Shipments
    Documents
      Proforma invoice
      Purchase order
      Packing list
      Checklist per order type
      FAQ articles
    To complete
      Suppliers without contact
      Draft comparisons
      Orders with pending documents
    Analysis
      Admin only reports
      Excel export
    Settings
      Admin only
      Users
      System settings
    PHC
      CSV import done
      REST connector planned
      Direct database connector planned
    Control
      Admin and User roles
      Audit trail
      Non blocking alerts
    Platform
      Next.js App Router
      Server Actions with Zod
      Prisma and PostgreSQL
      NextAuth
      Supabase Storage
    Next steps
      Automated tests
      Row level security
```

## Flow from start to end

The main path through the app, with its branches. Blue is a step, yellow a decision, green a good end state, orange a state that needs attention, red a blocked or flagged case.

```mermaid
%%{init: {'theme':'base','flowchart':{'curve':'basis','nodeSpacing':35,'rankSpacing':45,'padding':12},'themeVariables':{'fontFamily':'Inter, Segoe UI, Arial, sans-serif','fontSize':'15px','lineColor':'#64748b','edgeLabelBackground':'#ffffff','clusterBkg':'#f8fafc','clusterBorder':'#94a3b8','titleColor':'#334155'}}}%%
flowchart TD
  A("Request reaches proxy.ts") --> L{Logged in}
  L -->|No| LOGIN("Login with NextAuth")
  L -->|Yes| ADM{Admin only area}
  LOGIN --> ADM
  ADM -->|Not admin| OUT("Redirected away")
  ADM -->|Allowed| HOME("Dashboard")

  HOME --> N("New order from a client request")
  N --> BEHALF{Created on behalf of another user}
  BEHALF -->|Yes| AUD1("Audit shows created by X on behalf of Y")
  BEHALF -->|No| O1
  AUD1 --> O1("Request received")

  O1 --> O2("In procurement")
  O2 --> Q("Ask suppliers for quotes")
  Q --> CMP("Comparison of supplier quotes by product row")
  CMP --> AW("Award applied to the order")
  AW --> O3("Quote sent")
  AW --> MG("Margin from rules, fixed costs and exchange rates")
  MG --> COL{Margin result}
  COL -->|15 percent or more| GR("Green")
  COL -->|5 percent or more| AM("Amber")
  COL -->|Below| RD("Red")
  MG -.-> TRI("Triangulation helper for high value orders")

  O3 --> DEC{Client decision}
  DEC -->|Approved| O4("Approved")
  DEC -->|Declined| NA("Did not proceed with a mandatory reason")
  O4 --> O5("In transit")
  O5 --> SH("Forwarder and shipment")
  SH --> O6("Delivered")

  subgraph Docs[Documents per order]
    DC("Checklist by order type") --> D1("To create")
    D1 --> D2("Created")
    D2 --> D3("Sent")
    D3 --> D4("Approved")
    D4 --> PDFS("Proforma invoice, purchase order and packing list as PDF")
  end

  subgraph Side[Support flows]
    PHC("PHC import by manual CSV") --> CLP("Clients and products created")
    AT("Attachments in Supabase Storage")
    ALR("Alerts for supplier with no contact in 14 days and order with no update in 7 days")
    ALR --> DIS("Dismiss or snooze")
    TC("To complete page lists what is missing")
  end

  O1 -.-> TL("Every transition saved in the status history")
  O6 --> AN("Admin analysis and Excel export")
classDef start fill:#4f46e5,stroke:#312e81,color:#ffffff,stroke-width:2px
classDef dec fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px
classDef act fill:#e0e7ff,stroke:#6366f1,color:#1e1b4b,stroke-width:1.5px
classDef good fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:2px
classDef bad fill:#fee2e2,stroke:#dc2626,color:#7f1d1d,stroke-width:2px
classDef amb fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:2px
class A start
class ADM,BEHALF,COL,DEC,L dec
class NA,OUT,RD bad
class D4,GR,O4,O6 good
class ALR,AN,AT,AUD1,AW,CLP,CMP,D1,D2,D3,DC,DIS,HOME,LOGIN,MG,N,O1,O2,O3,O5,PDFS,PHC,Q,SH,TC,TL,TRI act
class AM amb
style Docs fill:#f8fafc,stroke:#94a3b8,stroke-dasharray:5 4,color:#334155
style Side fill:#f8fafc,stroke:#94a3b8,stroke-dasharray:5 4,color:#334155
```

## 1. What the system does

A web ERP for an international B2B trading company that sources medical and non-medical products from suppliers around the world for clients in Angola. It replaces WhatsApp, email and spreadsheets with one system for orders, suppliers, quotes, margins and shipping documents.

## 2. Big picture

```
 Browser
   |  Next.js App Router (React Server Components + Server Actions)
   v
 Next.js server
   |-- proxy.ts ............ route protection (login, admin-only areas)
   |-- NextAuth ............ credentials login, JWT session
   |-- Server Actions ...... all writes, validated with Zod
   |-- Route handlers ...... PDF generation (react-pdf)
   |-- Prisma ORM .......... PostgreSQL
   '-- Supabase Storage .... attachments (server side, service role)
```

Unlike the Supabase-first projects in this portfolio, this one uses a classic server-side stack. The server is the only thing that talks to the database, and authorization is enforced in application code.

## 3. Request flow

1. A request reaches `proxy.ts`. If the user is not logged in they are redirected to `/login`, and non-admins are redirected away from `/analises` and `/configuracoes`.
2. Pages are server components that read data with Prisma.
3. Writes are **Server Actions** (`src/server/actions/*.ts`). Each one calls `requireUser()` or `requireAdmin()`, validates the input with a Zod schema (`src/lib/validation`), writes with Prisma, and records an audit event.

Server Actions are grouped by domain: orders, procurement, comparisons, margins, products, suppliers, clients, logistics, documents, alerts, attachments, users, PHC import and reports.

## 4. Data model

36 Prisma models. The main groups:

- **Access and audit:** `User` (roles ADMIN and USER), `AuditEvent`.
- **Catalogue:** `Category`, `Product`, `ProductVariant`, `Presentation`, `CommercialNameMapping`, `SupplierProductCode`, `PriceHistory`.
- **Suppliers:** `Supplier`, `Certification`, `SupplierCertification`, `SupplierEvaluation`.
- **Orders:** `Client`, `Order`, `OrderStatusHistory`, `OrderItem`, `OrderNote`, `Attachment`.
- **Quotes and comparison:** `Comparison`, `ComparisonRow`, `ComparisonCell`, `SupplierQuote`, `QuoteLine`.
- **Margins and costs:** `MarginRule`, `OrderMargin`, `FixedCost`, `ExchangeRate`.
- **Logistics and documents:** `Forwarder`, `Shipment`, `DocumentChecklistTemplate`, `OrderDocument`, `FaqArticle`.
- **System:** `SystemSetting`, `AlertDismissal`, `ImportBatch`.

## 5. Order pipeline

An order moves through seven states: request received, in procurement, quote sent, approved, in transit, delivered, and did not proceed. The last one requires a reason (price, deadline, client gave up, product unavailable, competition, other). Every transition is stored in `OrderStatusHistory`. The pipeline is a kanban board with drag and drop (dnd-kit).

## 6. Quote comparison and margins

- A comparison puts supplier quotes side by side for each product row, and an award can be applied to the order.
- Margins are calculated per order with margin rules and fixed costs. A colour code flags the result (15% or more is green, 5% or more is amber, below that is red).
- A helper flags high-value orders that may be candidates for triangulation (a supplier in the EU and a client outside the EU).

## 7. Audit trail

`logAudit` writes an `AuditEvent` with the entity, the action (create, update, delete, status change), who did it, and optionally on whose behalf (an admin can create an order on behalf of another user, shown as "created by X on behalf of Y"), plus a record of the changes.

## 8. Alerts

Alerts are computed from rules and settings stored in `SystemSetting` (for example, a supplier with no contact for 14 days, or an order with no update for 7 days). They are non-blocking, and a user can dismiss or snooze them (`AlertDismissal`).

## 9. Generated documents

Proforma invoice, purchase order and packing list are rendered to PDF on the server with `@react-pdf/renderer` in route handlers under `src/app/api/pdf/`. Each handler checks the session first. A document checklist per order type tracks which documents are ready.

## 10. PHC integration layer

`PhcConnector` is an interface with two operations (import clients, import products). Three implementations exist as options:

- `ManualCsvConnector`: implemented. Reads an Excel or CSV file and imports rows, reporting row errors.
- `RestApiConnector` and `DirectDbConnector`: placeholders that throw "not implemented", to be filled when the level of access to PHC is confirmed.

The rest of the system depends only on the interface, so swapping the connector does not change anything else.

## 11. Authentication and authorization

- NextAuth with the credentials provider and a JWT session. Passwords are stored as bcrypt hashes.
- Two fixed roles, ADMIN and USER. Admin-only areas are protected in `proxy.ts`, and admin-only actions call `requireAdmin()`. Excel export is for admins only.
- Attachments are stored in Supabase Storage using a server-side service role key, which is never sent to the browser.

## 12. Design principles

No blocking mandatory fields (soft warnings instead), non-blocking alerts, mobile-first layout, dark theme by default, and at most two clicks to any action.

## 13. How it was built

Developed with agentic AI coding (Claude Code). The repository includes `CLAUDE.md` and `AGENTS.md` with instructions for AI agents, including a warning that this Next.js version has breaking changes and that the bundled docs must be read before writing code.

## 14. Known limitations and next steps

- Authorization lives in application code, not in the database. There is no row level security, so every query path must go through the checked server actions.
- There is no automated test suite yet.
- The PHC REST and direct database connectors are not implemented.
- The project is in active development.
