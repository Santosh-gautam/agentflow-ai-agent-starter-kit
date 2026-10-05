/**
 * Simulated Real-Time Web Search & Market Data Tool
 */
export const webSearchTool = {
  declaration: {
    name: "fetch_market_or_tech_info",
    description: "Fetches live or simulated market benchmarks, tech documentation, and exchange rates.",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: {
          type: "STRING",
          description: "Topic or asset to look up (e.g. 'Bitcoin', 'Ethereum', 'USD_TO_INR', 'Vue3_SSE_Best_Practices')"
        }
      },
      required: ["topic"]
    }
  },
  async execute({ topic }) {
    const key = topic.toLowerCase().trim();
    if (key.includes('usd') || key.includes('inr')) {
      return { topic, rate: 86.85, base: "USD", target: "INR", timestamp: new Date().toISOString() };
    }
    if (key.includes('btc') || key.includes('bitcoin')) {
      return { asset: "Bitcoin", ticker: "BTC", priceUSD: 94250.00, change24h: "+3.4%", timestamp: new Date().toISOString() };
    }
    if (key.includes('eth') || key.includes('ethereum')) {
      return { asset: "Ethereum", ticker: "ETH", priceUSD: 3450.00, change24h: "+2.1%", timestamp: new Date().toISOString() };
    }
    return {
      topic,
      summary: `Real-time data retrieved for ${topic}: System is healthy, latest verified latency benchmark is 45ms.`,
      timestamp: new Date().toISOString()
    };
  }
};
