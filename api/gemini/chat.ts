import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, conversationHistory = [], storeContext = {} } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        reply: `👋 Hello! I am your AI Exins assistant. Based on your live store data:
• Total Revenue is ₱${(storeContext.totalSales ?? 0).toLocaleString()} with a Net Operating Profit of ₱${(storeContext.netProfit ?? 0).toLocaleString()}.
• You have ${storeContext.balesCount ?? 0} active inventory bales and ${storeContext.productsCount ?? 0} individual items in catalog.
• Sourced stock is turning over steadily. Tip: Keep tagging fastest moving thrift categories like jackets and graphic tees!

(To enable live Gemini AI generation, add your GEMINI_API_KEY to your Vercel Environment Variables).`,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for (const msg of conversationHistory) {
      if (msg.role && msg.text) {
        await chat.sendMessage({ message: msg.text });
      }
    }

    const response = await chat.sendMessage({ message: prompt });
    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
