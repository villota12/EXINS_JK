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
                  Monthly Sales and Expenses Comparison
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Direct side-by-side comparison of monthly sales inflows and operating expense outflows.
                </p>
              </div>
            </div>
          </div>

          {/* Direct Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold px-3 py-2 rounded-xl bg-stone-800/40 border border-stone-700/40">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
              <span className="text-stone-300">Sales Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/20"></span>
              <span className="text-stone-300">Expense Outflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
              <span className="text-stone-300">Net Profit</span>
            </div>
          </div>
        </div>

        {/* Monthly Comparison Bar Chart (All amounts permanently visible - no hover required) */}
        <div className="space-y-6">
          <div className="relative pt-8 pb-3 px-3 rounded-2xl bg-stone-950/40 border border-stone-800/60 overflow-x-auto">
            {(() => {
              const maxVal = Math.max(
                ...monthlyComparisonData.map((d) => Math.max(d.sales, d.expense)),
                10000
              );

              return (
                <div className="min-w-[620px]">
                  {/* Grid Lines & Y-Axis Labels */}
                  <div className="relative h-72 flex flex-col justify-between pb-12 border-b border-stone-800/80">
                    {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
                      <div key={i} className="flex items-center gap-2 w-full">
                        <span className="w-20 text-[11px] text-stone-400 text-right font-mono font-medium">
                          ₱{Math.round(maxVal * ratio).toLocaleString()}
                        </span>
                        <div className="flex-1 h-px bg-stone-800/60 border-t border-dashed border-stone-700/40" />
                      </div>
                    ))}

                    {/* Side-by-Side Monthly Columns with permanently printed amounts */}
                    <div className="absolute inset-x-0 bottom-12 top-2 left-20 flex items-end justify-around px-4">
                      {monthlyComparisonData.map((item) => {
                        const salesH = Math.max(6, (item.sales / maxVal) * 100);
                        const expH = Math.max(6, (item.expense / maxVal) * 100);
                        const isCurrentMonth = item.key === '2026-09';

                        return (
                          <div
                            key={item.key}
                            className="flex flex-col items-center h-full justify-end flex-1 max-w-[110px]"
                          >
                            {/* Pair of Bars: Sales & Expenses */}
                            <div className="flex items-end gap-2.5 w-full justify-center h-full pb-1">
                              {/* Sales Bar */}
                              <div className="flex flex-col items-center flex-1 max-w-[34px] h-full justify-end">
                                <span className="text-[10px] font-bold text-emerald-400 font-mono mb-1 text-center whitespace-nowrap">
                                  ₱{item.sales >= 1000 ? `${(item.sales / 1000).toFixed(1)}k` : item.sales}
                                </span>
                                <div
                                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg shadow-md shadow-emerald-950/40"
                                  style={{ height: `${salesH}%` }}
                                />
                              </div>

                              {/* Expense Bar */}
                              <div className="flex flex-col items-center flex-1 max-w-[34px] h-full justify-end">
                                <span className="text-[10px] font-bold text-rose-400 font-mono mb-1 text-center whitespace-nowrap">
                                  ₱{item.expense >= 1000 ? `${(item.expense / 1000).toFixed(1)}k` : item.expense}
                                </span>
                                <div
                                  className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-lg shadow-md shadow-rose-950/40"
                                  style={{ height: `${expH}%` }}
                                />
                              </div>
                            </div>

                            {/* Bottom Label: Month name & Net flow badge */}
                            <div className="text-center mt-2.5 flex flex-col items-center gap-1">
                              <span className="text-xs font-bold text-stone-200 flex items-center gap-1">
                                <span>{item.short}</span>
                                {isCurrentMonth && (
                                  <span className="text-[9px] px-1 py-0.2 bg-orange-600/30 text-orange-400 border border-orange-500/40 rounded font-semibold">
                                    Now
                                  </span>
                                )}
                              </span>

                              <span
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  item.net >= 0
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                                }`}
                              >
                                {item.net >= 0 ? '+' : ''}₱
                                {Math.abs(item.net) >= 1000
                                  ? `${(item.net / 1000).toFixed(1)}k`
                                  : item.net.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

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
