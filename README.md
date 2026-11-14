# ResolveAI — Autonomous Business Operations Platform

> **Your Business. Your AI Workforce. Always in Sync.**

ResolveAI is a full-stack, multi-agent AI SaaS platform designed to transform fragmented e-commerce operations into intelligent autonomous workflows.

---

## 1. Technology Stack

- **Frontend (`/frontend`)**: React.js, Vite, React Router, Tailwind CSS, Axios, Lucide React Icons.
- **Backend (`/backend`)**: Node.js, Express.js, JWT Authentication, Password Hashing (`bcryptjs` / `scrypt`), Zod Schema Validation.
- **Database (`/backend/database/schema.sql`)**: Supabase PostgreSQL (`@supabase/supabase-js`) + Automatic Persistent Local Database Fallback (`backend/database/localStore.json`).
- **Artificial Intelligence (`/backend/src/services/geminiService.js`)**: Official Google Gemini SDK (`@google/genai`) + Deterministic Evidence-Driven Reasoning Fallback.

---

## 2. Security & Environment Variable Configuration

ResolveAI strictly isolates secret credentials on the backend:
- **`SUPABASE_SERVICE_ROLE_KEY`** and **`GEMINI_API_KEY`** are loaded exclusively inside `/backend/.env` and are **never** exposed in `/frontend`.
- **Automatic Demo Mode**: Out of the box (without external API keys), ResolveAI runs with realistic seeded e-commerce data and a deterministic multi-agent reasoning engine.
- **Automatic Live Mode**: As soon as you add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` to `/backend/.env`, `supabaseService.js` and `geminiService.js` automatically switch to live Supabase PostgreSQL and live Google Gemini reasoning.

### Configuring Environment Variables

1. **Backend (`/backend/.env`)**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` when ready to connect live services:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_production_jwt_secret
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```
   *(Optional)* Run `backend/database/schema.sql` in the Supabase SQL Editor to provision all 16 PostgreSQL tables.

2. **Frontend (`/frontend/.env`)**:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Contains only the public API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

## 3. Running & Testing the Application

### Start Backend API Server
```bash
cd backend
npm install
npm run test   # Runs the end-to-end automated verification suite
npm run dev    # Starts backend on http://localhost:5000
```

### Start Frontend Application
```bash
cd frontend
npm install
npm run dev    # Starts Vite frontend on http://localhost:5173
```

---

## 4. Pre-Seeded Role-Based Demo Accounts

| Role | Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRATOR** | Alex Rivera | `admin@resolveai.io` | `ResolveAdmin123!` | Full platform, agents, crisis control, policies, approvals & settings |
| **BUSINESS_MANAGER** | Elena Vance | `manager@resolveai.io` | `ResolveManager123!` | Operations, Human Approval Center, Crisis Mode, Simulator, Policies & BI |
| **SUPPORT_EMPLOYEE** | Marcus Chen | `support@resolveai.io` | `ResolveSupport123!` | Complaint management, orders, inventory, logistics & workflows |
| **CUSTOMER** | Sophia Sterling | `customer@resolveai.io` | `ResolveCustomer123!` | Dedicated Customer Portal (`/portal`) for personal orders & complaints |

---

## 5. Multi-Agent Architecture (10 Specialized Agents)

1. **`AGT-01` Orchestrator Agent**: Problem classification, 12-stage DAG planning, agent assignment, and self-healing replanning.
2. **`AGT-02` Order Agent**: Order verification, SKU line-item checks, and customer ownership validation.
3. **`AGT-03` Payment Agent**: Gateway capture audit, orphan payment reconciliation, and duplicate charge detection.
4. **`AGT-04` Inventory Agent**: Multi-warehouse stock checks across Seattle (`WH-SEA-01`), Dallas (`WH-DAL-02`), and Newark (`WH-EWR-03`).
5. **`AGT-05` Logistics Agent**: Carrier telemetry analysis (`FedEx`, `UPS`, `DHL`), hub delay calculation, and re-routing.
6. **`AGT-06` Policy Agent**: Corporate policy enforcement (`POL-01` to `POL-04`) and `$250` Human Approval Center gating.
7. **`AGT-07` Prediction Agent**: Deterministic velocity rules + Gemini contextual anomaly forecasting.
8. **`AGT-08` Decision Agent**: Multi-criteria synthesis across business cost, SLA speed, and customer retention.
9. **`AGT-09` Execution Agent**: Idempotent database mutations with cryptographic idempotency keys (`IDEMP-*`).
10. **`AGT-10` Communication Agent**: Customer notifications and internal executive summaries.
