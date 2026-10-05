<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-10 font-sans">
    
    <!-- Top Header -->
    <header class="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-blue-500/20">
          ⚡
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            AgentFlow
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              v1.0 (Tool Calling + SSE)
            </span>
          </h1>
          <p class="text-xs text-slate-400">Autonomous Multi-Step AI Agent Starter Kit</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a
          href="https://github.com/Santosh-gautam/agentflow-ai-agent-starter-kit"
          target="_blank"
          class="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 text-xs font-bold text-slate-300 transition-colors flex items-center gap-2"
        >
          <span>⭐ Star on GitHub</span>
        </a>
      </div>
    </header>

    <!-- Main Chat Messages Area -->
    <main class="w-full max-w-4xl flex-1 py-6 overflow-y-auto space-y-6">
      
      <!-- Welcome Hero if no messages -->
      <div v-if="messages.length === 0" class="text-center py-12 px-4 max-w-2xl mx-auto space-y-4">
        <div class="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-2xl mb-2">
          🤖
        </div>
        <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Ask anything. Watch the Agent Reason & Call Tools.
        </h2>
        <p class="text-sm text-slate-400 leading-relaxed">
          This autonomous agent uses Server-Sent Events (SSE) to stream token deltas in real-time, executing schema-validated functions in a self-correcting feedback loop.
        </p>

        <!-- Suggestion Chips -->
        <div class="pt-4 flex flex-wrap justify-center gap-2">
          <button
            v-for="chip in suggestions"
            :key="chip"
            @click="sendPrompt(chip)"
            class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-all text-left"
          >
            💬 {{ chip }}
          </button>
        </div>
      </div>

      <!-- Messages Thread -->
      <div v-for="(msg, index) in messages" :key="index" class="space-y-3">
        
        <!-- User Message -->
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="max-w-[85%] sm:max-w-xl bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 text-sm font-medium shadow-md">
            {{ msg.text }}
          </div>
        </div>

        <!-- Assistant Message -->
        <div v-else class="flex gap-3.5 items-start">
          <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-sm shrink-0">
            🤖
          </div>

          <div class="flex-1 space-y-3 max-w-3xl">
            
            <!-- Tool Calls Execution Badges -->
            <div v-if="msg.toolsExecuted && msg.toolsExecuted.length > 0" class="space-y-2">
              <div
                v-for="(tool, tIdx) in msg.toolsExecuted"
                :key="tIdx"
                class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1.5"
              >
                <div class="flex items-center justify-between text-emerald-400 font-bold">
                  <span>⚡ Tool Executed: {{ tool.name }}</span>
                  <span class="text-[10px] text-slate-500">JSON Schema Validated</span>
                </div>
                <pre class="p-2 rounded-lg bg-slate-950 text-slate-300 text-[11px] overflow-x-auto border border-slate-800/80">{{ JSON.stringify(tool.output, null, 2) }}</pre>
              </div>
            </div>

            <!-- Active Tool Running Indicator -->
            <div v-if="activeTool" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse">
              <span>⏳ Calling Tool: <strong>{{ activeTool }}</strong>...</span>
            </div>

            <!-- Assistant Text Bubble -->
            <div class="p-5 rounded-2xl rounded-tl-sm bg-slate-900/70 border border-slate-800/80 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
              {{ msg.text }}
              <span v-if="isStreaming && index === messages.length - 1" class="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- Bottom Input Box -->
    <footer class="w-full max-w-4xl pt-4">
      <form @submit.prevent="handleSubmit" class="relative flex items-center">
        <input
          v-model="inputQuery"
          type="text"
          :disabled="isStreaming"
          placeholder="Ask something... (e.g. Calculate 1500 * 86.85 or Get Bitcoin price)"
          class="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 outline-none transition-all pr-28 shadow-xl"
        />
        <button
          type="submit"
          :disabled="isStreaming || !inputQuery.trim()"
          class="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow-lg"
        >
          {{ isStreaming ? 'Running...' : 'Send' }}
        </button>
      </form>
      <p class="text-center text-[11px] text-slate-500 mt-2.5">
        MIT Licensed Open-Source Starter Kit · Built with Node.js, Express, Vue 3 & Google Gemini
      </p>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const inputQuery = ref('');
const isStreaming = ref(false);
const activeTool = ref(null);
const messages = ref([]);

const suggestions = [
  "Calculate 1500 * 86.85 + 450",
  "What is the price of Bitcoin?",
  "Convert 500 USD to INR",
  "What are the best practices for SSE streaming in Vue 3?"
];

function sendPrompt(promptText) {
  inputQuery.value = promptText;
  handleSubmit();
}

async function handleSubmit() {
  const query = inputQuery.value.trim();
  if (!query || isStreaming.value) return;

  inputQuery.value = '';
  isStreaming.value = true;
  activeTool.value = null;

  messages.value.push({ role: 'user', text: query });

  const assistantMsg = {
    role: 'assistant',
    text: '',
    toolsExecuted: []
  };
  messages.value.push(assistantMsg);

  try {
    const response = await fetch('/api/agent/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;

        const lines = block.split('\n');
        let event = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.replace('data: ', '').trim();
          }
        }

        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          if (event === 'token') {
            assistantMsg.text += data.text;
          } else if (event === 'tool_start') {
            activeTool.value = data.name;
          } else if (event === 'tool_result') {
            assistantMsg.toolsExecuted.push({
              name: data.name,
              output: data.result
            });
            activeTool.value = null;
          } else if (event === 'error') {
            assistantMsg.text += `\n[Error: ${data.message}]`;
          }
        } catch (e) {
          console.error('SSE JSON parse error:', e, dataStr);
        }
      }
    }
  } catch (err) {
    assistantMsg.text = `Failed to connect to backend: ${err.message}. Ensure the Node.js server is running on port 3001.`;
  } finally {
    isStreaming.value = false;
    activeTool.value = null;
  }
}
</script>
