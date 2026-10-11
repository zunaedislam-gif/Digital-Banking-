import { X, User, ShieldCheck, Mail, Phone, Calendar, MapPin, CreditCard, Clock, Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

interface AdminCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onAdjustBalance: (customer: any) => void;
  onChangeStatus: (customer: any) => void;
}

export function AdminCustomerModal({
  isOpen,
  onClose,
  customer,
  onAdjustBalance,
  onChangeStatus,
}: AdminCustomerModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              {customer.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{customer.fullName}</h3>
              <p className="text-xs text-slate-400">Customer ID: {customer.id}</p>
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
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Account Status Card */}
          {customer.account && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Account Number</div>
                <div className="text-base font-mono font-bold text-white">{customer.account.accountNumber}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Type: {customer.account.accountType.toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Current Balance</div>
                <div className="text-lg font-mono font-bold text-amber-400">
                  {formatCurrency(customer.account.balance)}
                </div>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  customer.account.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : customer.account.status === 'suspended'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {customer.account.status}
                </span>
              </div>
            </div>
          )}

          {/* KYC & Personal Details Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">KYC & Identity Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Email Address</div>
                  <div className="text-slate-200 truncate font-mono">{customer.email}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Phone Number</div>
                  <div className="text-slate-200 truncate font-mono">{customer.phone}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Date of Birth</div>
                  <div className="text-slate-200">{customer.dateOfBirth}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Member Since</div>
                  <div className="text-slate-200">{formatDate(customer.createdAt)}</div>
                </div>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-slate-400">Registered Residential Address</div>
                  <div className="text-slate-200 mt-0.5">{customer.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
                onAdjustBalance(customer);
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center space-x-2"
            >
              <Landmark className="w-4 h-4" />
              <span>Credit / Debit Account</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onChangeStatus(customer);
              }}
              className="flex-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Change Account Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
