import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Wallet, 
  ReceiptText, 
  ShieldCheck, 
  LogOut, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  BarChart3,
  Server,
  Database,
  Lock,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { CustomerManagementTab } from './CustomerManagementTab.js';
import { AdminTransactionsTab } from './AdminTransactionsTab.js';
import { AuditLogsTab } from './AuditLogsTab.js';

export type AdminTab = 'overview' | 'customers' | 'transactions' | 'audit_logs' | 'system_health';

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminMetrics();
      setMetrics(data.summary);
      setChartData({
        transactionTypes: data.transactionTypes || [],
        monthlyVolumeTrend: data.monthlyVolumeTrend || [],
        customerGrowth: data.customerGrowth || [],
        recentTransactions: data.recentTransactions || [],
      });
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
            ZR
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-base tracking-tight">ZR Digital Bank</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
              ADMIN CONTROL
            </span>
          </div>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Admin:</span>
            <span className="text-slate-200 font-semibold">{user?.email}</span>
          </div>

          <button
            onClick={() => logout()}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header */}
      <div className="bg-slate-900/40 border-b border-slate-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
            { id: 'customers', label: 'Customer Accounts', icon: Users },
            { id: 'transactions', label: 'Transactions Ledger', icon: ReceiptText },
            { id: 'audit_logs', label: 'Audit Trail & Security', icon: ShieldCheck },
            { id: 'system_health', label: 'System Diagnostics', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Customers */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Customers</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold font-mono text-white">
                    {metrics ? metrics.totalCustomers : '—'}
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-400 mt-1 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    <span>Registered Retail Accounts</span>
                  </div>
                </div>
              </div>

              {/* Total Money in System */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Money In Vault</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {metrics ? formatCurrency(metrics.totalMoneyInSystem) : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Cumulative customer deposits
                  </div>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Processed Transactions</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <ReceiptText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold font-mono text-white">
                    {metrics ? metrics.totalTransactions : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Today: {metrics ? metrics.todayTransactions : 0} operations
                  </div>
                </div>
              </div>

              {/* System Security & Health */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Active Bank Status</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>OPERATIONAL</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Failures: {metrics?.failedTransactions || 0} (0.0%)
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Volume Trend (Bar chart) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <span>Monthly Transaction Volume Trend</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Rolling 6-month aggregate turnover</p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    Real-Time Database
                  </span>
                </div>

                {chartData && chartData.monthlyVolumeTrend.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                      {chartData.monthlyVolumeTrend.map((m: any, idx: number) => {
                        const maxVol = Math.max(...chartData.monthlyVolumeTrend.map((item: any) => item.volume), 1);
                        const heightPercent = Math.max(Math.round((m.volume / maxVol) * 100), 12);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-mono text-amber-300">
                              ৳{(m.volume / 1000).toFixed(0)}k
                            </div>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg group-hover:from-amber-500 group-hover:to-amber-300 transition-all shadow-md shadow-amber-500/10"
                            />
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition">
                              {m.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                    No transaction history recorded yet.
                  </div>
                )}
              </div>

              {/* Transaction Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Transaction Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">By financial movement type</p>

                  <div className="space-y-3.5 mt-6">
                    {chartData && chartData.transactionTypes.map((typeItem: any) => (
                      <div key={typeItem.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{typeItem.name}</span>
                          <span className="font-mono text-amber-400 font-bold">{typeItem.percentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            style={{ width: `${typeItem.percentage}%` }}
                            className="h-full bg-amber-400 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{typeItem.count} transactions</span>
                          <span className="font-mono">{formatCurrency(typeItem.volume)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Fast Action:</span>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 transition"
                  >
                    <span>Manage Customers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Transactions Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Admin Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Administrative Short-Cuts</span>
                </h3>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                        Customer Accounts & Balances
                      </div>
                      <div className="text-[11px] text-slate-400">Credit or debit funds, freeze accounts</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                        Full Transaction Ledger
                      </div>
                      <div className="text-[11px] text-slate-400">Search by reference or filter failed operations</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition">
                        Security & Compliance Audit
                      </div>
                      <div className="text-[11px] text-slate-400">Inspect login attempts and administrative events</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                  </button>
                </div>
              </div>

              {/* Recent Activity Mini-Feed */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Recent Bank Ledger Movements</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {chartData?.recentTransactions.length > 0 ? (
                    chartData.recentTransactions.slice(0, 5).map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            t.type === 'deposit'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {t.type === 'deposit' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white">
                              {t.description || 'Interbank transfer'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.transactionReference} • {formatDate(t.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400">
                            {formatCurrency(t.amount)}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400">
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No transactions recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Customer Management */}
        {activeTab === 'customers' && <CustomerManagementTab />}

        {/* Tab: Transactions Ledger */}
        {activeTab === 'transactions' && <AdminTransactionsTab />}

        {/* Tab: Audit Trail & Security */}
        {activeTab === 'audit_logs' && <AuditLogsTab />}

        {/* Tab: System Health & Diagnostics */}
        {activeTab === 'system_health' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Server className="w-6 h-6 text-amber-400" />
                <span>System Architecture & Engine Diagnostics</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Technical parameters, file storage persistence integrity, and runtime engine status.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Backend Server</span>
                <div className="text-base font-bold text-white mt-1">Express.js (Node / TSX)</div>
                <div className="text-[11px] text-emerald-400 mt-1">Port 3000 • Connected</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Data Store</span>
                <div className="text-base font-bold text-white mt-1">Supabase Cloud Database</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>nrkgmudgecagtunfokte.supabase.co</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Security Middleware</span>
                <div className="text-base font-bold text-white mt-1">Bearer Token RBAC</div>
                <div className="text-[11px] text-emerald-400 mt-1">Active Customer / Admin Guards</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Simulation Operational Details
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ZR Digital Bank is running as an end-to-end full-stack portfolio simulation. All money transfers,
                bill payments, card status toggles, user registrations, and administrative balance credits are
                executed against the persistent backend with real validations (overdraft checks, account status verification,
                password hashing, and timestamped immutable audit logs).
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-[11px] text-slate-600">
        ZR Digital Bank Administrative Command Console • Enterprise Grade Security Simulation
      </footer>
    </div>
  );
}
