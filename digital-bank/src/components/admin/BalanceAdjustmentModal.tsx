import { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';
import { api } from '../../services/api.js';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    fullName: string;
    email: string;
    account: {
      id: string;
      accountNumber: string;
      balance: number;
      availableBalance: number;
    } | null;
  } | null;
  onSuccess: () => void;
}

export function BalanceAdjustmentModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: BalanceAdjustmentModalProps) {
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !customer || !customer.account) return null;

  const currentBalance = customer.account.balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = type === 'credit' ? currentBalance + numAmount : currentBalance - numAmount;

  const handlePreset = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (numAmount <= 0) {
      setError('Please specify a positive adjustment amount.');
      return;
    }

    if (type === 'debit' && numAmount > currentBalance) {
      setError(`Cannot debit more than current balance (৳${currentBalance.toLocaleString()}).`);
      return;
    }

    if (!reason.trim()) {
      setError('A reference reason is required for bank audit logging.');
      return;
    }

    setIsSubmitting(true);
    const targetAccount = customer.account;
    if (!targetAccount) {
      setError('Customer account not found.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.adjustCustomerBalance(targetAccount.id, {
        amount: numAmount,
        type,
        reason: reason.trim(),
      });

      if (res.success) {
        setSuccessMessage(`Successfully ${type === 'credit' ? 'credited' : 'debited'} ৳${numAmount.toLocaleString()} to ${targetAccount.accountNumber}.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Failed to adjust balance.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing balance adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${type === 'credit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Administrative Balance Adjustment</h3>
              <p className="text-xs text-slate-400">Manual funds credit or debit with audit record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Account Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Target Customer</div>
              <div className="text-sm font-semibold text-white">{customer.fullName}</div>
              <div className="text-xs text-slate-400 font-mono">{customer.account.accountNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Current Balance</div>
              <div className="text-sm font-bold text-white font-mono">{formatCurrency(currentBalance)}</div>
            </div>
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Adjustment Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border transition ${
                  type === 'credit'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span>Credit Account (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border transition ${
                  type === 'debit'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 ring-1 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Debit Account (-)</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Adjustment Amount (BDT)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            {/* Presets */}
            <div className="flex items-center space-x-2 mt-2">
              {[1000, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 font-mono transition"
                >
                  +{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Administrative Reason & Notes *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Promotional bonus, fee reversal, dispute settlement"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">This explanation will be recorded permanently in the bank audit log.</p>
          </div>

          {/* Projected Balance Callout */}
          {numAmount > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Projected Balance:</span>
              <span className={`font-mono font-bold ${projectedBalance < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {formatCurrency(projectedBalance)}
              </span>
            </div>
          )}

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-950 transition flex items-center justify-center space-x-2 ${
                type === 'credit'
                  ? 'bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50'
                  : 'bg-rose-400 hover:bg-rose-300 disabled:opacity-50'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Confirm {type === 'credit' ? 'Credit' : 'Debit'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
