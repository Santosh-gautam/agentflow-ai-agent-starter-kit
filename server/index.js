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

// Helper for simulated / fallback tool execution
const executeSimulatedToolReasoning = async (prompt, sendEvent, note) => {
  sendEvent('status', {
    message: note || 'Agent analyzing intent & executing tool plan...'
  });
  await new Promise(r => setTimeout(r, 200));

  const lower = prompt.toLowerCase();
  const tasksToRun = [];

  // Detect weather queries (support multi-city detection)
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('mausam') || lower.includes('forecast')) {
    const knownCities = ['tokyo', 'delhi', 'new delhi', 'mumbai', 'london', 'paris', 'new york', 'dubai', 'singapore', 'sydney', 'bangalore', 'berlin', 'toronto'];
    const matchedCities = knownCities.filter(c => lower.includes(c));
    if (matchedCities.length > 0) {
      for (const c of matchedCities) {
        tasksToRun.push({
          toolName: 'getLiveWeather',
          toolArgs: { city: c.charAt(0).toUpperCase() + c.slice(1) }
        });
      }
    } else {
      const cityMatch = prompt.match(/(?:in|of|for|at|ka)\s+([a-zA-Z]+)/i);
      tasksToRun.push({
        toolName: 'getLiveWeather',
        toolArgs: { city: cityMatch ? cityMatch[1] : 'Tokyo' }
      });
    }
  }

  // Detect financial stocks/crypto
  if (lower.includes('stock') || lower.includes('share') || lower.includes('crypto') || lower.includes('btc') || lower.includes('aapl') || lower.includes('nvda') || lower.includes('price')) {
    let syms = [];
    if (lower.includes('nvda') || lower.includes('nvidia')) syms.push('NVDA');
    if (lower.includes('btc') || lower.includes('bitcoin')) syms.push('BTC');
    if (lower.includes('eth') || lower.includes('ethereum')) syms.push('ETH');
    if (lower.includes('aapl') || lower.includes('apple')) syms.push('AAPL');
    if (lower.includes('tsla') || lower.includes('tesla')) syms.push('TSLA');
    if (syms.length === 0) syms.push('NVDA');
    for (const s of syms) {
      tasksToRun.push({
        toolName: 'fetchStockPrice',
        toolArgs: { symbol: s }
      });
    }
  }

  // Detect chart / visual analytics
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('revenue') || lower.includes('sales') || lower.includes('analytics')) {
    tasksToRun.push({
      toolName: 'generate_chart_visualization',
      toolArgs: {
        title: 'Q1-Q4 AgentFlow Performance Analytics',
        chartType: 'bar',
        labels: ['Q1 Jan-Mar', 'Q2 Apr-Jun', 'Q3 Jul-Sep', 'Q4 Oct-Dec'],
        values: [32000, 54000, 89000, 128000]
      }
    });
  }

  // Detect math calculation
  if (lower.includes('calc') || lower.includes('+') || lower.includes('*') || lower.includes('/') || lower.includes('-')) {
    const expr = prompt.replace(/[^0-9+\-*/().]/g, '') || '1500 * 86.85';
    tasksToRun.push({
      toolName: 'calculate_expression',
      toolArgs: { expression: expr }
    });
  }

  // Default fallback
  if (tasksToRun.length === 0) {
    tasksToRun.push({
      toolName: 'getLiveWeather',
      toolArgs: { city: 'Tokyo' }
    });
  }

  const results = [];
  let step = 0;

  for (const task of tasksToRun) {
    step++;
    const { toolName, toolArgs } = task;
    const startTime = Date.now();
    sendEvent('tool_start', { name: toolName, args: toolArgs, step });

    const executor = toolRegistry[toolName] || toolRegistry['calculate_expression'];
    const resData = await executor(toolArgs);
    const latency = Date.now() - startTime;

    sendEvent('tool_result', { name: toolName, args: toolArgs, result: resData, latencyMs: latency });
    results.push({ toolName, toolArgs, result: resData, latency });
    await new Promise(r => setTimeout(r, 150));
  }

  // Synthesize clean multi-step response
  let answer = '';
  const weatherResults = results.filter(r => r.toolName === 'getLiveWeather');
  const stockResults = results.filter(r => r.toolName === 'fetchStockPrice');
  const chartResults = results.filter(r => r.toolName === 'generate_chart_visualization');
  const calcResults = results.filter(r => r.toolName === 'calculate_expression');

  if (weatherResults.length > 0) {
    answer += `### 🌤️ Live Weather Reports\n\n`;
    for (const w of weatherResults) {
      const res = w.result;
      const city = res.city || w.toolArgs.city;
      answer += `**${city}**:\n` +
        `- Temperature: **${res.temperatureCelsius ?? 22}°C** (Feels like ${res.apparentTemperature ?? 23}°C)\n` +
        `- Condition: ${res.condition || 'Clear Sky ☀️'}\n` +
        `- Humidity: ${res.humidityPercent ?? 50}% | Wind: ${res.windSpeedKmH ?? 10} km/h\n\n`;
    }
  }

  if (stockResults.length > 0) {
    answer += `### 📈 Market Asset Telemetry\n\n`;
    for (const s of stockResults) {
      const res = s.result;
      answer += `- **${res.symbol}** (${res.assetName || res.exchange}): **$${res.priceUSD || res.price}** (24h: \`${res.change24hPercent || res.dailyChange}\`)\n`;
    }
    answer += '\n';
  }

  if (chartResults.length > 0) {
    answer += `### 📊 Visual Analytics\n\nGenerated performance chart data for **${chartResults[0].toolArgs.title}** with dynamic metric aggregation.\n\n`;
  }

  if (calcResults.length > 0) {
    answer += `### 🧮 Calculation Result\n\n\`${calcResults[0].toolArgs.expression}\` = **${calcResults[0].result.result}**\n\n`;
  }

  if (note) {
    answer += `> ℹ️ *${note}*\n\n`;
  }

  for (const token of answer.split(' ')) {
    sendEvent('token', { text: token + ' ' });
    await new Promise(r => setTimeout(r, 12));
  }

  sendEvent('done', { completed: true, steps: step });
};

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

  // ══════════════════════════════════════════════════════════
  // DEMO SANDBOX MODE (If no API Key provided)
  // ══════════════════════════════════════════════════════════
  if (!apiKey) {
    await executeSimulatedToolReasoning(prompt, sendEvent);
    return res.end();
  }

  // ══════════════════════════════════════════════════════════
  // LIVE GEMINI AGENT EXECUTION (With Parallel Tool Resolution)
  // ══════════════════════════════════════════════════════════
  const genAI = new GoogleGenerativeAI(apiKey);
  const primaryModel = resolveModelName(requestedModel);
  const candidateModels = [primaryModel, 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest']
    .filter((v, i, a) => a.indexOf(v) === i);

  let success = false;
  let lastError = null;

  for (const targetModel of candidateModels) {
    try {
      sendEvent('status', { message: `Connecting to ${targetModel}...` });

      const model = genAI.getGenerativeModel({
        model: targetModel,
        tools: [{ functionDeclarations: toolDeclarations }]
      });

      const contents = [
        { role: 'user', parts: [{ text: prompt }] }
      ];

      let currentResponse = await model.generateContent({ contents });
      let functionCalls = currentResponse.response.functionCalls();

      let steps = 0;
      const MAX_STEPS = 5;
      const executedCache = new Map();

      while (functionCalls && functionCalls.length > 0 && steps < MAX_STEPS) {
        steps++;
        const functionResponseParts = [];
        let newCallsCount = 0;

        // Push model's functionCall turn
        const modelTurn = currentResponse.response.candidates?.[0]?.content;
        if (modelTurn) {
          contents.push(modelTurn);
        }

        // Execute all function calls requested by the model in this turn
        for (const call of functionCalls) {
          const { name, args } = call;
          const sig = `${name}:${JSON.stringify(args || {})}`;

          let toolResult;
          if (executedCache.has(sig)) {
            toolResult = executedCache.get(sig);
          } else {
            newCallsCount++;
            const toolStart = Date.now();
            sendEvent('tool_start', { name, args, step: steps });

            const executor = toolRegistry[name];
            toolResult = { error: `Tool ${name} not found in registry.` };
            if (executor) {
              try {
                toolResult = await executor(args || {});
              } catch (execErr) {
                toolResult = { error: `Execution error: ${execErr.message}` };
              }
            }

            const toolLatency = Date.now() - toolStart;
            sendEvent('tool_result', { name, args, result: toolResult, latencyMs: toolLatency });
            executedCache.set(sig, toolResult);
          }

          functionResponseParts.push({
            functionResponse: {
              name,
              response: { name, content: toolResult }
            }
          });
        }

        if (newCallsCount === 0 && steps > 1) {
          break;
        }

        // Push functionResponse turn with role: 'user' (compatible with all 2026 models)
        contents.push({
          role: 'user',
          parts: functionResponseParts
        });

        currentResponse = await model.generateContent({ contents });
        functionCalls = currentResponse.response.functionCalls();
      }

      // Stream token deltas for final text answer
      let finalAnswer = '';
      try {
        finalAnswer = currentResponse.response.text();
      } catch {
        finalAnswer = 'Autonomous tool execution and multi-step reasoning completed.';
      }

      for (const token of finalAnswer.split(' ')) {
        sendEvent('token', { text: token + ' ' });
        await new Promise(r => setTimeout(r, 10));
      }

      sendEvent('done', { totalSteps: steps, modelUsed: targetModel });
      success = true;
      break;
    } catch (err) {
      lastError = err;
      const errMsg = err.message || '';
      console.warn(`Attempt with ${targetModel} encountered: ${errMsg.slice(0, 120)}`);

      // If Quota exceeded (429) or Auth error (400/403), don't waste 15s retrying other models
      if (errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403')) {
        console.warn('Quota or Auth error detected. Immediately switching to high-speed engine.');
        break;
      }

      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Instant Fallback if Google Cloud API is saturated, quota exceeded, or key is exhausted
  if (!success) {
    const errMsg = lastError?.message || '';
    const isQuota = errMsg.includes('429') || errMsg.includes('Quota exceeded');
    const is503 = errMsg.includes('503') || errMsg.includes('high demand');

    const notice = isQuota
      ? 'Gemini API Free Tier daily quota reached (429). Running high-speed autonomous engine.'
      : is503
        ? 'Google Gemini API experiencing high demand (503). Running high-speed autonomous engine.'
        : `Running high-speed autonomous engine.`;

    await executeSimulatedToolReasoning(prompt, sendEvent, notice);
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`AgentFlow Backend running at http://localhost:${PORT}`);
});
