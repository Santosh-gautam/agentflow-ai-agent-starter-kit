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

// In-Memory Rate Limiting Guardrail (Max 25 requests per minute per IP)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;

const rateLimiter = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'localhost';
  const now = Date.now();

  const userHistory = ipRequestCounts.get(ip) || [];
  const recentRequests = userHistory.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute before sending another prompt.'
    });
  }

  recentRequests.push(now);
  ipRequestCounts.set(ip, recentRequests);
  next();
};

// Health Check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    defaultServerKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    supportedModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
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

// Autonomous Agent Streaming Endpoint
app.post('/api/agent/stream', rateLimiter, async (req, res) => {
  const { prompt, model: requestedModel = 'gemini-1.5-flash' } = req.body;

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
        message: 'Running in Local Demo Mode. (Add your Gemini API Key in Settings for live LLM).'
      });
      await new Promise(r => setTimeout(r, 400));

      const lower = prompt.toLowerCase();
      let toolName = 'calculate_expression';
      let toolArgs = { expression: '1500 * 86.85 + 250' };

      if (lower.includes('chart') || lower.includes('graph') || lower.includes('revenue') || lower.includes('sales')) {
        toolName = 'generate_chart_visualization';
        toolArgs = {
          title: 'Q1-Q4 Product Performance',
          chartType: 'bar',
          labels: ['Q1 Jan', 'Q2 Apr', 'Q3 Jul', 'Q4 Oct'],
          values: [28000, 42500, 68000, 94000]
        };
      } else if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('crypto')) {
        toolName = 'fetch_market_or_tech_info';
        toolArgs = { topic: 'Bitcoin' };
      } else if (lower.includes('usd') || lower.includes('inr') || lower.includes('currency')) {
        toolName = 'fetch_market_or_tech_info';
        toolArgs = { topic: 'USD_TO_INR' };
      } else if (!lower.includes('calc') && !lower.includes('+') && !lower.includes('*')) {
        toolName = 'fetch_market_or_tech_info';
        toolArgs = { topic: prompt.slice(0, 30) };
      }

      const startTime = Date.now();
      sendEvent('tool_start', { name: toolName, args: toolArgs });
      await new Promise(r => setTimeout(r, 700));

      const result = await toolRegistry[toolName](toolArgs);
      const latency = Date.now() - startTime;
      sendEvent('tool_result', { name: toolName, result, latencyMs: latency });
      await new Promise(r => setTimeout(r, 300));

      let answer = '';
      if (toolName === 'generate_chart_visualization') {
        answer = `### 📊 Visual Analytics Generated\n\nI executed the \`${toolName}\` tool and rendered the interactive visualization data for **${toolArgs.title}**.\n\nTotal aggregated volume: **$${result.total.toLocaleString()}** across 4 quarters.`;
      } else {
        answer = `### ⚡ Tool Execution Completed\n\nThe autonomous agent executed \`${toolName}\` (${latency}ms) with schema validation.\n\n` +
          `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n` +
          `**Connect Gemini:** Click the **API Key** button at the top to connect your free Google Gemini key for unrestricted AI agent capabilities!`;
      }

      for (const token of answer.split(' ')) {
        sendEvent('token', { text: token + ' ' });
        await new Promise(r => setTimeout(r, 20));
      }

      sendEvent('done', { completed: true, steps: 1 });
      return res.end();
    }

    // ══════════════════════════════════════════════════════════
    // LIVE GEMINI AGENT EXECUTION
    // ══════════════════════════════════════════════════════════
    const genAI = new GoogleGenerativeAI(apiKey);
    const validModel = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].includes(requestedModel)
      ? requestedModel
      : 'gemini-1.5-flash';

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
        sendEvent('tool_result', { name, result: toolResult, latencyMs: toolLatency });

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
      await new Promise(r => setTimeout(r, 18));
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
