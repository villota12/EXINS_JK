import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod } from '../types';
import {
  DollarSign,
  Receipt,
  History,
  Plus,
  Search,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

export const FinanceManagement: React.FC = () => {
  const {
    isDark,
    financeTab,
    setFinanceTab,
    expenseAccounts,
    addExpenseAccount,
    expenses,
    addExpense,
    transactions,
  } = useStore();

  // ================= 1. EXPENSE ACCOUNTS STATE =================
  const [accName, setAccName] = useState('');
  const [accBudget, setAccBudget] = useState<number | ''>('');
  const [accDesc, setAccDesc] = useState('');

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accBudget) return;

    addExpenseAccount({
      name: accName.trim(),
      monthlyBudget: Number(accBudget),
      description: accDesc.trim(),
    });

    setAccName('');
    setAccBudget('');
    setAccDesc('');
  };

  // ================= 2. RECORD EXPENSE STATE =================
  const [selectedAccountId, setSelectedAccountId] = useState(expenseAccounts[0]?.id || '');
  const [disbursementAmount, setDisbursementAmount] = useState<number | ''>('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptFile, setReceiptFile] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState(false);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReceiptFile(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !disbursementAmount || !disbursementDate) return;

    addExpense({
      accountId: selectedAccountId,
      amount: Number(disbursementAmount),
      date: disbursementDate,
      paymentMethod,
      receiptImage: receiptFile || undefined,
      description: expenseDesc.trim(),
    });

    setDisbursementAmount('');
    setExpenseDesc('');
    setReceiptFile('');
    setReceiptFileName('');
    setExpenseSuccessMsg(true);
    setTimeout(() => setExpenseSuccessMsg(false), 3000);
  };

  // ================= 3. TRANSACTION HISTORY STATE =================
  const [txSearch, setTxSearch] = useState('');
  const [flowFilter, setFlowFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Flow type filter
      if (flowFilter !== 'all' && t.type !== flowFilter) return false;

      // Method filter
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;

      // Date range filter
      if (txStartDate && t.date < txStartDate) return false;
      if (txEndDate && t.date > txEndDate) return false;

      // Search query
      if (txSearch) {
        const q = txSearch.toLowerCase();
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesRef = t.referenceId?.toLowerCase().includes(q);
        if (!matchesCategory && !matchesDesc && !matchesRef) return false;
      }

      return true;
    });
  }, [transactions, flowFilter, methodFilter, txStartDate, txEndDate, txSearch]);

  // Transaction summary calculations
  const totalInflow = filteredTransactions.reduce((sum, t) => sum + (t.type === 'inflow' ? t.inflow : 0), 0);
  const totalOutflow = filteredTransactions.reduce((sum, t) => sum + (t.type === 'outflow' ? t.outflow : 0), 0);
  const netOperatingFlow = totalInflow - totalOutflow;

  // Export to Excel / CSV format
  const exportToExcelCSV = () => {
    const headers = ['Date', 'Flow Type', 'Account Category', 'Description', 'Payment Method', 'Inflow (PHP)', 'Outflow (PHP)', 'Reference ID'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type.toUpperCase(),
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.paymentMethod.toUpperCase(),
      t.inflow,
      t.outflow,
      t.referenceId || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EXINS_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Finance Navigation Header */}
      <div
        className={`p-4 rounded-3xl border transition-all ${
          isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
        } backdrop-blur-xl shadow-lg`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Finance & Budget Management</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Operating expense accounts, disbursement records, and transaction flow audit logs.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-800/40 rounded-2xl border border-orange-500/20">
            {[
              { id: 'accounts', label: 'Expense Accounts', icon: DollarSign },
              { id: 'record', label: 'Record Expense', icon: Receipt },
              { id: 'history', label: 'Transaction History', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = financeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFinanceTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md'
                      : isDark
                      ? 'text-stone-300 hover:text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: EXPENSE ACCOUNTS ================= */}
      {financeTab === 'accounts' && (
        <div className="space-y-8">
          {/* Add Expense Account Form */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Define Operating Budget</span>
            </div>
            <h2 className="text-lg font-black mb-4">Create Expense Account & Budget Limit</h2>

            <form onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Expense Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quirino Hwy Store Lease, Meralco..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Monthly Budget Allocation (₱ Limit)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 18000"
                  value={accBudget}
                  onChange={(e) => setAccBudget(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="Billing terms, utility schedule, notes..."
                  value={accDesc}
                  onChange={(e) => setAccDesc(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Expense Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* Expense KPI Cards with budget limit & progress bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {expenseAccounts.map((acc) => {
              const percentSpent =
                acc.monthlyBudget > 0 ? Math.round((acc.totalSpent / acc.monthlyBudget) * 100) : 0;
              const isExceeded = acc.totalSpent > acc.monthlyBudget;

              return (
                <div
                  key={acc.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    isDark
                      ? isExceeded
                        ? 'bg-rose-950/20 border-rose-500/40 text-stone-100'
                        : 'bg-stone-900/80 border-orange-500/20 text-stone-100'
                      : isExceeded
                      ? 'bg-rose-50 border-rose-300 text-stone-900'
                      : 'bg-white border-orange-200 text-stone-900 shadow-md'
                  } backdrop-blur-xl flex flex-col justify-between space-y-4`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                        Monthly Operating Account
                      </span>
                      {isExceeded ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Budget Exceeded</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Within Budget</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-lg text-white">{acc.name}</h3>
                    <p className="text-xs text-stone-400 mt-1">{acc.description}</p>
                  </div>

                  {/* Progress Bar & Percent Spent */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-stone-300">Spent: ₱{acc.totalSpent.toLocaleString()}</span>
                      <span className="text-stone-400 font-mono">
                        Limit: ₱{acc.monthlyBudget.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                            : percentSpent > 80
                            ? 'bg-gradient-to-r from-amber-600 to-orange-400'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, percentSpent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className={isExceeded ? 'text-rose-400' : 'text-stone-300'}>
                        {percentSpent}% of budget used
                      </span>
                      {isExceeded && (
                        <span className="text-rose-400">
                          +₱{(acc.totalSpent - acc.monthlyBudget).toLocaleString()} over limit!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: RECORD EXPENSE ================= */}
      {financeTab === 'record' && (
        <div className="space-y-8">
          <div
            className={`p-6 sm:p-8 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg max-w-2xl mx-auto`}
          >
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Receipt className="w-4 h-4" />
              <span>Disbursement Entry</span>
            </div>
            <h2 className="text-xl font-black mb-4">Record Store Expense Outflow</h2>

            {expenseSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Expense disbursement successfully recorded and logged to transactions!</span>
              </div>
            )}

            <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Select Expense Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                >
                  {expenseAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Budget: ₱{acc.monthlyBudget.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Disbursement Amount (₱)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5200"
                    value={disbursementAmount}
                    onChange={(e) => setDisbursementAmount(e.target.value ? Number(e.target.value) : '')}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    required
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'gcash', 'bank_transfer', 'card'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize border text-center transition-all cursor-pointer ${
                        paymentMethod === m
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                          : isDark
                          ? 'border-stone-800 bg-stone-800 text-stone-300'
                          : 'border-stone-200 bg-stone-100 text-stone-700'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  File Upload for Receipt (Proof)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>Upload Receipt File</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-stone-400 truncate max-w-xs">
                    {receiptFileName || 'No file selected'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  placeholder="Official receipt reference number, payee name, notes..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-300'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer"
              >
                Save Expense Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: TRANSACTION HISTORY ================= */}
      {financeTab === 'history' && (
        <div className="space-y-6">
          {/* Filter Bar: Custom date range, search button, export to excel, flow filter, payment method filter */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg space-y-4`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black">All Store Transactions Ledger</h2>
                <p className="text-xs text-stone-400">
                  Search, filter by flows or payment method, and export to Excel/CSV.
                </p>
              </div>

              {/* Export to Excel button */}
              <button
                onClick={exportToExcelCSV}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-lg flex items-center gap-2 cursor-pointer self-start"
              >
                <Download className="w-4 h-4" />
                <span>Export to Excel (CSV)</span>
              </button>
            </div>

            {/* Filter controls row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search description, category..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                  }`}
                />
              </div>

              {/* Flow filter */}
              <div>
                <select
                  value={flowFilter}
                  onChange={(e) => setFlowFilter(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                  }`}
                >
                  <option value="all">All Flows (Inflow & Outflow)</option>
                  <option value="inflow">Sales Inflows Only</option>
                  <option value="outflow">Expense Outflows Only</option>
                </select>
              </div>

              {/* Payment method filter */}
              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-100 border-stone-300'
                  }`}
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* Custom Date Range Pickers */}
              <div className="flex items-center gap-1.5 bg-stone-800/40 p-1 rounded-xl border border-stone-700">
                <input
                  type="date"
                  value={txStartDate}
                  onChange={(e) => setTxStartDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-700 text-white"
                  title="Start Date"
                />
                <span className="text-stone-400 text-xs">to</span>
                <input
                  type="date"
                  value={txEndDate}
                  onChange={(e) => setTxEndDate(e.target.value)}
                  className="w-1/2 px-1.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-700 text-white"
                  title="End Date"
                />
              </div>
            </div>

            {/* KPI Summary Cards: Total Inflow, Total Outflow, Net Operating Flow (Inflow - Outflow) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-800">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Total Inflow
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ₱{totalInflow.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Total Outflow
                </span>
                <span className="text-2xl font-black text-rose-400">
                  ₱{totalOutflow.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/20">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                  Net Operating Flow (Inflow - Outflow)
                </span>
                <span
                  className={`text-2xl font-black ${
                    netOperatingFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ₱{netOperatingFlow.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Table: Date, Flow Type, Account Category, Description, Payment Method, Inflow, Outflow */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-500'
                    } uppercase text-[10px] tracking-wider`}
                  >
                    <th className="py-3 px-3 font-bold">Date</th>
                    <th className="py-3 px-3 font-bold">Flow Type</th>
                    <th className="py-3 px-3 font-bold">Account / Category</th>
                    <th className="py-3 px-3 font-bold">Description</th>
                    <th className="py-3 px-3 font-bold">Payment Method</th>
                    <th className="py-3 px-3 font-bold text-right">Inflow (₱)</th>
                    <th className="py-3 px-3 font-bold text-right">Outflow (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-orange-500/5 transition-colors ${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}
                    >
                      <td className="py-3.5 px-3 font-mono text-[11px] text-stone-400">{tx.date}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.type === 'inflow'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.type === 'inflow' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-stone-200">{tx.category}</td>
                      <td className="py-3.5 px-3 text-stone-300 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3.5 px-3 font-mono text-[11px] capitalize text-stone-400">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-400">
                        {tx.inflow > 0 ? `+₱${tx.inflow.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-rose-400">
                        {tx.outflow > 0 ? `-₱${tx.outflow.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                        No transactions found for the specified filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
