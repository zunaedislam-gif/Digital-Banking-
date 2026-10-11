import { 
  ShieldCheck, 
  Zap, 
  PieChart, 
  Receipt, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Landmark,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function LandingPage({ onOpenLogin, onOpenRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Landmark className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                ZR Digital Bank
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                Enterprise FinTech
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              Login
            </button>
            <button
              onClick={onOpenRegister}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <span>Open an Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Next-Generation Digital Banking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.12]">
            Banking made simple,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              secure and intelligent.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed font-normal">
            ZR Digital Bank provides secure digital banking and intelligent financial management.
            Experience instant transfers, automated utility bill settlements, smart analytics, and effortless debit card controls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <span>Open an Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-base transition flex items-center justify-center gap-2"
            >
              <span>Sign In to Dashboard</span>
            </button>
          </div>

          {/* Trust Banner / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-900">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-left">
              <span className="text-2xl font-bold text-white font-mono block">0.00%</span>
              <span className="text-xs text-slate-400">Zero transfer fees</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-left">
              <span className="text-2xl font-bold text-white font-mono block">Instant</span>
              <span className="text-xs text-slate-400">Real-time settlement</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-left">
              <span className="text-2xl font-bold text-emerald-400 font-mono block">৳10,000</span>
              <span className="text-xs text-slate-400">Welcome demo bonus</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-left">
              <span className="text-2xl font-bold text-white font-mono block">256-bit</span>
              <span className="text-xs text-slate-400">Cryptographic security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Sections */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              Comprehensive Financial Engine
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for everyday simplicity & enterprise reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Secure Banking */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Secure Banking</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Strict tenant data separation, role-based authorization, scrypt password hashing, and complete immutable audit trails for every transaction.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Granular customer data isolation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Admin governance & compliance
                </li>
              </ul>
            </div>

            {/* Feature 2: Instant Transfers */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 border border-teal-500/20 group-hover:scale-110 transition duration-300">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Transfers</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Send money effortlessly to any account number with automatic recipient verification, pre-transfer confirmations, and instant notifications.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Live recipient lookup & masking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Atomic balance debit & credit
                </li>
              </ul>
            </div>

            {/* Feature 3: Smart Financial Overview */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition duration-300">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Financial Overview</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Track available balances, monthly cash flow, income versus expense ratios, and breakdown spending categories based on actual transaction records.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Dynamic category breakdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Real-time balance updates
                </li>
              </ul>
            </div>

            {/* Feature 4: Easy Bill Payments */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Easy Bill Payments</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Pay electricity (DESCO, DPDC), gas (Titas), water (Dhaka WASA), broadband internet (Link3, Carnival), and top up mobile recharges directly.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant receipts & audit logs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10+ Bangladeshi utility providers
                </li>
              </ul>
            </div>

            {/* Feature 5: Card Management */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition duration-300">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Card Management</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Manage simulated Visa and Mastercard debit cards. Freeze or unfreeze cards instantly with one tap to protect funds from unauthorized transactions.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Instant freeze / unfreeze toggle
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Masked card numbers & limit control
                </li>
              </ul>
            </div>

            {/* Feature 6: Admin Management & Auditing */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Admin Command Center</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Full administrative monitoring suite: audit security logs, monitor liquidity reserves, inspect transaction streams, and manage account statuses.
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Customer activation / suspension
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> System-wide liquidity metrics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security Banner Section */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Bank-Grade Security in Every Interaction
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Every operation across ZR Digital Bank is authenticated, audited, and strictly governed. 
              Passwords are salted and hashed with scrypt, account data is protected by session verification, 
              and unauthorized balance modifications are mathematically prevented.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onOpenRegister}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                Get Started Today
              </button>
              <button
                onClick={onOpenLogin}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
              >
                Access Existing Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Landmark className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-white">ZR Digital Bank</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Modern digital banking platform simulation engineered for portfolios and fintech system demonstrations.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Customer Banking</h4>
              <ul className="space-y-2">
                <li><span className="hover:text-emerald-400 transition cursor-pointer" onClick={onOpenLogin}>Money Transfers</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer" onClick={onOpenLogin}>Utility Bill Pay</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer" onClick={onOpenLogin}>Virtual Cards</span></li>
                <li><span className="hover:text-emerald-400 transition cursor-pointer" onClick={onOpenLogin}>Beneficiaries</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Enterprise & Security</h4>
              <ul className="space-y-2">
                <li><span className="text-slate-500">Tenant Data Isolation</span></li>
                <li><span className="text-slate-500">Immutable Audit Logs</span></li>
                <li><span className="text-slate-500">256-bit Cryptographic Hashing</span></li>
                <li><span className="hover:text-amber-400 transition cursor-pointer" onClick={onOpenLogin}>Admin Governance</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Compliance Notice</h4>
              <p className="text-slate-500 leading-relaxed">
                This software is an educational simulation. It does not connect to real bank accounts or process actual fiat money.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
            <p>© 2026 ZR Digital Bank. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Educational & Portfolio Simulation • Bangladeshi Taka (৳)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
