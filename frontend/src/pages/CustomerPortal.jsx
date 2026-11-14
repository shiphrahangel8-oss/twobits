import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Package,
  MessageSquarePlus,
  LogOut,
  ArrowLeft,
  Sparkles,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/DesignSystem';

const CATEGORIES = [
  'Delayed delivery',
  'Missing order',
  'Payment deducted but order missing',
  'Damaged product',
  'Wrong product',
  'Cancellation',
  'Replacement',
  'Refund request',
];

export function CustomerPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState('');
  const [form, setForm] = useState({
    order_id: 'ORD-9846',
    category: 'Delayed delivery',
    priority: 'High',
    description: 'My order was supposed to arrive yesterday, but I have not received it.',
  });

  const fetchPortalData = async () => {
    const [oRes, cRes] = await Promise.all([api.get('/orders'), api.get('/complaints')]);
    setOrders(oRes.data.orders || []);
    setComplaints(cRes.data.items || []);
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBanner('');
    try {
      const res = await api.post('/complaints', {
        customer_name: user?.name || 'Sophia Sterling',
        customer_email: user?.email || 'customer@resolveai.io',
        ...form,
      });
      setBanner(res.data.message);
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      <header className="h-16 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-[#1D1D1F]">
              ResolveAI Customer Order Tracking & Support
            </span>
            <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0071E3] border border-blue-200">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role !== 'CUSTOMER' && (
            <Link
              to="/app/dashboard"
              className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0071E3]" /> Back to Business Workspace
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/signin');
            }}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {banner && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" /> {banner}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: My Orders & Support Cases */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h2 className="text-lg font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0071E3]" /> Your Orders & Delivery Status
              </h2>
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-mono font-bold text-[#0071E3]">{ord.id}</span>
                        <StatusBadge status={ord.status} />
                        <span className="font-mono text-xs font-bold text-[#1D1D1F]">
                          ${Number(ord.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        {(ord.items || []).map((i) => `${i.name} (Qty: ${i.qty})`).join(', ')}
                      </div>
                      {ord.shipment && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Carrier: {ord.shipment.carrier} ({ord.shipment.tracking_number}) • Current
                          Location: {ord.shipment.current_hub}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h2 className="text-lg font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0071E3]" /> Your Support & Resolution Updates
              </h2>
              <div className="space-y-4">
                {complaints.map((cmp) => (
                  <div
                    key={cmp.id}
                    className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1D1D1F]">
                        {cmp.id} • Order {cmp.order_id} ({cmp.category})
                      </span>
                      <StatusBadge status={cmp.status} />
                    </div>
                    <p className="text-xs text-slate-600">&ldquo;{cmp.description}&rdquo;</p>
                    {cmp.customer_notification && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <strong>ResolveAI Update:</strong> {cmp.customer_notification}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Report an Issue Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] h-fit">
            <h2 className="text-lg font-bold text-[#1D1D1F] mb-1 flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-[#0071E3]" /> Need Help with an Order?
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Submit your question below and our AI support specialists will check your order,
              payment, and delivery right away.
            </p>

            <form onSubmit={handleSubmitIssue} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Order</label>
                <select
                  value={form.order_id}
                  onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] font-medium"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} (${o.total_amount} • {o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  What Is the Problem?
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F] font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tell Us What Happened
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold transition-colors shadow-xs"
              >
                {submitting ? 'Checking Your Order...' : 'Submit & Start Resolution'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
