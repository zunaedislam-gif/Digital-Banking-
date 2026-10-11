import { useState } from 'react';
import { Send, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { SendMoneyModal } from './SendMoneyModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatCurrency } from '../../utils/formatters.js';

export function SendMoneyPage() {
  const { account } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            INSTANT TRANSFERS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Send Money Securely
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-fee transfers to any ZR Digital Bank customer account with instant real-time settlement.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Available Balance banner */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Current Available Balance</span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white block">
              {formatCurrency(account?.availableBalance || 0)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
        >
          <span>Start Transfer Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Instant Validation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic recipient name lookup protects you from typing mistakes before executing any transfer.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>0% Commission</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All internal transfers between ZR Digital Bank accounts are 100% free with immediate ledger balance updates.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Two-Way Alerts</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Both the sender and recipient receive automated digital notifications and transaction statements.
          </p>
        </div>
      </div>

      {/* Modal */}
      <SendMoneyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
