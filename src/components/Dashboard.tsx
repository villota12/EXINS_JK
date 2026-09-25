import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Calendar,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { SalesExpensesLineGraph } from './SalesExpensesLineGraph';

type DatePreset = 'all' | 'today' | '7days' | '30days' | 'month' | 'custom';

export const Dashboard: React.FC = () => {
  const { isDark, orders, transactions, products, bales, setActiveTab } = useStore();

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter transactions and orders by selected date range
  const filteredData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let start = '';
    let end = todayStr;

    if (datePreset === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (datePreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (datePreset === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = d.toISOString().split('T')[0];
    } else if (datePreset === 'custom') {
      start = startDate;
      end = endDate || todayStr;
    }

    const txs = transactions.filter((t) => {
      if (!start) return true;
      return t.date >= start && t.date <= end;
    });

    const ords = orders.filter((o) => {
      if (!start) return true;
      return o.orderDate >= start && o.orderDate <= end;
    });

    return { txs, ords, start, end };
  }, [datePreset, startDate, endDate, transactions, orders]);

  // Calculate 6 KPIs
  // 1. New Orders
  const newOrdersCount = filteredData.ords.length;

  // 2. Total Sales (inflows)
  const totalSales = filteredData.txs
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + t.inflow, 0);

  // 3. Total Expenses (outflows)
  const totalExpenses = filteredData.txs
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + t.outflow, 0);

  // 4. Gross Profit (Sales - estimated COGS based on approx 35% cost margin)
  const estimatedCogs = totalSales * 0.35;
  const grossProfit = totalSales - estimatedCogs;

  // 5. Net Profit (Sales - Expenses)
  const netProfit = totalSales - totalExpenses;

  // 6. Remaining Assets (Inventory valuation: available stock * cost price + sealed bales purchase price)
  const stockAssetValue = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
  const sealedBalesAssetValue = bales
    .filter((b) => b.status === 'sealed')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const remainingAssets = stockAssetValue + sealedBalesAssetValue;

  // Comparison metrics
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';
  const expenseRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : '0.0';

  // Monthly Sales & Expenses Comparison Data (Calculated per month with direct visible amounts)
  const monthlyComparisonData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May 2026', short: 'May' },
      { key: '2026-06', label: 'Jun 2026', short: 'Jun' },
      { key: '2026-07', label: 'Jul 2026', short: 'Jul' },
      { key: '2026-08', label: 'Aug 2026', short: 'Aug' },
      { key: '2026-09', label: 'Sep 2026', short: 'Sep' },
    ];

    // Seed baseline surplus store monthly figures
    const monthMap: Record<string, { sales: number; expense: number }> = {
      '2026-05': { sales: 68400, expense: 31200 },
      '2026-06': { sales: 79200, expense: 36400 },
      '2026-07': { sales: 88500, expense: 41800 },
      '2026-08': { sales: 94800, expense: 43500 },
      '2026-09': { sales: 0, expense: 0 },
    };

    // Aggregate live transactions for current active periods
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
      {/* Dashboard Top Header & Date Presets */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDark
            ? 'bg-stone-900/80 border-orange-500/20 text-stone-100 shadow-xl'
            : 'bg-white/90 border-orange-200 text-stone-900 shadow-lg'
        } backdrop-blur-xl`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>EXINS Business Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Executive Dashboard</h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Live KPI monitor, revenue streams, bale break-even analytics, and asset valuation.
            </p>
          </div>

          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-stone-800/40 p-1 rounded-2xl border border-orange-500/20">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id as DatePreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    datePreset === p.id
                      ? 'bg-orange-600 text-white shadow-md'
                      : isDark
                      ? 'text-stone-300 hover:text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 bg-stone-800/50 p-1.5 rounded-2xl border border-orange-500/20 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-stone-900 text-stone-100 rounded-lg border border-stone-700 text-xs focus:outline-none"
                />
                <span className="text-stone-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-stone-900 text-stone-100 rounded-lg border border-stone-700 text-xs focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6 Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. New Orders */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark ? 'bg-stone-900/70 border-orange-500/20' : 'bg-white/80 border-orange-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">New Orders</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-100 tracking-tight">{newOrdersCount}</span>
            <span className="text-xs font-semibold text-orange-400">orders logged</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Showcase shop online customer orders</span>
          </p>
        </div>

        {/* 2. Total Sales */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark ? 'bg-stone-900/70 border-emerald-500/20' : 'bg-white/80 border-emerald-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              ₱{totalSales.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inflows from POS storefront & online shop</span>
          </p>
        </div>

        {/* 3. Total Expenses */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark ? 'bg-stone-900/70 border-rose-500/20' : 'bg-white/80 border-rose-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 tracking-tight">
              ₱{totalExpenses.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Rent, utilities, wages, freight & polymailers</span>
          </p>
        </div>

        {/* 4. Gross Profit */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark ? 'bg-stone-900/70 border-amber-500/20' : 'bg-white/80 border-amber-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Gross Profit</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 tracking-tight">
              ₱{grossProfit.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Revenue minus cost of goods sold (COGS)</span>
          </p>
        </div>

        {/* 5. Net Profit */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark
              ? netProfit >= 0
                ? 'bg-stone-900/70 border-emerald-500/30'
                : 'bg-stone-900/70 border-rose-500/30'
              : 'bg-white/80 border-orange-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Net Profit</span>
            <div
              className={`p-2.5 rounded-xl border ${
                netProfit >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ₱{netProfit.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
              {profitMargin}% margin
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Inflow revenue minus total operating expenses
          </p>
        </div>

        {/* 6. Remaining Assets */}
        <div
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
            isDark ? 'bg-stone-900/70 border-orange-500/20' : 'bg-white/80 border-orange-200 shadow-sm'
          } backdrop-blur-xl relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Remaining Assets</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-orange-400 tracking-tight">
              ₱{remainingAssets.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>Valuation of {products.length} products & sealed bales</span>
          </p>
        </div>
      </div>

      {/* Monthly Sales and Expense Comparison Section */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDark
            ? 'bg-stone-900/80 border-orange-500/20 text-stone-100 shadow-xl'
            : 'bg-white/90 border-orange-200 text-stone-900 shadow-lg'
        } backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Sales and Expenses Comparison Line Graph
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Multi-series continuous line comparison comparing store revenue inflows against operating expense outflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Graph Visualizer */}
        <div className="space-y-6">
          <SalesExpensesLineGraph data={monthlyComparisonData} isDark={isDark} />

          {/* Monthly Comparison Detailed Table (Clear, readable, student-friendly) */}
          <div className="rounded-2xl border border-stone-800/60 overflow-hidden bg-stone-950/30">
            <div className="px-4 py-3 bg-stone-800/40 border-b border-stone-800/60 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Monthly Performance Breakdown Summary
              </h3>
              <span className="text-[11px] text-stone-400">Values in Philippine Peso (₱)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800/60 text-stone-400 font-semibold bg-stone-900/40">
                    <th className="py-2.5 px-4">Period / Month</th>
                    <th className="py-2.5 px-4 text-right">Sales Inflow</th>
                    <th className="py-2.5 px-4 text-right">Expense Outflow</th>
                    <th className="py-2.5 px-4 text-right">Net Operating Profit</th>
                    <th className="py-2.5 px-4 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/40">
                  {monthlyComparisonData.map((item) => {
                    const margin =
                      item.sales > 0 ? ((item.net / item.sales) * 100).toFixed(1) : '0.0';
                    const isCurrent = item.key === '2026-09';

                    return (
                      <tr
                        key={item.key}
                        className={`transition-colors ${
                          isCurrent ? 'bg-orange-500/10 font-medium' : 'hover:bg-stone-800/20'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-stone-200 flex items-center gap-2">
                          <span>{item.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">
                              Current Month
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                          ₱{item.sales.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400 font-mono">
                          ₱{item.expense.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black font-mono ${
                            item.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.net >= 0 ? '+' : ''}₱{item.net.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-stone-300">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
