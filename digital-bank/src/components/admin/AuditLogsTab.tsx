import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock,
  Terminal,
  Download
} from 'lucide-react';
import { api } from '../../services/api.js';
import { formatDate } from '../../utils/formatters.js';

export function AuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        search: searchQuery,
        action: actionFilter,
        result: resultFilter,
        limit: 150,
      });
      setLogs(res.auditLogs || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resultFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Result', 'User Email', 'Role', 'Resource', 'Details'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.result}"`,
      `"${l.userEmail || 'Anonymous'}"`,
      `"${l.userRole || 'System'}"`,
      `"${l.resource || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zr_bank_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>Bank Security & Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronicle of critical actions, authentication events, transfers, and administrative balance overrides.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user email, resource, action, or details..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="all">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CUSTOMER_REGISTRATION">Registrations</option>
            <option value="FUND_TRANSFER_SUCCESS">Transfer Success</option>
            <option value="FUND_TRANSFER_FAILED">Transfer Failure</option>
            <option value="BILL_PAYMENT_SUCCESS">Bill Payments</option>
            <option value="ADMIN_ACCOUNT_STATUS_CHANGE">Admin Status Change</option>
            <option value="ADMIN_BALANCE_CREDIT">Admin Balance Credit</option>
            <option value="ADMIN_BALANCE_DEBIT">Admin Balance Debit</option>
            <option value="PASSWORD_CHANGED">Password Changes</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="all">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Event Action</th>
                <th className="px-5 py-3.5">Actor / User</th>
                <th className="px-5 py-3.5">Resource</th>
                <th className="px-5 py-3.5">Event Details</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No audit events match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.result === 'SUCCESS';
                  const isFailure = log.result === 'FAILURE';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-slate-300 text-xs">
                          {log.userEmail || 'System Engine'}
                        </div>
                        {log.userRole && (
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Role: {log.userRole}
                          </div>
                        )}
                      </td>

                      {/* Resource */}
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-xs whitespace-nowrap">
                        {log.resource || '—'}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 text-slate-300 text-xs max-w-md">
                        <p className="leading-relaxed">{log.details}</p>
                      </td>

                      {/* Result */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isFailure
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : isFailure ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{log.result}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {logs.length} of {totalCount} logged events</span>
          <span>Regulatory Compliance Tier 1 Logging Active</span>
        </div>
      </div>
    </div>
  );
}
