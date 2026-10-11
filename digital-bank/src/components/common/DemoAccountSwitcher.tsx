import { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  X, 
  CheckCircle2, 
  KeyRound, 
  Building2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface DemoAccount {
  role: 'admin' | 'customer';
  name: string;
  email: string;
  accountNumber?: string;
  balanceBDT?: number;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    name: 'System Administrator (HQ)',
    email: 'admin@zrbank.com',
    description: 'Full administrative portal: metrics, freeze accounts, balance adjustments, audit logs.',
  },
  {
    role: 'customer',
    name: 'Zunaed Ahmed',
    email: 'zunaed@example.com',
    accountNumber: 'ZR-1049-8821',
    balanceBDT: 125450,
    description: 'Primary customer with rich transaction history, active card, and beneficiaries.',
  },
  {
    role: 'customer',
    name: 'Md Rahim Uddin',
    email: 'rahim@example.com',
    accountNumber: 'ZR-2083-4419',
    balanceBDT: 84200,
    description: 'Customer account with active utility bills and P2P transfers.',
  },
  {
    role: 'customer',
    name: 'Nusrat Jahan',
    email: 'nusrat@example.com',
    accountNumber: 'ZR-3391-7725',
    balanceBDT: 210000,
    description: 'High-net-worth customer account with premium balance and card limit.',
  },
  {
    role: 'customer',
    name: 'Tanvir Hasan',
    email: 'tanvir@example.com',
    accountNumber: 'ZR-4812-6630',
    balanceBDT: 45900,
    description: 'Customer account for testing recipient transfers.',
  },
  {
    role: 'customer',
    name: 'Sadia Islam',
    email: 'sadia@example.com',
    accountNumber: 'ZR-6720-1194',
    balanceBDT: 62300,
    description: 'Customer account with recent mobile top-ups and bill settlements.',
  },
];

export function DemoAccountSwitcher() {
  const { user, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const handleSwitch = async (email: string, role: string) => {
    setIsSwitching(email);
    try {
      const password = role === 'admin' ? 'AdminPassword123!' : 'Customer123!';
      await login(email, password);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    } finally {
      setIsSwitching(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-2xl hover:border-amber-400/60 transition group text-xs font-semibold"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Accounts Switcher</span>
        </button>
      )}

      {/* Expanded Quick Switcher Tray */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-80 sm:w-96 shadow-2xl backdrop-blur-xl overflow-hidden animate-fadeIn text-xs">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">Instant Demo Account Switcher</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Session Note */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Currently logged in:</span>
            <span className="font-mono text-white font-medium truncate max-w-[180px]">
              {user ? user.email : 'None (Guest)'}
            </span>
          </div>

          {/* List of Demo Accounts */}
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.email.toLowerCase() === acc.email.toLowerCase();
              const isAdmin = acc.role === 'admin';

              return (
                <button
                  key={acc.email}
                  disabled={isCurrent || isSwitching !== null}
                  onClick={() => handleSwitch(acc.email, acc.role)}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-white truncate">{acc.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {acc.role}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</div>

                    {acc.accountNumber && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Acc: {acc.accountNumber} • ৳{acc.balanceBDT?.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-bold text-amber-400 px-2 py-1 rounded bg-amber-500/20 shrink-0">
                      ACTIVE
                    </span>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-400 transition shrink-0">
                      {isSwitching === acc.email ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Guidance */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            Click any demo profile to switch sessions instantly without passwords.
          </div>
        </div>
      )}
    </div>
  );
}
