import { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';
import { AccountStatus } from '../../types/banking.js';

interface AccountStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    fullName: string;
    email: string;
    account: {
      id: string;
      accountNumber: string;
      status: AccountStatus;
    } | null;
  } | null;
  onSuccess: () => void;
}

export function AccountStatusModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: AccountStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>(customer?.account?.status || 'active');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !customer || !customer.account) return null;

  const currentStatus = customer.account.status;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (selectedStatus === currentStatus) {
      setError('Selected status is the same as the current status.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for changing this customer account status.');
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
      const res = await api.updateCustomerStatus(targetAccount.id, selectedStatus, reason.trim());
      if (res.success) {
        setSuccessMessage(`Account status changed to ${selectedStatus.toUpperCase()}.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Failed to update account status.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: AccountStatus; label: string; desc: string; icon: any; color: string }[] = [
    {
      value: 'active',
      label: 'Active',
      desc: 'Full operational access. Customer can send transfers, pay bills, and manage cards.',
      icon: Unlock,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      value: 'suspended',
      label: 'Suspended (Frozen)',
      desc: 'Temporarily blocked from outgoing transfers and bill payments due to policy or risk check.',
      icon: Lock,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
      value: 'dormant',
      label: 'Dormant',
      desc: 'Inactive account requiring customer identity re-verification to resume transfers.',
      icon: AlertTriangle,
      color: 'text-slate-400 border-slate-600 bg-slate-800/60',
    },
    {
      value: 'closed',
      label: 'Closed',
      desc: 'Permanently deactivated. Account cannot be reopened or perform any financial activity.',
      icon: ShieldAlert,
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Modify Account Status</h3>
              <p className="text-xs text-slate-400">Enforce account freeze, suspension, or reactivation</p>
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
          {/* Target Customer Info */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Account Holder:</span>
              <div className="text-sm font-semibold text-white">{customer.fullName}</div>
              <div className="text-xs font-mono text-slate-400">{customer.account.accountNumber}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Current Status:</span>
              <div className="mt-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentStatus === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : currentStatus === 'suspended'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Status Choice */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Select New Status</label>
            <div className="space-y-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    className={`w-full p-3 rounded-xl border text-left flex items-start space-x-3 transition ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase">{opt.label}</span>
                        {isSelected && <span className="text-[10px] font-bold text-amber-400">SELECTED</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Compliance Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Risk check passed, customer requested temporary freeze"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

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
              disabled={isSubmitting || selectedStatus === currentStatus}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-semibold transition flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Apply Status Change</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
