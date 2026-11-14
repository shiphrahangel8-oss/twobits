-- ============================================================================
-- RESOLVEAI - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Autonomous Business Operations Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLE-BASED ACCESS CONTROL
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE', 'CUSTOMER')),
  department VARCHAR(100) DEFAULT 'Operations',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"theme":"dark","notifications":true,"autoApproveLowRisk":false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Confirmed', 'Processing', 'In Transit', 'Delayed', 'Delivered', 'Missing', 'Cancelled', 'Replaced', 'Refunded')),
  warehouse_id VARCHAR(50) NOT NULL,
  payment_id VARCHAR(50),
  shipment_id VARCHAR(50),
  expected_delivery TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Captured', 'Deducted_Order_Missing', 'Duplicate_Charge', 'Failed', 'Refund_Pending', 'Refunded')),
  gateway_reference VARCHAR(120) NOT NULL,
  inconsistency_flag BOOLEAN DEFAULT FALSE,
  inconsistency_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(50) PRIMARY KEY,
  sku VARCHAR(80) UNIQUE NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  warehouse_id VARCHAR(50) NOT NULL,
  warehouse_name VARCHAR(120) NOT NULL,
  stock_level INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 25,
  unit_cost NUMERIC(10, 2) NOT NULL,
  retail_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('In Stock', 'Low Stock', 'Critical Shortage', 'Out of Stock')),
  alternative_warehouse_id VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHIPMENTS & LOGISTICS
CREATE TABLE IF NOT EXISTS shipments (
  id VARCHAR(50) PRIMARY KEY,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
  carrier VARCHAR(100) NOT NULL,
  origin_hub VARCHAR(150) NOT NULL,
  destination_city VARCHAR(150) NOT NULL,
  current_hub VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Label Created', 'In Transit', 'Out for Delivery', 'Delayed', 'Disrupted', 'Delivered')),
  delay_hours INTEGER DEFAULT 0,
  disruption_reason TEXT,
  estimated_arrival TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMER COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'Delayed delivery',
    'Missing order',
    'Payment deducted but order missing',
    'Damaged product',
    'Wrong product',
    'Cancellation',
    'Replacement',
    'Refund request'
  )),
  description TEXT NOT NULL,
  priority VARCHAR(30) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'Submitted',
    'Investigating',
    'Awaiting Information',
    'Awaiting Approval',
    'Processing',
    'Resolved',
    'Escalated',
    'Failed'
  )),
  attachment_url TEXT,
  assigned_workflow_id VARCHAR(50),
  recommended_decision TEXT,
  decision_reasoning TEXT,
  resolution_summary TEXT,
  customer_notification TEXT,
  resolution_history JSONB DEFAULT '[]'::jsonb,
  is_demo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI AGENTS REGISTRY
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Idle', 'Planning', 'Investigating', 'Collaborating', 'Executing', 'Awaiting Approval', 'Failed')),
  active_task TEXT,
  completed_tasks INTEGER DEFAULT 0,
  success_rate NUMERIC(5, 2) DEFAULT 99.0,
  avg_latency_ms INTEGER DEFAULT 420,
  instructions TEXT NOT NULL,
  authorized_tools JSONB DEFAULT '[]'::jsonb,
  input_schema JSONB DEFAULT '{}'::jsonb,
  output_schema JSONB DEFAULT '{}'::jsonb,
  recent_findings JSONB DEFAULT '[]'::jsonb,
  task_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUTONOMOUS WORKFLOWS
CREATE TABLE IF NOT EXISTS workflows (
  id VARCHAR(50) PRIMARY KEY,
  complaint_id VARCHAR(50),
  order_id VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  trigger_source VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Running', 'Awaiting Approval', 'Self-Healing', 'Completed', 'Escalated', 'Failed')),
  current_stage INTEGER DEFAULT 1,
  total_stages INTEGER DEFAULT 12,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key VARCHAR(150) UNIQUE NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  failure_logs JSONB DEFAULT '[]'::jsonb,
  recovery_history JSONB DEFAULT '[]'::jsonb,
  final_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AGENT-TO-AGENT COLLABORATION MESSAGES
CREATE TABLE IF NOT EXISTS agent_collaborations (
  id VARCHAR(50) PRIMARY KEY,
  workflow_id VARCHAR(50) NOT NULL,
  complaint_id VARCHAR(50),
  from_agent VARCHAR(100) NOT NULL,
  to_agent VARCHAR(100) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('Finding', 'Recommendation', 'Conflict', 'Negotiation', 'PolicyCheck', 'Consensus', 'Escalation')),
  message TEXT NOT NULL,
  structured_data JSONB DEFAULT '{}'::jsonb,
  confidence NUMERIC(4, 2) DEFAULT 0.95,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PREDICTIVE INTELLIGENCE
CREATE TABLE IF NOT EXISTS predictions (
  id VARCHAR(50) PRIMARY KEY,
  risk_category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(30) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  affected_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_evidence TEXT NOT NULL,
  detection_method VARCHAR(150) NOT NULL,
  recommended_action TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Mitigating', 'Prevented', 'Dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUTONOMOUS CRISIS EVENTS
CREATE TABLE IF NOT EXISTS crises (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(30) NOT NULL CHECK (severity IN ('High', 'Critical', 'Catastrophic')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Investigating', 'Executing Recovery', 'Paused', 'Escalated', 'Resolved')),
  affected_orders INTEGER NOT NULL DEFAULT 0,
  affected_customers INTEGER NOT NULL DEFAULT 0,
  severity_groups JSONB DEFAULT '{}'::jsonb,
  underlying_issue TEXT NOT NULL,
  assigned_agents JSONB DEFAULT '[]'::jsonb,
  investigation_progress INTEGER DEFAULT 0,
  recovery_progress INTEGER DEFAULT 0,
  recommended_solutions JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BUSINESS POLICIES
CREATE TABLE IF NOT EXISTS policies (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  max_auto_refund_usd NUMERIC(10, 2) DEFAULT 250.00,
  replacement_eligible_days INTEGER DEFAULT 30,
  sla_delay_threshold_hours INTEGER DEFAULT 24,
  require_human_approval_above NUMERIC(10, 2) DEFAULT 250.00,
  rules JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(30) DEFAULT 'Active',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. HUMAN APPROVAL CENTER
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(50) PRIMARY KEY,
  workflow_id VARCHAR(50),
  complaint_id VARCHAR(50),
  order_id VARCHAR(50),
  requested_by_agent VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  estimated_cost NUMERIC(10, 2) DEFAULT 0,
  customer_impact VARCHAR(100),
  policy_reference VARCHAR(100),
  evidence JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewed_by VARCHAR(150),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 14. ORGANIZATIONAL MEMORY
CREATE TABLE IF NOT EXISTS organizational_memory (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  problem_pattern TEXT NOT NULL,
  approved_resolution TEXT NOT NULL,
  workflow_template VARCHAR(100) NOT NULL,
  avg_resolution_time_mins NUMERIC(8, 2) NOT NULL,
  cost_saved_usd NUMERIC(10, 2) DEFAULT 0,
  success_rate NUMERIC(5, 2) DEFAULT 98.5,
  times_reused INTEGER DEFAULT 1,
  learnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('AI_AGENT', 'USER', 'SYSTEM', 'WORKFLOW')),
  actor_name VARCHAR(150) NOT NULL,
  actor_role VARCHAR(100) NOT NULL,
  action VARCHAR(150) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 16. INTEGRATIONS
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Connected', 'Degraded', 'Disconnected')),
  health_score INTEGER DEFAULT 99,
  latency_ms INTEGER DEFAULT 85,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  events_24h INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb
);
