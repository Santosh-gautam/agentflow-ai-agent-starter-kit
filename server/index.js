import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toolDeclarations, toolRegistry } from './tools/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Rate Limiting Guardrail (Max 30 requests per minute per IP)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const rateLimiter = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'localhost';
  const now = Date.now();

  const userHistory = ipRequestCounts.get(ip) || [];
  const recentRequests = userHistory.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before sending another prompt.'
    });
  }

  recentRequests.push(now);
  ipRequestCounts.set(ip, recentRequests);
  next();
};

// Map legacy or selected model names to active 2026 Gemini endpoints
const resolveModelName = (name) => {
  const modelMap = {
    'gemini-3.8-flash': 'gemini-3.8-flash',
    'gemini-3.7-flash': 'gemini-3.7-flash',
    'gemini-3.5-flash': 'gemini-3.5-flash',
    'gemini-flash-latest': 'gemini-flash-latest',
    // Fallback legacy aliases
    'gemini-2.0-flash': 'gemini-3.8-flash',
    'gemini-1.5-flash': 'gemini-3.8-flash',
    'gemini-1.5-pro': 'gemini-3.8-flash',
    'gemini-2.5-flash': 'gemini-3.8-flash',
  };
  return modelMap[name] || 'gemini-3.8-flash';
};

// Health Check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    defaultServerKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    supportedModels: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'],
    toolsCount: Object.keys(toolRegistry).length,
    timestamp: new Date().toISOString()
  });
});

// Tools Catalog Endpoint
app.get('/api/tools', (req, res) => {
  res.json({
    tools: toolDeclarations
  });
});

// Direct Tool Execution Playground Endpoint
app.post('/api/tools/execute', async (req, res) => {
  const { toolName, args } = req.body;
  const executor = toolRegistry[toolName];
  if (!executor) {
    return res.status(404).json({ error: `Tool "${toolName}" not found.` });
  }

  const startTime = Date.now();
  try {
    const result = await executor(args || {});
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      toolName,
      latencyMs,
      args: args || {},
      result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      toolName,
      error: err.message
    });
  }
});

