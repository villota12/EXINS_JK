import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod, ExpenseAccount, Expense, Transaction } from '../types';
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
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { SalesExpensesLineGraph } from './SalesExpensesLineGraph';

export const FinanceManagement: React.FC = () => {
  const {
    isDark,
    financeTab,
    setFinanceTab,
    expenseAccounts,
    addExpenseAccount,
    updateExpenseAccount,
    deleteExpenseAccount,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStore();

  // ================= 1. EXPENSE ACCOUNTS STATE =================
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accBudget, setAccBudget] = useState<number | ''>('');
  const [accDesc, setAccDesc] = useState('');

  const handleStartEditAccount = (acc: ExpenseAccount) => {
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccBudget(acc.monthlyBudget);
    setAccDesc(acc.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditAccount = () => {
    setEditingAccountId(null);
    setAccName('');
    setAccBudget('');
    setAccDesc('');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accBudget) return;

    if (editingAccountId) {
      updateExpenseAccount(editingAccountId, {
        name: accName.trim(),
        monthlyBudget: Number(accBudget),
        description: accDesc.trim(),
      });
      handleCancelEditAccount();
      return;
    }

    addExpenseAccount({
      name: accName.trim(),
      monthlyBudget: Number(accBudget),
      description: accDesc.trim(),
    });

    handleCancelEditAccount();
  };

  // ================= 2. RECORD EXPENSE STATE =================
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(expenseAccounts[0]?.id || '');
  const [disbursementAmount, setDisbursementAmount] = useState<number | ''>('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptFile, setReceiptFile] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState(false);

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setSelectedAccountId(exp.accountId);
    setDisbursementAmount(exp.amount);
    setDisbursementDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setExpenseDesc(exp.description || '');
    if (exp.receiptImage) {
      setReceiptFile(exp.receiptImage);
      setReceiptFileName('Receipt image attached');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setDisbursementAmount('');
    setExpenseDesc('');
    setReceiptFile('');
    setReceiptFileName('');
  };

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

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        accountId: selectedAccountId,
        amount: Number(disbursementAmount),
        date: disbursementDate,
        paymentMethod,
        receiptImage: receiptFile || undefined,
        description: expenseDesc.trim(),
      });
      handleCancelEditExpense();
      setExpenseSuccessMsg(true);
      setTimeout(() => setExpenseSuccessMsg(false), 3000);
      return;
    }

    addExpense({
      accountId: selectedAccountId,
      amount: Number(disbursementAmount),
      date: disbursementDate,
      paymentMethod,
      receiptImage: receiptFile || undefined,
      description: expenseDesc.trim(),
    });

    handleCancelEditExpense();
    setExpenseSuccessMsg(true);
    setTimeout(() => setExpenseSuccessMsg(false), 3000);
  };

  // ================= 3. TRANSACTION HISTORY & EDIT STATE =================
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  const monthlyComparisonData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May 2026', short: 'May' },
      { key: '2026-06', label: 'Jun 2026', short: 'Jun' },
      { key: '2026-07', label: 'Jul 2026', short: 'Jul' },
      { key: '2026-08', label: 'Aug 2026', short: 'Aug' },
      { key: '2026-09', label: 'Sep 2026', short: 'Sep' },
    ];

    const monthMap: Record<string, { sales: number; expense: number }> = {
      '2026-05': { sales: 68400, expense: 31200 },
      '2026-06': { sales: 79200, expense: 36400 },
      '2026-07': { sales: 88500, expense: 41800 },
      '2026-08': { sales: 94800, expense: 43500 },
      '2026-09': { sales: 0, expense: 0 },
    };

    transactions.forEach((t) => {
      const monthKey = t.date.slice(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { sales: 0, expense: 0 };
        const d = new Date(t.date);
        months.push({
          key: monthKey,
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          short: d.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
      if (t.type === 'inflow') {
        monthMap[monthKey].sales += t.inflow;
      } else {
        monthMap[monthKey].expense += t.outflow;
      }
    });

    return months.map((m) => {
      const sales = monthMap[m.key]?.sales || 0;
      const expense = monthMap[m.key]?.expense || 0;
      const net = sales - expense;
      return {
        key: m.key,
        label: m.label,
        short: m.short,
        sales,
        expense,
        net,
      };
    });
  }, [transactions]);

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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <DollarSign className="w-4 h-4" />
                <span>{editingAccountId ? 'Edit Operating Budget' : 'Define Operating Budget'}</span>
              </div>
              {editingAccountId && (
                <button
                  type="button"
                  onClick={handleCancelEditAccount}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-lg font-black mb-4">
              {editingAccountId ? 'Update Expense Account & Budget Limit' : 'Create Expense Account & Budget Limit'}
            </h2>

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
                  <span>{editingAccountId ? 'Update Expense Account' : 'Save Expense Account'}</span>
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
                      <div className="flex items-center gap-1.5">
                        {isExceeded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Over Budget</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Within Budget</span>
                          </span>
                        )}

                        {/* Edit & Delete Action Buttons */}
                        <button
                          onClick={() => handleStartEditAccount(acc)}
                          className="p-1 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Expense Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete expense account "${acc.name}" from database?`)) {
                              deleteExpenseAccount(acc.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Expense Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4" />
                <span>{editingExpenseId ? 'Edit Disbursement Entry' : 'Disbursement Entry'}</span>
              </div>
              {editingExpenseId && (
                <button
                  type="button"
                  onClick={handleCancelEditExpense}
                  className="text-xs text-stone-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <h2 className="text-xl font-black mb-4">
              {editingExpenseId ? 'Update Store Expense Outflow' : 'Record Store Expense Outflow'}
            </h2>

            {expenseSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Expense disbursement successfully recorded and logged to database!</span>
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
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-orange-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingExpenseId ? 'Update Expense Record' : 'Save Expense Record'}</span>
              </button>
            </form>
          </div>

          {/* Recorded Expenses Table with Edit and Delete */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900/80 border-orange-500/20' : 'bg-white/90 border-orange-200'
            } backdrop-blur-xl shadow-lg`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-black">Recorded Expenses Database</h3>
                <p className="text-xs text-stone-400">
                  Individual operating expense entries with edit and delete controls.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 self-start">
                Total Expenses: {expenses.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-500'
                    } uppercase text-[10px] tracking-wider`}
                  >
                    <th className="py-3 px-3 font-bold">Date</th>
                    <th className="py-3 px-3 font-bold">Account</th>
                    <th className="py-3 px-3 font-bold">Description</th>
                    <th className="py-3 px-3 font-bold">Payment Method</th>
                    <th className="py-3 px-3 font-bold text-right">Amount (₱)</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {expenses.map((exp) => {
                    const acc = expenseAccounts.find((a) => a.id === exp.accountId);
                    return (
                      <tr
                        key={exp.id}
                        className={`hover:bg-orange-500/5 transition-colors ${
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-stone-400">{exp.date}</td>
                        <td className="py-3 px-3 font-bold text-stone-100">{acc?.name || 'General Expense'}</td>
                        <td className="py-3 px-3 text-stone-300 max-w-xs truncate">{exp.description || 'Disbursement'}</td>
                        <td className="py-3 px-3 capitalize font-mono text-[11px] text-stone-400">
                          {exp.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-400">
                          -₱{exp.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditExpense(exp)}
                              className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete expense record of ₱${exp.amount.toLocaleString()}?`)) {
                                  deleteExpense(exp.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                        No expense disbursements recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: TRANSACTION HISTORY ================= */}
      {financeTab === 'history' && (
        <div className="space-y-6">
          {/* Sales and Expenses Comparison Line Graph Card */}
          <div
            className={`p-6 rounded-3xl border transition-all ${
              isDark
                ? 'bg-stone-900/80 border-orange-500/20 text-stone-100 shadow-xl'
                : 'bg-white/90 border-orange-200 text-stone-900 shadow-lg'
            } backdrop-blur-xl`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-black tracking-tight">Sales & Expenses Comparison Line Graph</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Multi-series revenue inflows (emerald green) vs operating outflows (rose red) over monthly reporting periods.
              </p>
            </div>
            <SalesExpensesLineGraph data={monthlyComparisonData} isDark={isDark} />
          </div>

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
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
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
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingTransaction({ ...tx })}
                            className="p-1.5 rounded-lg hover:bg-stone-700/60 text-stone-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete transaction "${tx.description}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400 italic">
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

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${
              isDark ? 'bg-stone-900 border-orange-500/30 text-stone-100' : 'bg-white border-orange-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-orange-500/20">
              <h3 className="text-base font-black flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-500" />
                <span>Edit Transaction Record</span>
              </h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTransaction(editingTransaction.id, {
                  date: editingTransaction.date,
                  category: editingTransaction.category,
                  description: editingTransaction.description,
                  paymentMethod: editingTransaction.paymentMethod,
                  inflow: Number(editingTransaction.inflow) || 0,
                  outflow: Number(editingTransaction.outflow) || 0,
                });
                setEditingTransaction(null);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-stone-400 font-semibold mb-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Account / Category</label>
                <input
                  type="text"
                  required
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={editingTransaction.paymentMethod}
                    onChange={(e) =>
                      setEditingTransaction({ ...editingTransaction, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 capitalize ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                    }`}
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    {editingTransaction.type === 'inflow' ? 'Inflow Amount (₱)' : 'Outflow Amount (₱)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTransaction.type === 'inflow' ? editingTransaction.inflow : editingTransaction.outflow}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      if (editingTransaction.type === 'inflow') {
                        setEditingTransaction({ ...editingTransaction, inflow: val });
                      } else {
                        setEditingTransaction({ ...editingTransaction, outflow: val });
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold cursor-pointer shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
