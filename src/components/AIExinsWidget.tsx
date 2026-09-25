import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, X, Send, Bot, Minimize2, Maximize2, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const AIExinsWidget: React.FC = () => {
  const { isDark, bales, products, categories, transactions, expenseAccounts, expenses } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `👋 **Hi! I'm your AI Exins.**
I monitor your Novaliches clothing inventory, bale break-even progress, expenses, and sales trends. How can I help your business today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Live store stats to feed into context
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
        content: `💡 **AI Exins Insight:**
• Your current Total Sales is **₱${totalSales.toLocaleString()}** and Total Expenses are **₱${totalExpenses.toLocaleString()}**.
• Net Profit stands at **₱${netProfit.toLocaleString()}**.
• You have ${products.length} listed product types with **₱${remainingAssets.toLocaleString()}** in inventory stock.
• Keep maintaining optimal pricing to reach full break-even on all active thrift bales!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Analyze my bale break-even status',
    'Which category has low inventory stock?',
    'How is our Net Operating Profit this month?',
    'What pricing strategy do you recommend for surplus?',
  ];

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] no-print select-none font-sans"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
    >
      {/* Floating launcher button if closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-white rounded-full shadow-2xl border-2 border-orange-300/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </div>
          <div className="text-left">
            <span className="block text-xs font-black tracking-wide uppercase">Hi, I'm your AI Exins</span>
            <span className="block text-[10px] text-orange-100 font-medium">Click to chat & advice</span>
          </div>
        </button>
      )}

      {/* Floating AI Window */}
      {isOpen && (
        <div
          className={`w-[360px] sm:w-[410px] flex flex-col rounded-2xl shadow-2xl border transition-all duration-200 overflow-hidden ${
            isDark
              ? 'bg-stone-900/95 border-orange-500/30 text-stone-100 shadow-orange-950/40'
              : 'bg-white/95 border-orange-200 text-stone-900 shadow-stone-400/40'
          } backdrop-blur-xl ${isMinimized ? 'h-14' : 'h-[540px]'}`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-700 text-white select-none"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">Hi, I'm your AI Exins</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[10px] text-orange-100">Live Business Intelligence</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-orange-100"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-orange-100"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-orange-600 text-white rounded-br-none'
                          : isDark
                          ? 'bg-stone-800/90 text-stone-200 border border-orange-500/20 rounded-bl-none'
                          : 'bg-stone-100 text-stone-800 border border-stone-200 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    <span className="text-[9px] text-stone-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-stone-400 text-xs italic p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>AI Exins is analyzing store data...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions */}
              <div className="p-2 border-t border-orange-500/10 bg-black/10">
                <div className="flex items-center gap-1 text-[10px] text-orange-400 font-semibold mb-1.5 px-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Suggested queries:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="px-2 py-1 text-[10px] rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 truncate max-w-full text-left transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div
                className={`p-3 border-t ${
                  isDark ? 'border-orange-500/20 bg-stone-900' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask AI Exins about inventory, expenses..."
                    className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || loading}
                    className="p-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
