import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Send,
  Bot,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const AIExinsWidget: React.FC = () => {
  const { currentUser, isDark, bales, products, categories, transactions } = useStore();

  // Strict check: Only the store owner can access AI Exins
  if (currentUser.role !== 'owner') {
    return (
      <div className="text-center py-20 p-8 rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-xl max-w-lg mx-auto">
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-xs text-stone-400 mt-2">
          Only the Store Owner can access the AI Advisor workspace.
        </p>
      </div>
    );
  }

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `👋 **Hi Frank! I'm your dedicated AI Exins Business Advisor.**

I am continuously analyzing your Novaliches clothing inventory, thrift bale break-even status, daily POS sales, and cash flow behind the scenes.

Ask me anything about:
• Which bales have already hit 100% break-even profit
• Recommended pricing strategies for slow-moving categories
• Current net operating profit & overhead balance
• Predictive restocking suggestions based on EWMA sales`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live store stats behind the scenes for AI context
  const totalSales = transactions.filter((t) => t.type === 'inflow').reduce((sum, t) => sum + t.inflow, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'outflow').reduce((sum, t) => sum + t.outflow, 0);
  const netProfit = totalSales - totalExpenses;
  const remainingAssets = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);

  const balesSummary = bales.map((b) => ({
    code: b.code,
    name: b.name,
    totalPrice: b.totalPrice,
    totalSales: b.totalSales,
    progress: b.totalPrice > 0 ? Math.round((b.totalSales / b.totalPrice) * 100) : 0,
  }));

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query.trim(),
          conversationHistory: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          storeContext: {
            totalSales,
            totalExpenses,
            netProfit,
            remainingAssets,
            balesCount: bales.length,
            productsCount: products.length,
            categories: categories.map((c) => ({ name: c.name, inStock: c.inStock })),
            bales: balesSummary,
          },
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.fallback || 'I could not analyze this request right now.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `💡 **AI Exins Analysis:**
• Current Gross Sales: **₱${totalSales.toLocaleString()}**
• Total Operating Expenses: **₱${totalExpenses.toLocaleString()}**
• Net Operating Profit: **₱${netProfit.toLocaleString()}**
• Inventory Asset Value: **₱${remainingAssets.toLocaleString()}** across ${products.length} tagged products.
• Active Bales: ${bales.length} lots in tracking. Maintain your average markup to secure fast turnover!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Strategic Chat Interface Only */}
      <div
        className={`flex flex-col h-[calc(100vh-210px)] min-h-[580px] max-h-[800px] rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-xl ${
          isDark
            ? 'bg-stone-900/90 border-orange-500/20 text-stone-100 shadow-orange-950/20'
            : 'bg-white/95 border-orange-200 text-stone-900 shadow-stone-300/40'
        }`}
      >
        {/* Strategic Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white flex items-center justify-between select-none shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">AI Exins Strategic Dialogue</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-orange-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                Business intelligence & inventory advisory for EXINS Novaliches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-orange-200">Owner:</span>
              <span className="font-mono font-bold text-white">{currentUser.name || currentUser.email}</span>
            </div>

            <button
              onClick={() => {
                if (confirm('Clear chat history?')) {
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      role: 'assistant',
                      content: `Conversation restarted. What would you like to strategize about your store today?`,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20"
              title="Clear chat conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3.5 leading-relaxed text-xs sm:text-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-xs shadow-md'
                    : isDark
                    ? 'bg-stone-800/90 text-stone-100 border border-stone-700/60 rounded-bl-xs'
                    : 'bg-stone-100 text-stone-800 border border-stone-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
              <span className="text-[10px] text-stone-500 mt-1 px-2">{m.time}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs animate-pulse max-w-md">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
              <span>AI Exins is processing inventory models, transactions & bale margins...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`p-4 sm:p-5 border-t flex items-center gap-3 ${
            isDark ? 'border-orange-500/20 bg-stone-950/40' : 'border-orange-200 bg-stone-50/80'
          }`}
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI Exins about thrift inventory, break-even targets, pricing, forecasting..."
            className={`flex-1 px-4 sm:px-5 py-3.5 text-xs sm:text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
              isDark
                ? 'border-stone-700 bg-stone-800/80 text-white placeholder-stone-400'
                : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
            }`}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer shadow-lg shadow-orange-900/30"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
