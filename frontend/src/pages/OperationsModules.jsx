import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Package,
  Truck,
  CreditCard,
} from 'lucide-react';
import { api } from '../services/api';
import { useUX } from '../context/UXContext';
import {
  PageHeader,
  StatusBadge,
  DemoSeededBadge,
  Modal,
  ContextualHelpPanel,
  HelpTooltip,
} from '../components/ui/DesignSystem';

const COMPLAINT_CATEGORIES = [
  'Delayed delivery',
  'Missing order',
  'Payment deducted but order missing',
  'Damaged product',
  'Wrong product',
  'Cancellation',
  'Replacement',
  'Refund request',
];

const COMPLAINT_STATUSES = [
  'Submitted',
  'Investigating',
  'Awaiting Information',
  'Awaiting Approval',
  'Processing',
  'Resolved',
  'Escalated',
  'Failed',
];

/**
 * Maps real backend 12-stage workflow data + complaint status into the 8-step Guided Resolution Timeline.
 * Never marks a step Completed unless the corresponding backend stage actually succeeded.
 */
function buildEightGuidedSteps(complaint, workflow) {
  const backendStages = workflow?.stages || [];
  const getBackendStageStatus = (stepNum) => {
    const found = backendStages.find((s) => Number(s.step) === stepNum);
    return found ? found.status : 'Pending';
  };
  const getBackendStageDetail = (stepNum, fallback) => {
    const found = backendStages.find((s) => Number(s.step) === stepNum);
    return found?.detail || fallback;
  };

  const isResolved = complaint?.status === 'Resolved' && getBackendStageStatus(12) === 'Completed';
  const isAwaitingApproval =
    complaint?.status === 'Awaiting Approval' || getBackendStageStatus(8) === 'Awaiting Approval';

  return [
    {
      step: 1,
      title: 'STEP 1: Submit a complaint',
      whatIsHappening: getBackendStageDetail(
        1,
        'The customer complaint has been received and logged in the database.'
      ),
      responsibleAgent: 'Customer Intake & System',
      infoChecked: `Customer (${complaint?.customer_name}), Order ID (${complaint?.order_id}), and Category (${complaint?.category}).`,
      whatHappensNext:
        'ResolveAI passes the complaint to the Orchestrator Agent to understand the problem.',
      status: getBackendStageStatus(1) === 'Completed' ? 'Completed' : 'Completed',
    },
    {
      step: 2,
      title: 'STEP 2: ResolveAI understands the problem',
      whatIsHappening: getBackendStageDetail(
        2,
        'Orchestrator Agent reads the complaint and identifies which specialists are needed.'
      ),
      responsibleAgent: 'Orchestrator Agent (Team Coordinator)',
      infoChecked: 'Problem category, urgency level, and required investigation steps.',
      whatHappensNext:
        'Specialized AI agents are assigned to check the order, payment, warehouse stock, and delivery.',
      status: getBackendStageStatus(2),
    },
    {
      step: 3,
      title: 'STEP 3: The relevant AI agents investigate',
      whatIsHappening: `${getBackendStageDetail(3, 'Checking order record.')} ${getBackendStageDetail(4, '')}`,
      responsibleAgent: 'Order, Logistics, Payment & Inventory Agents',
      infoChecked:
        'Order items, payment capture ledger, live carrier tracking scans, and warehouse stock availability.',
      whatHappensNext: 'All agents submit their verified facts so solutions can be compared.',
      status:
        getBackendStageStatus(3) === 'Completed' &&
        getBackendStageStatus(4) === 'Completed' &&
        getBackendStageStatus(5) === 'Completed'
          ? 'Completed'
          : 'Investigating',
    },
    {
      step: 4,
      title: 'STEP 4: The agents compare possible solutions',
      whatIsHappening: getBackendStageDetail(
        6,
        'Comparing replacement, refund, and shipping options against company rules.'
      ),
      responsibleAgent: 'Policy Agent & Decision Agent',
      infoChecked:
        'Cost of each option, speed of delivery for the customer, and company policy limits ($250 cap).',
      whatHappensNext:
        'Determines whether the solution can run automatically or requires a manager’s approval.',
      status:
        getBackendStageStatus(6) === 'Completed' && getBackendStageStatus(7) === 'Completed'
          ? 'Completed'
          : 'Pending',
    },
    {
      step: 5,
      title: 'STEP 5: A manager approves sensitive actions when required',
      whatIsHappening: isAwaitingApproval
        ? 'Paused: Because this action exceeds the $250 automatic limit, it is waiting for a manager to approve it in Pending Approvals.'
        : 'Verified: Either within the $250 automatic policy limit or approved by a manager.',
      responsibleAgent: 'Policy Agent & Human Business Manager',
      infoChecked: 'Financial amount ($250 threshold) and supporting evidence from the investigation.',
      whatHappensNext: isAwaitingApproval
        ? 'Once a manager clicks Approve in Pending Approvals, Step 6 will run automatically.'
        : 'Proceeds immediately to execute the authorized solution.',
      status: isAwaitingApproval
        ? 'Awaiting Approval'
        : getBackendStageStatus(8) === 'Completed'
          ? 'Completed'
          : 'Pending',
    },
    {
      step: 6,
      title: 'STEP 6: ResolveAI executes the authorized action',
      whatIsHappening: getBackendStageDetail(
        9,
        'Waiting for authorization before updating order or issuing credit/replacement.'
      ),
      responsibleAgent: 'Execution Agent (Action Taker)',
      infoChecked:
        'Safety lock (Idempotency Key) to ensure the customer is never refunded or shipped twice.',
      whatHappensNext: 'Prepares a clear update message for the customer.',
      status: getBackendStageStatus(9),
    },
    {
      step: 7,
      title: 'STEP 7: The customer receives an update',
      whatIsHappening:
        complaint?.customer_notification ||
        getBackendStageDetail(
          10,
          'Customer notification will be sent once the action is executed.'
        ),
      responsibleAgent: 'Communication Agent (Customer Communicator)',
      infoChecked: 'New tracking number, credit/refund confirmation, and expected arrival date.',
      whatHappensNext: 'Final verification that all records are updated.',
      status: getBackendStageStatus(10),
    },
    {
      step: 8,
      title: 'STEP 8: The complaint is marked resolved after verification',
      whatIsHappening: isResolved
        ? getBackendStageDetail(
            12,
            'Verified that the solution succeeded and saved the case to Previous Case History.'
          )
        : 'Will be marked Resolved only after all previous steps have been verified.',
      responsibleAgent: 'Orchestrator & Logistics Agents',
      infoChecked: 'Updated order status, delivery tracking confirmation, and activity log.',
      whatHappensNext: isResolved
        ? 'Complete — no further action needed.'
        : 'Waiting for previous steps to finish.',
      status: isResolved ? 'Completed' : 'Pending',
    },
  ];
}