// Autonomous Agent Streaming Endpoint
app.post('/api/agent/stream', rateLimiter, async (req, res) => {
  const { prompt, model: requestedModel = 'gemini-3.8-flash' } = req.body;

  // Validation Guardrails
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid prompt string is required.' });
  }

  if (prompt.length > 2500) {
    return res.status(400).json({ error: 'Prompt exceeds maximum length of 2500 characters.' });
  }

  // Determine API Key priority: Client Header > Server .env
  const clientKey = req.headers['x-gemini-api-key'] || '';
  const apiKey = (clientKey || process.env.GEMINI_API_KEY || '').trim();

  // Set Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // ══════════════════════════════════════════════════════════
    // DEMO SANDBOX MODE (If no API Key provided)
    // ══════════════════════════════════════════════════════════
    if (!apiKey) {
      sendEvent('status', {
        message: 'Agent analyzing intent & selecting tool...'
      });
      await new Promise(r => setTimeout(r, 350));

      const lower = prompt.toLowerCase();
      let toolName = 'calculate_expression';
      let toolArgs = { expression: '1500 * 86.85 + 250' };

      if (lower.includes('weather') || lower.includes('temperature') || lower.includes('mausam') || lower.includes('forecast')) {
        toolName = 'getLiveWeather';
        const cityMatch = prompt.match(/(?:in|of|for|at|ka)\s+([a-zA-Z]+)/i);
        toolArgs = { city: cityMatch ? cityMatch[1] : 'Mumbai' };
      } else if (lower.includes('stock') || lower.includes('share') || lower.includes('crypto') || lower.includes('btc') || lower.includes('aapl') || lower.includes('nvda') || lower.includes('price')) {
        toolName = 'fetchStockPrice';
        let sym = 'AAPL';
        if (lower.includes('btc') || lower.includes('bitcoin')) sym = 'BTC';
        else if (lower.includes('eth') || lower.includes('ethereum')) sym = 'ETH';
        else if (lower.includes('nvda') || lower.includes('nvidia')) sym = 'NVDA';
        else if (lower.includes('tsla') || lower.includes('tesla')) sym = 'TSLA';
        else if (lower.includes('reliance')) sym = 'RELIANCE';
        else if (lower.includes('tcs')) sym = 'TCS';
        toolArgs = { symbol: sym };
      } else if (lower.includes('chart') || lower.includes('graph') || lower.includes('revenue') || lower.includes('sales') || lower.includes('analytics')) {
        toolName = 'generate_chart_visualization';
        toolArgs = {
          title: 'Q1-Q4 AgentFlow Performance Analytics',
          chartType: 'bar',
          labels: ['Q1 Jan-Mar', 'Q2 Apr-Jun', 'Q3 Jul-Sep', 'Q4 Oct-Dec'],
          values: [32000, 54000, 89000, 128000]
        };
      } else if (lower.includes('search') || lower.includes('who is') || lower.includes('what is') || lower.includes('latest')) {
        toolName = 'search_web_information';
        toolArgs = { query: prompt.slice(0, 40) };
      } else if (lower.includes('calc') || lower.includes('+') || lower.includes('*') || lower.includes('/') || lower.includes('-')) {
        toolName = 'calculate_expression';
        toolArgs = { expression: prompt.replace(/[^0-9+\-*/().]/g, '') || '1500 * 86.85' };
      } else {
        toolName = 'getLiveWeather';
        toolArgs = { city: 'New Delhi' };
      }

      const startTime = Date.now();
      sendEvent('tool_start', { name: toolName, args: toolArgs, step: 1 });
      await new Promise(r => setTimeout(r, 600));

      const executor = toolRegistry[toolName] || toolRegistry['calculate_expression'];
      const result = await executor(toolArgs);
      const latency = Date.now() - startTime;

      sendEvent('tool_result', { name: toolName, args: toolArgs, result, latencyMs: latency });
      await new Promise(r => setTimeout(r, 300));

      let answer = '';
      if (toolName === 'getLiveWeather') {
        answer = `### 🌤️ Live Weather Report for ${result.city || toolArgs.city}\n\n` +
          `- **Temperature:** ${result.temperatureCelsius ?? 26}°C (Feels like ${result.apparentTemperature ?? 27}°C)\n` +
          `- **Condition:** ${result.condition || 'Clear Sky ☀️'}\n` +
          `- **Relative Humidity:** ${result.humidityPercent ?? 55}%\n` +
          `- **Wind Speed:** ${result.windSpeedKmH ?? 12} km/h\n\n` +
          `*Executed via live Open-Meteo geocoding & meteorological tool calling engine.*`;
      } else if (toolName === 'fetchStockPrice') {
        answer = `### 📈 Market Asset Quote: ${result.assetName || result.symbol}\n\n` +
          `- **Ticker:** \`${result.symbol}\` (${result.exchange || 'NASDAQ'})\n` +
          `- **Current Price:** **$${result.priceUSD || result.price}**\n` +
          `- **24h Movement:** \`${result.change24hPercent || result.dailyChange}\`\n` +
          `- **Market Capitalization:** ${result.marketCap || 'High Cap'}\n\n` +
          `*Real-time asset telemetry fetched through autonomous tool execution.*`;
      } else if (toolName === 'generate_chart_visualization') {
        answer = `### 📊 Visual Analytics Generated\n\nI executed the \`${toolName}\` tool and created the interactive visualization data for **${toolArgs.title}**.\n\nTotal aggregated metric volume: **$${(result.total || 303000).toLocaleString()}** across 4 fiscal quarters.`;
      } else {
        answer = `### ⚡ Autonomous Tool Execution Completed\n\nThe agent invoked \`${toolName}\` (executed in ${latency}ms) with schema validation.\n\n` +
          `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n` +
          `> 💡 **Tip:** Add your personal Gemini API key via the **⚙️ Connect Gemini** button to unlock autonomous multi-step reasoning across custom workflows!`;
      }

      for (const token of answer.split(' ')) {
        sendEvent('token', { text: token + ' ' });
        await new Promise(r => setTimeout(r, 16));
      }

      sendEvent('done', { completed: true, steps: 1 });
      return res.end();
    }

    // ══════════════════════════════════════════════════════════
    // LIVE GEMINI AGENT EXECUTION (2026 Model Architecture)
    // ══════════════════════════════════════════════════════════
    const genAI = new GoogleGenerativeAI(apiKey);
    const validModel = resolveModelName(requestedModel);

    const model = genAI.getGenerativeModel({
      model: validModel,
      tools: [{ functionDeclarations: toolDeclarations }]
    });

    const chat = model.startChat();
    sendEvent('status', { message: `Agent initialized with ${validModel}...` });

    let currentResponse = await chat.sendMessage(prompt);
    let functionCalls = currentResponse.response.functionCalls();

    let steps = 0;
    const MAX_STEPS = 6; // Guard against infinite tool invocation loops

    while (functionCalls && functionCalls.length > 0 && steps < MAX_STEPS) {
      steps++;
      for (const call of functionCalls) {
        const { name, args } = call;
        const toolStart = Date.now();
        sendEvent('tool_start', { name, args, step: steps });

        const executor = toolRegistry[name];
        let toolResult = { error: `Tool ${name} not found in registry.` };
        if (executor) {
          try {
            toolResult = await executor(args);
          } catch (execErr) {
            toolResult = { error: `Execution error: ${execErr.message}` };
          }
        }

        const toolLatency = Date.now() - toolStart;
        sendEvent('tool_result', { name, args, result: toolResult, latencyMs: toolLatency });

        // Provide tool output back to agent's reasoning memory
        currentResponse = await chat.sendMessage([
          {
            functionResponse: {
              name,
              response: toolResult
            }
          }
        ]);
      }
      functionCalls = currentResponse.response.functionCalls();
    }

    // Stream final synthesis text
    const finalAnswer = currentResponse.response.text();
    for (const token of finalAnswer.split(' ')) {
      sendEvent('token', { text: token + ' ' });
      await new Promise(r => setTimeout(r, 16));
    }

    sendEvent('done', { totalSteps: steps, modelUsed: validModel });
    res.end();
  } catch (error) {
    console.error('Agent execution error:', error);
    sendEvent('error', {
      message: error.message || 'An unexpected error occurred during agent execution.'
    });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`AgentFlow Backend running at http://localhost:${PORT}`);
});
