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

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(apiKey),
    toolsAvailable: Object.keys(toolRegistry),
    timestamp: new Date().toISOString()
  });
});

// Autonomous Agent Streaming Endpoint
app.post('/api/agent/stream', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Set Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // If no API key is provided, execute in Mock Sandbox Agent mode so user can test immediately!
    if (!genAI) {
      sendEvent('status', { message: 'Running in Local Demo Mode (Add GEMINI_API_KEY for live LLM)' });
      await new Promise(r => setTimeout(r, 600));

      const lower = prompt.toLowerCase();
      if (lower.includes('calc') || lower.includes('+') || lower.includes('*') || lower.includes('convert') || lower.includes('bitcoin') || lower.includes('usd')) {
        // Execute Tool Calling demonstration
        let toolName = 'calculate_expression';
        let toolArgs = { expression: '150 * 86.85' };

        if (lower.includes('bitcoin') || lower.includes('btc')) {
          toolName = 'fetch_market_or_tech_info';
          toolArgs = { topic: 'Bitcoin' };
        } else if (lower.includes('usd') || lower.includes('inr')) {
          toolName = 'fetch_market_or_tech_info';
          toolArgs = { topic: 'USD_TO_INR' };
        }

        sendEvent('tool_start', { name: toolName, args: toolArgs });
        await new Promise(r => setTimeout(r, 800));

        const result = await toolRegistry[toolName](toolArgs);
        sendEvent('tool_result', { name: toolName, result });
        await new Promise(r => setTimeout(r, 400));

        const answer = `[Agent Reasoning Complete]\nBased on the tool execution for \`${toolName}\`:\n\n` +
          `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n` +
          `The autonomous agent successfully parsed your prompt, executed the necessary tool with schema validation, and produced the final verified response.`;

        for (const token of answer.split(' ')) {
          sendEvent('token', { text: token + ' ' });
          await new Promise(r => setTimeout(r, 25));
        }
      } else {
        const text = `I received your prompt: "${prompt}".\n\nTo connect this agent to live Google Gemini 2.0 models with dynamic tool reasoning, add your free \`GEMINI_API_KEY\` in \`server/.env\`!\n\nTry asking: "Calculate 1500 * 86.85" or "What is the price of Bitcoin?" to see live tool calling in action.`;
        for (const token of text.split(' ')) {
          sendEvent('token', { text: token + ' ' });
          await new Promise(r => setTimeout(r, 30));
        }
      }

      sendEvent('done', { completed: true });
      return res.end();
    }

    // LIVE GEMINI 2.0 / 1.5 AGENT EXECUTION
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ functionDeclarations: toolDeclarations }]
    });

    const chat = model.startChat();
    sendEvent('status', { message: 'Agent analyzing intent...' });

    let currentResponse = await chat.sendMessage(prompt);
    let functionCalls = currentResponse.response.functionCalls();

    let steps = 0;
    const MAX_STEPS = 5;

    while (functionCalls && functionCalls.length > 0 && steps < MAX_STEPS) {
      steps++;
      for (const call of functionCalls) {
        const { name, args } = call;
        sendEvent('tool_start', { name, args });

        const executor = toolRegistry[name];
        let toolResult = { error: 'Unknown tool' };
        if (executor) {
          toolResult = await executor(args);
        }

        sendEvent('tool_result', { name, result: toolResult });

        // Send tool output back to model
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

    // Stream final text response
    const finalAnswer = currentResponse.response.text();
    for (const token of finalAnswer.split(' ')) {
      sendEvent('token', { text: token + ' ' });
      await new Promise(r => setTimeout(r, 20));
    }

    sendEvent('done', { totalSteps: steps });
    res.end();
  } catch (error) {
    sendEvent('error', { message: error.message });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`AgentFlow Backend running at http://localhost:${PORT}`);
});