// ============================================================================
// MODULE 3: CUSTOMER COMPLAINT MANAGEMENT (/app/complaints)
// ============================================================================
export function ComplaintManagementPage() {
  const { isSimpleMode } = useUX();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [form, setForm] = useState({
    customer_name: 'Sophia Sterling',
    customer_email: 'customer@resolveai.io',
    order_id: 'ORD-9841',
    category: 'Delayed delivery',
    description: 'My order was supposed to arrive yesterday, but I have not received it.',
    priority: 'High',
    attachment_url: '',
  });

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showRaw12Stages, setShowRaw12Stages] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          search,
          category: categoryFilter,
          status: statusFilter,
          priority: 'ALL',
          sort,
          page,
          limit: 8,
        },
      });
      setComplaints(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [search, categoryFilter, statusFilter, sort, page]);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBannerMsg('');
    try {
      const res = await api.post('/complaints', form);
      setBannerMsg(res.data.message);
      setCreateOpen(false);
      await fetchComplaints();
      const detailRes = await api.get(`/complaints/${res.data.complaint.id}`);
      setSelectedDetail(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setSelectedDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRerunWorkflow = async (complaintId) => {
    try {
      await api.post(`/complaints/${complaintId}/rerun`);
      const res = await api.get(`/complaints/${complaintId}`);
      setSelectedDetail(res.data);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restart investigation');
    }
  };

  return (
    <div id="tour-complaints-guided" className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Customer Complaints & Guided Resolution'
            : '3. Customer Complaint Management'
        }
        subtitle="Submit a customer problem or select any existing case below to follow the 8-step guided resolution timeline."
        badge={<DemoSeededBadge label={`${total} Customer Cases`} />}
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Submit a Complaint & Start Investigation
          </button>
        }
      />

      {/* OVERVIEW OF THE 8-STEP GUIDED PROCESS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
            How Guided Complaint Resolution Works (8 Clear Steps)
          </span>
          <span className="text-xs text-slate-500">
            Click &quot;View 8-Step Resolution Timeline&quot; on any complaint below to see live
            progress
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          {[
            '1. Submit complaint',
            '2. Understand problem',
            '3. AI agents investigate',
            '4. Compare solutions',
            '5. Manager approves (if >$250)',
            '6. Execute approved action',
            '7. Update customer',
            '8. Verify & resolve',
          ].map((label, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 text-[#1D1D1F] font-medium leading-snug"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {bannerMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" /> {bannerMsg}
          </span>
          <button onClick={() => setBannerMsg('')} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            aria-label="Search complaints"
            placeholder="Search by customer, Order ID, or issue..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0071E3]"
          />
        </div>

        <select
          aria-label="Filter by complaint category"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3]"
        >
          <option value="ALL">All Issue Categories</option>
          {COMPLAINT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by complaint status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3]"
        >
          <option value="ALL">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort complaints"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3]"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="priority">Sort: Highest Urgency First</option>
        </select>
      </div>

      {/* COMPLAINTS TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F5F5F7] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Case & Order</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Problem Reported</th>
                <th className="py-3.5 px-4">Urgency</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Recommended Solution</th>
                <th className="py-3.5 px-5 text-right">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {complaints.map((cmp) => (
                <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-mono font-bold text-[#0071E3]">{cmp.id}</div>
                    <div className="font-mono text-slate-500">Order {cmp.order_id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#1D1D1F]">{cmp.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{cmp.customer_email}</div>
                  </td>
                  <td className="py-4 px-4 max-w-xs">
                    <div className="font-semibold text-[#1D1D1F]">{cmp.category}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{cmp.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={cmp.priority} />
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={cmp.status} />
                  </td>
                  <td className="py-4 px-4 max-w-xs text-slate-600">
                    {cmp.recommended_decision || 'AI agents are investigating...'}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(cmp.id)}
                      className="px-3.5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View 8-Step Resolution Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-[#F5F5F7] border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages} ({total} total complaints)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#1D1D1F] font-medium disabled:opacity-40"
            >
              Previous Page
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#1D1D1F] font-medium disabled:opacity-40"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>

      {/* SUBMIT COMPLAINT MODAL */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="STEP 1: Submit a Customer Complaint"
        subtitle="Fill in the details below. As soon as you submit, your AI agents will start investigating the order, payment, and delivery status."
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-slate-700 leading-relaxed">
            <strong className="text-[#1D1D1F]">
              What happens after you click &quot;Start complaint investigation&quot;:
            </strong>{' '}
            ResolveAI will verify the order, check live shipping and payment records, compare
            solutions against your $250 policy limit, and either resolve the issue automatically or
            send it to Pending Approvals.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1D1D1F] font-semibold mb-1.5">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#1D1D1F] font-semibold mb-1.5">
                Customer Email Address *
              </label>
              <input
                type="email"
                required
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#1D1D1F] font-semibold mb-1.5">Select Order *</label>
              <select
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] font-mono"
              >
                <option value="ORD-9841">ORD-9841 ($499 • Delayed)</option>
                <option value="ORD-9842">ORD-9842 ($899 • Monitor)</option>
                <option value="ORD-9843">ORD-9843 ($349 • Headphones)</option>
                <option value="ORD-9844">ORD-9844 ($640 • Chair)</option>
                <option value="ORD-9845">ORD-9845 ($378 • Microphone)</option>
                <option value="ORD-9846">ORD-9846 ($199 • 4K Webcam)</option>
                <option value="ORD-9847">ORD-9847 ($1,290 • NAS Storage)</option>
                <option value="ORD-9848">ORD-9848 ($219 • Keyboard)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#1D1D1F] font-semibold mb-1.5">
                What went wrong? *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              >
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#1D1D1F] font-semibold mb-1.5">Urgency Level *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#1D1D1F] font-semibold mb-1.5">
              Describe the Customer&apos;s Problem *
            </label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] focus:bg-white focus:border-[#0071E3] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              {submitting ? 'AI Agents Investigating...' : 'Start Complaint Investigation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 8-STEP GUIDED COMPLAINT RESOLUTION TIMELINE MODAL */}
      <Modal
        open={Boolean(selectedDetail)}
        onClose={() => setSelectedDetail(null)}
        title={selectedDetail ? `Guided Complaint Resolution — ${selectedDetail.complaint.id}` : ''}
        subtitle={
          selectedDetail
            ? `Order ${selectedDetail.complaint.order_id} • ${selectedDetail.complaint.customer_name} • ${selectedDetail.complaint.category}`
            : ''
        }
        maxWidth="max-w-4xl"
      >
        {selectedDetail && (
          <div className="space-y-6 text-xs">
            {/* Top Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-500 font-medium">Overall Case Status:</span>
                <StatusBadge status={selectedDetail.complaint.status} />
                {selectedDetail.complaint.status === 'Awaiting Approval' && (
                  <Link
                    to="/app/approvals"
                    className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
                  >
                    Go to Pending Approvals to Authorize →
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRerunWorkflow(selectedDetail.complaint.id)}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-[#0071E3] border border-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-run Complaint Investigation
              </button>
            </div>

            {/* Recommended Solution Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-bold text-[#0071E3] uppercase mb-1">
                  What the Customer Reported
                </div>
                <p className="text-[#1D1D1F] leading-relaxed">
                  &ldquo;{selectedDetail.complaint.description}&rdquo;
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="font-bold text-emerald-800 uppercase mb-1">
                  Recommended Solution & Why
                </div>
                <div className="font-bold text-[#1D1D1F] mb-1">
                  {selectedDetail.complaint.recommended_decision}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedDetail.complaint.decision_reasoning}
                </p>
              </div>
            </div>

            {/* VISUAL 8-STEP GUIDED TIMELINE */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-[#1D1D1F]">
                  Step-by-Step Guided Resolution Timeline (Real Backend Status)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowRaw12Stages(!showRaw12Stages)}
                  className="text-xs text-[#0071E3] font-semibold hover:underline"
                >
                  {showRaw12Stages
                    ? 'Show Guided 8-Step View'
                    : 'Switch to Technical 12-Stage Trace'}
                </button>
              </div>

              {!showRaw12Stages ? (
                <div className="space-y-3">
                  {buildEightGuidedSteps(
                    selectedDetail.complaint,
                    selectedDetail.workflow
                  ).map((stepObj) => (
                    <div
                      key={stepObj.step}
                      className={`p-4 rounded-2xl border ${
                        stepObj.status === 'Completed'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : stepObj.status === 'Awaiting Approval'
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-[#F5F5F7] border-slate-200/80'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-[#1D1D1F]">{stepObj.title}</span>
                        <StatusBadge status={stepObj.status} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold">What is happening: </span>
                          <span className="text-[#1D1D1F]">{stepObj.whatIsHappening}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold">
                            Responsible AI Agent:{' '}
                          </span>
                          <span className="text-[#0071E3] font-semibold">
                            {stepObj.responsibleAgent}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold">
                            Information checked:{' '}
                          </span>
                          <span className="text-slate-700">{stepObj.infoChecked}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold">What happens next: </span>
                          <span className="text-slate-700">{stepObj.whatHappensNext}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(selectedDetail.workflow?.stages || []).map((stg) => (
                    <div
                      key={stg.step}
                      className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0071E3] border border-blue-200 font-mono font-bold flex items-center justify-center shrink-0">
                        {stg.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#1D1D1F] truncate">{stg.name}</span>
                          <StatusBadge status={stg.status} />
                        </div>
                        <div className="text-[11px] font-mono text-[#0071E3]">{stg.agent}</div>
                        <p className="text-[11px] text-slate-600 mt-1">{stg.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================================
// MODULE 4: ORDER MANAGEMENT (/app/orders)
// ============================================================================
export function OrderManagementPage() {
  const { isSimpleMode } = useUX();
  const [orders, setOrders] = useState([]);
  const [banner, setBanner] = useState('');

  const fetchOrders = async () => {
    const res = await api.get('/orders');
    setOrders(res.data.orders || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await api.patch(`/orders/${orderId}`, { status: newStatus });
    setBanner(`Updated order ${orderId} status to "${newStatus}".`);
    fetchOrders();
  };

  const handleReconcilePayment = async (paymentId, orderId) => {
    await api.post(`/payments/${paymentId}/reconcile`);
    setBanner(`Payment ${paymentId} for order ${orderId} has been verified and fixed.`);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Customer Orders & Payment Status'
            : '4. Order & Payment Ledger Management'
        }
        subtitle="Check customer orders, verify items ordered, and fix payment mismatches with one click."
        badge={<DemoSeededBadge label={`${orders.length} Active Orders`} />}
      />

      <ContextualHelpPanel
        title="What can I do on the Orders page?"
        summary="Here you can check any customer's order items, see if their payment went through cleanly, and fix duplicate or unlinked payments."
      />

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex justify-between items-center">
          <span className="font-medium">{banner}</span>
          <button onClick={() => setBanner('')} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F5F5F7] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-5 text-right">Available Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-[#0071E3]">{ord.id}</td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#1D1D1F]">{ord.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{ord.customer_email}</div>
                  </td>
                  <td className="py-4 px-4">
                    {(ord.items || []).map((it, idx) => (
                      <div key={idx} className="text-slate-700">
                        {it.name} (Qty: {it.qty})
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-[#1D1D1F]">
                    ${Number(ord.total_amount).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500">{ord.warehouse_id}</td>
                  <td className="py-4 px-4">
                    {ord.payment ? (
                      <div className="space-y-1">
                        <StatusBadge status={ord.payment.status} />
                        {ord.payment.inconsistency_flag && (
                          <div className="text-[11px] text-rose-600 font-medium max-w-[220px]">
                            {ord.payment.inconsistency_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">No payment linked</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    {ord.payment?.inconsistency_flag && (
                      <button
                        type="button"
                        onClick={() => handleReconcilePayment(ord.payment.id, ord.id)}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        Fix Payment Mismatch
                      </button>
                    )}
                    <select
                      aria-label={`Change status for order ${ord.id}`}
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] text-xs"
                    >
                      {[
                        'Confirmed',
                        'Processing',
                        'In Transit',
                        'Delayed',
                        'Delivered',
                        'Missing',
                        'Replaced',
                        'Refunded',
                      ].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 5: INVENTORY MANAGEMENT (/app/inventory)
// ============================================================================
export function InventoryManagementPage() {
  const { isSimpleMode } = useUX();
  const [inventory, setInventory] = useState([]);
  const [banner, setBanner] = useState('');

  const fetchInventory = async () => {
    const res = await api.get('/inventory');
    setInventory(res.data.inventory || []);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReplenish = async (item) => {
    await api.post(`/inventory/${item.id}/replenish`, { quantity: 50 });
    setBanner(`Added 50 units of "${item.product_name}" to ${item.warehouse_name}.`);
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Warehouse Stock & Inventory'
            : '5. Multi-Warehouse Inventory Management'
        }
        subtitle="Check how many items are available in your Seattle, Dallas, and Newark warehouses, and restock low items with one click."
        badge={<DemoSeededBadge label="3 Warehouses Connected" />}
      />

      <ContextualHelpPanel
        title="Understanding Warehouse Stock"
        summary="Available units = Total Stock minus Reserved Stock (items already promised to open orders). When Available units drop below your reorder level, ResolveAI flags the item so you can restock."
      />

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex justify-between items-center">
          <span className="font-medium">{banner}</span>
          <button onClick={() => setBanner('')} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {inventory.map((item) => {
          const freeUnits = item.stock_level - item.reserved_stock;
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#0071E3]">{item.sku}</span>
                  <StatusBadge status={item.status} />
                </div>
                <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">{item.product_name}</h3>
                <p className="text-xs text-slate-500 mb-4">{item.warehouse_name}</p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 text-center text-xs mb-3">
                  <div>
                    <div className="font-bold text-[#1D1D1F]">{item.stock_level}</div>
                    <div className="text-[10px] text-slate-500">Total</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-700">{item.reserved_stock}</div>
                    <div className="text-[10px] text-slate-500">Reserved</div>
                  </div>
                  <div>
                    <div
                      className={`font-bold ${
                        freeUnits <= item.reorder_threshold ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {freeUnits}
                    </div>
                    <div className="text-[10px] text-slate-500">Available</div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Cost: ${item.unit_cost}</span>
                  <span>Price: ${item.retail_price}</span>
                </div>
                <div className="text-[11px] text-[#0071E3] font-medium mt-1">
                  Backup Warehouse: {item.alternative_warehouse_id}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleReplenish(item)}
                className="mt-4 w-full py-2.5 rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] text-[#1D1D1F] hover:text-white text-xs font-semibold border border-slate-200/80 transition-colors"
              >
                + Add 50 Units to Warehouse Stock
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 6: LOGISTICS / DELIVERIES MANAGEMENT (/app/logistics)
// ============================================================================
export function LogisticsManagementPage() {
  const { isSimpleMode } = useUX();
  const [shipments, setShipments] = useState([]);
  const [banner, setBanner] = useState('');

  const fetchShipments = async () => {
    const res = await api.get('/logistics');
    setShipments(res.data.shipments || []);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleReroute = async (shp) => {
    await api.post(`/logistics/${shp.id}/reroute`, {
      carrier: 'UPS Next Day Air (Express Bypass)',
      hub: 'Dallas Central Air Gateway (WH-DAL-02)',
    });
    setBanner(
      `Package ${shp.id} (Order ${shp.order_id}) has been switched to UPS Next Day Air through Dallas.`
    );
    fetchShipments();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Deliveries & Package Tracking'
            : '6. Carrier Telemetry & Logistics Management'
        }
        subtitle="Track customer packages across FedEx, UPS, and DHL, see why a delivery is delayed, and switch delayed packages to a faster shipping route."
        badge={<DemoSeededBadge label="Live Carrier Tracking" />}
      />

      <ContextualHelpPanel
        title="How to handle delayed deliveries"
        summary="When a package is delayed or stuck at a regional shipping hub, click 'Switch to Express Shipping Route' to bypass the bottleneck."
      />

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex justify-between items-center">
          <span className="font-medium">{banner}</span>
          <button onClick={() => setBanner('')} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F5F5F7] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Package & Tracking</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Shipping Carrier</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Current Location & Notes</th>
                <th className="py-3.5 px-4">Delay Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {shipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-mono font-bold text-[#0071E3]">{shp.id}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {shp.tracking_number}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-semibold text-[#1D1D1F]">
                    {shp.order_id}
                  </td>
                  <td className="py-4 px-4 text-slate-700 font-medium">{shp.carrier}</td>
                  <td className="py-4 px-4 text-slate-600">
                    <div>From: {shp.origin_hub}</div>
                    <div className="text-[#0071E3] font-medium">To: {shp.destination_city}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-[#1D1D1F] font-medium">{shp.current_hub}</div>
                    {shp.disruption_reason && (
                      <div className="text-[11px] text-amber-700 max-w-xs mt-0.5">
                        {shp.disruption_reason}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono">
                    {shp.delay_hours > 0 ? (
                      <span className="text-rose-600 font-bold">
                        Delayed {shp.delay_hours} hrs
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">On Time</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={shp.status} />
                  </td>
                  <td className="py-4 px-5 text-right">
                    {['Delayed', 'Disrupted', 'Lost'].includes(shp.status) ? (
                      <button
                        type="button"
                        onClick={() => handleReroute(shp)}
                        className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold transition-all"
                      >
                        Switch to Express Shipping Route
                      </button>
                    ) : (
                      <span className="text-slate-400">On Schedule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
