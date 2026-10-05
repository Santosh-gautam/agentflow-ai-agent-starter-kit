<template>
  <div class="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
    
    <!-- Ambient Background Glows -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div class="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]"></div>
    </div>

    <!-- ═══════════════════════════════════════
         TOP NAVBAR
    ═══════════════════════════════════════ -->
    <header class="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
      
      <!-- Brand Logo -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20">
          ⚡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-sm sm:text-base font-extrabold tracking-tight text-white">AgentFlow</h1>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              AI Agent v1.0
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-medium">Autonomous Tool Calling & SSE Streaming</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 sm:gap-3">
        
        <!-- Tools Catalog Button -->
        <button
          @click="showToolsModal = true"
          class="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Inspect Available Tools"
        >
          <span>🛠️ Tools ({{ availableTools.length || 3 }})</span>
        </button>

        <!-- Gemini API Key / Settings Button -->
        <button
          @click="showSettingsModal = true"
          class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          :class="userApiKey ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'"
        >
          <span v-if="userApiKey">🔑 Gemini Connected</span>
          <span v-else>⚙️ Connect Gemini API</span>
        </button>

        <!-- GitHub Link -->
        <a
          href="https://github.com/Santosh-gautam/agentflow-ai-agent-starter-kit"
          target="_blank"
          rel="noopener"
          class="hidden sm:flex px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold items-center gap-1.5 transition-colors"
        >
          <span>⭐ Star</span>
        </a>

        <!-- Clear Chat -->
        <button
          v-if="messages.length > 0"
          @click="clearChat"
          class="w-8 h-8 rounded-xl border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center text-xs transition-colors"
          title="Clear Conversation"
        >
          🗑️
        </button>
      </div>
    </header>

    <!-- ═══════════════════════════════════════
         MAIN CHAT VIEWPORT
    ═══════════════════════════════════════ -->
    <main class="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-6">
      
      <!-- Welcome Hero if Empty -->
      <div v-if="messages.length === 0" class="py-10 text-center max-w-2xl mx-auto space-y-6">
        
        <div class="inline-flex p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 text-3xl shadow-xl">
          🤖
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Autonomous AI Agent Engine
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Ask complex queries. The agent iteratively evaluates your objective, executes external tools (Math, Financials, Visual Charts), and streams live results.
          </p>
        </div>

        <!-- Connection Status Banner -->
        <div class="p-4 rounded-2xl border text-left flex items-center justify-between gap-4"
             :class="userApiKey ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'">
          <div class="space-y-0.5">
            <p class="text-xs font-bold text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="userApiKey ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              {{ userApiKey ? `Connected to Gemini (${selectedModel})` : 'Running in Local Demo Sandbox' }}
            </p>
            <p class="text-[11px] text-slate-400">
              {{ userApiKey ? 'Full reasoning and multi-step tool calling active.' : 'Connect your free Gemini API key to test live LLM intelligence.' }}
            </p>
          </div>
          <button
            @click="showSettingsModal = true"
            class="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
            :class="userApiKey ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white'"
          >
            {{ userApiKey ? 'Change' : 'Add Key' }}
          </button>
        </div>

        <!-- Suggestion Cards -->
        <div class="pt-2 text-left space-y-2.5">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Try Instant Agent Prompts</p>
          <div class="grid sm:grid-cols-2 gap-2.5">
            <button
              v-for="s in promptSuggestions"
              :key="s.title"
              @click="submitPrompt(s.prompt)"
              class="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900 text-left transition-all group"
            >
              <div class="text-xs font-bold text-white group-hover:text-blue-400 flex items-center justify-between mb-1">
                <span>{{ s.title }}</span>
                <span class="text-[10px] text-slate-500">Tool: {{ s.tool }}</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-snug">{{ s.prompt }}</p>
            </button>
          </div>
        </div>

      </div>

      <!-- Messages Stream -->
      <div v-for="(msg, mIdx) in messages" :key="mIdx" class="space-y-4">
        
        <!-- User Message -->
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="max-w-[85%] sm:max-w-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm font-medium shadow-lg shadow-blue-600/10">
            {{ msg.text }}
          </div>
        </div>

        <!-- Assistant Message -->
        <div v-else class="flex gap-3.5 items-start">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shrink-0 mt-1">
            🤖
          </div>

          <div class="flex-1 min-w-0 space-y-3">
            
            <!-- Step Status Badge while reasoning -->
            <div v-if="msg.statusText && isStreaming && mIdx === messages.length - 1" class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono animate-pulse">
              <span>🧠 {{ msg.statusText }}</span>
            </div>

            <!-- Tool Execution Cards (Expandable Accordion) -->
            <div v-if="msg.tools && msg.tools.length > 0" class="space-y-2.5">
              <div
                v-for="(tool, tIdx) in msg.tools"
                :key="tIdx"
                class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md"
              >
                <!-- Tool Header -->
                <div class="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="font-bold text-emerald-400">Tool: {{ tool.name }}</span>
                    <span v-if="tool.latencyMs" class="text-[10px] text-slate-500">({{ tool.latencyMs }}ms)</span>
                  </div>
                  <button
                    @click="tool.expanded = !tool.expanded"
                    class="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>{{ tool.expanded ? 'Hide Payload' : 'Inspect Payload' }}</span>
                    <span>{{ tool.expanded ? '▲' : '▼' }}</span>
                  </button>
                </div>

                <!-- Interactive Chart Display if Chart Tool -->
                <div v-if="tool.name === 'generate_chart_visualization' && tool.result && tool.result.data" class="p-4 bg-slate-950/40">
                  <p class="text-xs font-bold text-white mb-3">{{ tool.result.title }}</p>
                  <div class="space-y-2">
                    <div v-for="point in tool.result.data" :key="point.label" class="space-y-1">
                      <div class="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>{{ point.label }}</span>
                        <span class="text-blue-400 font-bold">${{ Number(point.value).toLocaleString() }}</span>
                      </div>
                      <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          :style="{ width: `${Math.min(100, (point.value / (tool.result.total || 1)) * 200)}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Expanded JSON Payload Viewer -->
                <div v-show="tool.expanded" class="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border-t border-slate-800/60 space-y-2">
                  <div>
                    <span class="text-slate-500">// Arguments</span>
                    <pre class="text-cyan-300 mt-1">{{ JSON.stringify(tool.args, null, 2) }}</pre>
                  </div>
                  <div>
                    <span class="text-slate-500">// Output</span>
                    <pre class="text-emerald-300 mt-1">{{ JSON.stringify(tool.result, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Calling Tool Spinner -->
            <div v-if="activeToolName" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2 animate-pulse">
              <span class="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Invoking Tool: <strong>{{ activeToolName }}</strong>...</span>
            </div>

            <!-- Main Response Bubble -->
            <div class="relative group p-5 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800/80 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap shadow-md">
              <div v-html="formatMarkdown(msg.text)"></div>
              <span v-if="isStreaming && mIdx === messages.length - 1" class="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>

              <!-- Copy Text Button -->
              <button
                v-if="msg.text && !isStreaming"
                @click="copyResponse(msg.text, mIdx)"
                class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
              >
                <span>{{ copiedIndex === mIdx ? '✓ Copied' : '📋 Copy' }}</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </main>

    <!-- ═══════════════════════════════════════
         BOTTOM INPUT BAR & GUARDRAILS
    ═══════════════════════════════════════ -->
    <footer class="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-2">
      
      <!-- Input Box -->
      <form @submit.prevent="handleSubmit" class="relative flex items-center">
        <input
          v-model="inputQuery"
          type="text"
          :disabled="isStreaming"
          maxlength="2000"
          placeholder="Ask something... (e.g. Calculate 1500 * 86.85 or Generate revenue chart)"
          class="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 outline-none transition-all pr-32 shadow-2xl"
        />

        <div class="absolute right-2.5 flex items-center gap-2">
          <!-- Stop Button -->
          <button
            v-if="isStreaming"
            type="button"
            @click="stopGeneration"
            class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
          >
            ⏹ Stop
          </button>

          <!-- Submit Button -->
          <button
            v-else
            type="submit"
            :disabled="!inputQuery.trim()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
          >
            Send ⚡
          </button>
        </div>
      </form>

      <!-- Input Footer Info & Guardrail Counter -->
      <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 px-2">
        <span>MIT Open Source · Self-correcting AI Agent Loop</span>
        <span>{{ inputQuery.length }} / 2000 chars</span>
      </div>
    </footer>

    <!-- ═══════════════════════════════════════
         SETTINGS & API KEY MODAL
    ═══════════════════════════════════════ -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 relative">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">⚙️</span>
            <h3 class="text-base font-black text-white">Agent & Gemini API Settings</h3>
          </div>
          <button @click="showSettingsModal = false" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div class="space-y-4">
          
          <!-- API Key Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Google Gemini API Key</label>
            <div class="relative">
              <input
                v-model="tempApiKey"
                :type="showKeyText ? 'text' : 'password'"
                placeholder="AIzaSy..."
                class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none pr-16 font-mono"
              />
              <button
                type="button"
                @click="showKeyText = !showKeyText"
                class="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-white"
              >
                {{ showKeyText ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              🔒 Key is saved in your local browser storage and never logged on disk.
              <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-400 hover:underline font-semibold ml-1">
                Get Free Key (Google AI Studio) →
              </a>
            </p>
          </div>

          <!-- Model Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Target Gemini Model</label>
            <select
              v-model="selectedModel"
              class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended · Ultra Low Latency)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Balanced)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Multi-Step Reasoning)</option>
            </select>
          </div>

        </div>

        <!-- Modal Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            v-if="userApiKey"
            @click="removeApiKey"
            class="text-xs font-bold text-rose-400 hover:underline"
          >
            Disconnect Key
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2.5">
            <button
              @click="showSettingsModal = false"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              @click="saveSettings"
              class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg"
            >
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════
         TOOLS CATALOG MODAL
    ═══════════════════════════════════════ -->
    <div v-if="showToolsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🛠️</span>
            <div>
              <h3 class="text-base font-black text-white">Registered Agent Tools</h3>
              <p class="text-[11px] text-slate-400">Schema-validated tools callable by the agent</p>
            </div>
          </div>
          <button @click="showToolsModal = false" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div class="space-y-3">
          <div
            v-for="tool in availableTools"
            :key="tool.name"
            class="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-400 font-mono">{{ tool.name }}</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                JSON Schema
              </span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">{{ tool.description }}</p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800 text-right">
          <button
            @click="showToolsModal = false"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const inputQuery = ref('');
const isStreaming = ref(false);
const activeToolName = ref(null);
const messages = ref([]);
const copiedIndex = ref(null);

const showSettingsModal = ref(false);
const showToolsModal = ref(false);
const showKeyText = ref(false);

const userApiKey = ref('');
const tempApiKey = ref('');
const selectedModel = ref('gemini-2.0-flash');

let abortController = null;

const promptSuggestions = [
  {
    title: "Math Calculation",
    tool: "calculate_expression",
    prompt: "Calculate 1500 * 86.85 + (2400 / 1.18)"
  },
  {
    title: "Visual Revenue Chart",
    tool: "generate_chart_visualization",
    prompt: "Generate a quarterly revenue comparison chart for 2026"
  },
  {
    title: "Crypto / Market Data",
    tool: "fetch_market_or_tech_info",
    prompt: "What is the live price and 24h change of Bitcoin?"
  },
  {
    title: "Currency Conversion",
    tool: "fetch_market_or_tech_info",
    prompt: "Convert 850 USD to Indian Rupee (INR)"
  }
];

const availableTools = ref([
  {
    name: "calculate_expression",
    description: "Evaluates mathematical expressions and returns exact calculated numeric results."
  },
  {
    name: "fetch_market_or_tech_info",
    description: "Fetches live or simulated market prices (BTC/ETH), currency exchange rates, and tech benchmarks."
  },
  {
    name: "generate_chart_visualization",
    description: "Constructs structured chart data points (bar, line, pie) for inline visual display."
  }
]);

onMounted(() => {
  const savedKey = localStorage.getItem('agentflow_gemini_key') || '';
  const savedModel = localStorage.getItem('agentflow_gemini_model') || 'gemini-2.0-flash';
  userApiKey.value = savedKey;
  tempApiKey.value = savedKey;
  selectedModel.value = savedModel;
});

function saveSettings() {
  userApiKey.value = tempApiKey.value.trim();
  localStorage.setItem('agentflow_gemini_key', userApiKey.value);
  localStorage.setItem('agentflow_gemini_model', selectedModel.value);
  showSettingsModal.value = false;
}

function removeApiKey() {
  userApiKey.value = '';
  tempApiKey.value = '';
  localStorage.removeItem('agentflow_gemini_key');
  showSettingsModal.value = false;
}

function clearChat() {
  messages.value = [];
}

function submitPrompt(text) {
  inputQuery.value = text;
  handleSubmit();
}

function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  isStreaming.value = false;
  activeToolName.value = null;
}

function formatMarkdown(text) {
  if (!text) return '';
  // Basic markdown formatting for bold, code snippets, headers
  return text
    .replace(/^### (.*$)/gim, '<strong class="text-sm font-bold text-white block mt-2 mb-1">$1</strong>')
    .replace(/^## (.*$)/gim, '<strong class="text-base font-black text-white block mt-3 mb-1">$1</strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-bold">$1</strong>')
    .replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs">$1</code>');
}

async function copyResponse(text, idx) {
  try {
    await navigator.clipboard.writeText(text);
    copiedIndex.value = idx;
    setTimeout(() => { copiedIndex.value = null; }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

async function handleSubmit() {
  const query = inputQuery.value.trim();
  if (!query || isStreaming.value) return;

  inputQuery.value = '';
  isStreaming.value = true;
  activeToolName.value = null;

  messages.value.push({ role: 'user', text: query });

  const assistantMsg = {
    role: 'assistant',
    text: '',
    statusText: 'Analyzing intent...',
    tools: []
  };
  messages.value.push(assistantMsg);

  abortController = new AbortController();

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (userApiKey.value) {
      headers['x-gemini-api-key'] = userApiKey.value;
    }

    const response = await fetch('/api/agent/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: query,
        model: selectedModel.value
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${response.status}`);
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

          if (event === 'status') {
            assistantMsg.statusText = data.message;
          } else if (event === 'token') {
            assistantMsg.text += data.text;
          } else if (event === 'tool_start') {
            activeToolName.value = data.name;
            assistantMsg.statusText = `Calling ${data.name}...`;
          } else if (event === 'tool_result') {
            assistantMsg.tools.push({
              name: data.name,
              args: data.args || {},
              result: data.result,
              latencyMs: data.latencyMs,
              expanded: false
            });
            activeToolName.value = null;
          } else if (event === 'error') {
            assistantMsg.text += `\n[Error: ${data.message}]`;
          }
        } catch (e) {
          console.error('Stream decode parse error:', e);
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      assistantMsg.text = `⚠️ Error: ${err.message}. Please check your connection or API key.`;
    }
  } finally {
    isStreaming.value = false;
    activeToolName.value = null;
    abortController = null;
  }
}
</script>
