import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with telemetry user agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route for Gemini AI Business Insight
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, conversationHistory = [], storeContext = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction = `You are "Hi Im your AI Exins", an intelligent, friendly, and practical business advisor for "EXINS Jksur+ Novaliches Quezon City" (tagline: "Your Next Favorite Outfit is Hiding Here").
EXINS is a clothing and surplus inventory store specializing in imported thrift/apparel bales, shoes, jackets, caps, streetwear, and retail items.
You help the store owner and staff analyze:
- Bale break-even progress (total purchase cost vs sales made, profit after reaching break-even)
- Inventory status, low stock warnings, dead stock, and category balance
- Sales trends and EWMA (Exponentially Weighted Moving Average) forecasting insights
- Expense monitoring and budget allocations
- Top spending customer patterns and order fulfillment

Here is the current live store context:
- Total Sales: ₱${storeContext.totalSales ?? 0}
- Total Expenses: ₱${storeContext.totalExpenses ?? 0}
- Net Profit: ₱${storeContext.netProfit ?? 0}
- Remaining Inventory Asset Value: ₱${storeContext.remainingAssets ?? 0}
- Active Bales count: ${storeContext.balesCount ?? 0}
- Active Products count: ${storeContext.productsCount ?? 0}
- Categories: ${(storeContext.categories || []).map((c: any) => `${c.name} (${c.inStock || 0} in stock)`).join(', ')}
- Bale highlights: ${(storeContext.bales || []).map((b: any) => `${b.code} (${b.name}): Cost ₱${b.totalPrice}, Sales ₱${b.totalSales}, Break-even ${b.progress}%`).slice(0, 5).join('; ')}

Format your response cleanly using bullet points, bold key figures in Philippine Peso (₱), and provide actionable, practical thrift/retail tips for Quezon City business operations. Keep it concise, helpful, and encouraging.`;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback response if API key is not configured in local environment
      return res.json({
        reply: `👋 Hello! I am your AI Exins assistant. Based on your live store data:
• Total Revenue is ₱${(storeContext.totalSales ?? 0).toLocaleString()} with a Net Operating Profit of ₱${(storeContext.netProfit ?? 0).toLocaleString()}.
• Your inventory has ${storeContext.productsCount ?? 0} listed products with total asset value of ₱${(storeContext.remainingAssets ?? 0).toLocaleString()}.
• Recommendation: Focus on replenishing high-demand categories and monitor bale break-even percentages to maintain healthy cash flow!`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Store History:\n${conversationHistory
                .map((msg: any) => `${msg.role}: ${msg.content}`)
                .join('\n')}\n\nUser Question: ${prompt}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I could not generate an analysis at this moment. Please try again.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: error.message || 'Error generating AI response',
      fallback: 'AI Exins is momentarily busy. Please try asking again shortly.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', store: 'EXINS Jksur+ Novaliches Quezon City' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`EXINS server running on http://0.0.0.0:${port}`);
  });
}

startServer();
