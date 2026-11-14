import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, ArrowRight, Lock, Mail, User, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@resolveai.io');
  const [password, setPassword] = useState('ResolveAdmin123!');
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/auth/demo-accounts')
      .then((res) => setDemoAccounts(res.data.accounts || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (acct) => {
    setEmail(acct.email);
    setPassword(acct.password);
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(acct.email, acct.password);
      if (loggedInUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Demo sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Clean Apple-Style Sign In Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1D1D1F]">ResolveAI</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight mb-1.5">
            Sign in to ResolveAI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-7">
            Open your guided business operations workspace or customer tracking portal.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(0,113,227,0.22)]"
            >
              {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New to ResolveAI?</span>
            <Link to="/get-started" className="text-[#0071E3] hover:underline font-semibold">
              Create an Account →
            </Link>
          </div>
        </div>

        {/* Right: One-Click Demo Role Cards */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-[32px] p-8 sm:p-10 shadow-[0_12px_36px_rgba(0,0,0,0.04)] space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0071E3] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>One-Click Demo Access</span>
          </div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">
            Explore ResolveAI with Instant Role Sign-In
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Click any role below to sign in immediately and explore the workspace from that person&apos;s perspective:
          </p>

          <div className="space-y-3 pt-1">
            {demoAccounts.map((acct) => (
              <button
                key={acct.role}
                type="button"
                onClick={() => handleQuickDemoLogin(acct)}
                className="w-full text-left p-4 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/50 border border-slate-200/80 hover:border-[#0071E3]/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#0071E3]">{acct.role}</span>
                  <span className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-all">
                    Sign In →
                  </span>
                </div>
                <div className="text-sm font-bold text-[#1D1D1F]">
                  {acct.name}{' '}
                  <span className="text-xs font-normal text-slate-500">({acct.email})</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{acct.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GetStartedPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'BUSINESS_MANAGER',
    department: 'Global E-Commerce Operations',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const newUser = await register(form);
      if (newUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto bg-white border border-slate-200/90 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-2xl bg-[#1D1D1F] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1D1D1F]">ResolveAI</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight mb-1.5">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-7">
          Start using your guided AI business operations workspace in seconds.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Jordan Taylor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="jordan@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
              >
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="BUSINESS_MANAGER">Business Manager</option>
                <option value="SUPPORT_EMPLOYEE">Support Employee</option>
                <option value="CUSTOMER">Customer (Portal Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/90 text-sm text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(0,113,227,0.22)]"
          >
            {submitting ? 'Creating Account...' : 'Create Account & Open Workspace'}{' '}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already have an account?</span>
          <Link to="/signin" className="text-[#0071E3] hover:underline font-semibold">
            Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
