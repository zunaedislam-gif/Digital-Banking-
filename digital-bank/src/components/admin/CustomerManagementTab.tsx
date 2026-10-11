import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Landmark, 
  ShieldCheck, 
  Copy, 
  Check, 
  MoreVertical, 
  AlertCircle,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { BalanceAdjustmentModal } from './BalanceAdjustmentModal.js';
import { AccountStatusModal } from './AccountStatusModal.js';
import { AdminCustomerModal } from './AdminCustomerModal.js';

export function CustomerManagementTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminCustomers({
        q: searchQuery,
        status: statusFilter,
      });
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const copyToClipboard = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedAccount(accNumber);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const openAdjustModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsAdjustModalOpen(true);
  };

  const openStatusModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsStatusModalOpen(true);
  };

  const openViewModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Search Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Customer Accounts Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Oversee bank accounts, adjust balances, freeze/activate accounts, and inspect KYC credentials.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone, or account number..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </form>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'active', label: 'Active' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'dormant', label: 'Dormant' },
            { id: 'closed', label: 'Closed' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                statusFilter === item.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">Account Number</th>
                <th className="px-5 py-3.5 text-right">Available Balance</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customer accounts...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No customer accounts matching criteria.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const acc = c.account;
                  const isSuspended = acc?.status === 'suspended';
                  const isClosed = acc?.status === 'closed';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      {/* Customer Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-amber-400">
                            {c.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-xs">{c.fullName}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{c.email}</div>
                            <div className="text-slate-400 text-[10px]">{c.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Account Number */}
                      <td className="px-5 py-4">
                        {acc ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-white font-medium">{acc.accountNumber}</span>
                            <button
                              onClick={() => copyToClipboard(acc.accountNumber)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Copy account number"
                            >
                              {copiedAccount === acc.accountNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No account</span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="px-5 py-4 text-right">
                        {acc ? (
                          <div>
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              {formatCurrency(acc.balance)}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Avail: {formatCurrency(acc.availableBalance)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        {acc ? (
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            acc.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : acc.status === 'suspended'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {acc.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => openViewModal(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                            title="Inspect Customer KYC Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {acc && (
                            <>
                              <button
                                onClick={() => openAdjustModal(c)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition"
                                title="Credit or Debit Balance"
                              >
                                Adjust
                              </button>

                              <button
                                onClick={() => openStatusModal(c)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                  isSuspended
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                }`}
                                title="Change Status"
                              >
                                {isSuspended ? 'Unfreeze' : 'Status'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {customers.length} customer records</span>
          <span>ZR Digital Bank Core Database</span>
        </div>
      </div>

      {/* Modals */}
      <BalanceAdjustmentModal
        isOpen={isAdjustModalOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={fetchCustomers}
      />

      <AccountStatusModal
        isOpen={isStatusModalOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={fetchCustomers}
      />

      <AdminCustomerModal
        isOpen={isViewModalOpen}
        customer={selectedCustomer}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCustomer(null);
        }}
        onAdjustBalance={openAdjustModal}
        onChangeStatus={openStatusModal}
      />
    </div>
  );
}
