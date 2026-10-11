import { useState, useEffect } from 'react';
import { 
  Receipt, 
  Zap, 
  Flame, 
  Droplet, 
  Wifi, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Building2, 
  Layers, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { BillProvider, BillPaymentRecord } from '../../types/banking.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { BillPaymentModal } from './BillPaymentModal.js';

export function BillPaymentPage() {
  const [providers, setProviders] = useState<BillProvider[]>([]);
  const [history, setHistory] = useState<BillPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProviderId, setModalProviderId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const [provs, hist] = await Promise.all([
        api.getBillProviders(),
        api.getBillPaymentHistory(),
      ]);
      setProviders(provs || []);
      setHistory(hist || []);
    } catch (err) {
      console.error('Failed to load bill data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayProvider = (provId: string) => {
    setModalProviderId(provId);
    setModalOpen(true);
  };

  const categories = [
    { id: 'all', label: 'All Providers', icon: Layers },
    { id: 'electricity', label: 'Electricity', icon: Zap },
    { id: 'gas', label: 'Gas', icon: Flame },
    { id: 'water', label: 'Water', icon: Droplet },
    { id: 'internet', label: 'Internet', icon: Wifi },
    { id: 'mobile_recharge', label: 'Mobile Recharge', icon: Smartphone },
  ];

  const filteredProviders = providers.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'electricity': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'gas': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'water': return <Droplet className="w-5 h-5 text-blue-400" />;
      case 'internet': return <Wifi className="w-5 h-5 text-cyan-400" />;
      case 'mobile_recharge': return <Smartphone className="w-5 h-5 text-emerald-400" />;
      default: return <Receipt className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
            UTILITY SETTLEMENT ENGINE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Utility & Bill Payments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Settle electricity, gas, water, high-speed broadband, and mobile recharge instantly.
          </p>
        </div>

        <button
          onClick={() => {
            setModalProviderId(undefined);
            setModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Pay Any Bill</span>
        </button>
      </div>

      {/* Category Pills Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Providers Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Available Service Providers ({filteredProviders.length})
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading utility directory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      {getCategoryIcon(p.category)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      {p.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition">
                    {p.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 block mt-1 capitalize">
                    {p.category.replace('_', ' ')} • {p.accountNumberLabel}
                  </span>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePayProvider(p.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    <span>Pay Bill</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Payment History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              Paid Bills History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified electronic utility receipts and audit confirmations
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            {history.length} Settlements
          </span>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Provider</th>
                  <th className="py-3.5 px-4">Customer ID / Meter</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                          {getCategoryIcon(h.category)}
                        </div>
                        <span className="font-bold text-white block">{h.providerName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {h.billCustomerNumber}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatDateTime(h.timestamp)}
                    </td>

                    <td className="py-4 px-4 capitalize text-slate-300">
                      {h.category.replace('_', ' ')}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{h.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                      {formatCurrency(h.amount, h.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No utility bills paid yet.</p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Select any provider above to settle your first bill.
            </span>
          </div>
        )}
      </div>

      {/* Bill Payment Modal */}
      <BillPaymentModal
        isOpen={modalOpen}
        initialProviderId={modalProviderId}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
