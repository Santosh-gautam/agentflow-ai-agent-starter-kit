<template>
  <div class="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
    
    <!-- Ambient Background Glows -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-[140px]"></div>
      <div class="absolute top-1/3 -right-40 w-[28rem] h-[28rem] bg-indigo-600/10 rounded-full blur-[140px]"></div>
      <div class="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[140px]"></div>
    </div>

    <!-- ═══════════════════════════════════════════════
         TOP NAVBAR & WORKSPACE CONTROLS
    ═══════════════════════════════════════════════ -->
    <header class="relative z-20 w-full border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
      
      <!-- Brand Logo & Status -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25 border border-white/10">
          ⚡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
              AgentFlow
              <span class="text-blue-400 font-mono text-xs font-semibold">Studio</span>
            </h1>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
              v1.2 Live
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Tool Calling Engine & SSE Loop
          </p>
        </div>
      </div>

      <!-- Navigation Tabs (Views) -->
      <div class="hidden md:flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
        <button
          @click="activeView = 'chat'"
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="activeView === 'chat' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white'"
        >
          <span>💬 Agent Chat</span>
        </button>
        <button
          @click="activeView = 'playground'"
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="activeView === 'playground' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white'"
        >
          <span>🧪 Tool Playground</span>
        </button>
        <button
          @click="activeView = 'pipeline'"
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="activeView === 'pipeline' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white'"
        >
          <span>📐 Architecture</span>
        </button>
        <button
          @click="showKeyGuideModal = true"
          class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1"
        >
          <span>📖 API Guide</span>
        </button>
      </div>

      <!-- Action & Settings Buttons -->
      <div class="flex items-center gap-2 sm:gap-3">
        
        <!-- Gemini API Key / Settings Button -->
        <button
          @click="showSettingsModal = true"
          class="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm border"
          :class="userApiKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30 shadow-blue-500/20'"
        >
          <span v-if="userApiKey">🔑 Gemini Active</span>
          <span v-else>⚙️ Connect Gemini</span>
        </button>

        <!-- Tools Catalog Button -->
        <button
          @click="showToolsModal = true"
          class="hidden sm:flex px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold items-center gap-1.5 transition-colors"
          title="Inspect Registered Tools"
        >
          <span>🧰 Tools (5)</span>
        </button>

        <!-- GitHub Link -->
        <a
          href="https://github.com/Santosh-gautam/agentflow-ai-agent-starter-kit"
          target="_blank"
          rel="noopener"
          class="hidden sm:flex px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold items-center gap-1.5 transition-colors"
        >
          <span>⭐ GitHub</span>
        </a>

        <!-- Clear Chat Button -->
        <button
          v-if="activeView === 'chat' && messages.length > 0"
          @click="clearChat"
          class="w-9 h-9 rounded-xl border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center text-xs transition-colors"
          title="Clear Chat Conversation"
        >
          🗑️
        </button>
      </div>
    </header>

    <!-- Mobile View Selector Sub-nav -->
    <div class="md:hidden flex items-center justify-center p-2 bg-slate-950 border-b border-slate-800/80 gap-1 text-xs">
      <button
        @click="activeView = 'chat'"
        class="px-3 py-1.5 rounded-lg font-bold"
        :class="activeView === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400'"
      >
        💬 Chat
      </button>
      <button
        @click="activeView = 'playground'"
        class="px-3 py-1.5 rounded-lg font-bold"
        :class="activeView === 'playground' ? 'bg-blue-600 text-white' : 'text-slate-400'"
      >
        🧪 Playground
      </button>
      <button
        @click="activeView = 'pipeline'"
        class="px-3 py-1.5 rounded-lg font-bold"
        :class="activeView === 'pipeline' ? 'bg-blue-600 text-white' : 'text-slate-400'"
      >
        📐 Flow
      </button>
      <button
        @click="showKeyGuideModal = true"
        class="px-3 py-1.5 rounded-lg font-bold text-amber-400"
      >
        📖 Guide
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════
         VIEW 1: AGENT CHAT VIEWPORT
    ═══════════════════════════════════════════════ -->
    <main v-if="activeView === 'chat'" class="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-6">
      
      <!-- Welcome Hero (When empty) -->
      <div v-if="messages.length === 0" class="py-6 text-center max-w-2xl mx-auto space-y-5">
        
        <div class="inline-flex p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/30 text-3xl shadow-xl">
          🤖
        </div>

        <div class="space-y-1.5">
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Autonomous AI Agent Studio
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Experience production <strong>Tool Calling (Function Calling)</strong> with Server-Sent Events (SSE). Ask queries, and watch the agent iteratively evaluate, execute tools, and stream answers.
          </p>
        </div>

        <!-- Connection Status & Guide Banner -->
        <div class="p-4 rounded-2xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
             :class="userApiKey ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/80 border-slate-800'">
          <div class="space-y-1">
            <p class="text-xs font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" :class="userApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
              {{ userApiKey ? `Connected: Gemini (${selectedModel})` : 'Interactive Demo Sandbox Active' }}
            </p>
            <p class="text-[11px] text-slate-400 leading-normal">
              {{ userApiKey ? 'Multi-step autonomous tool calling active with your custom Gemini API key.' : 'Connect your free Google Gemini API key to unlock unlimited autonomous tool calling & reasoning.' }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="showKeyGuideModal = true"
              class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700/60"
            >
              📖 How to get Key
            </button>
            <button
              @click="showSettingsModal = true"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md"
              :class="userApiKey ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'"
            >
              {{ userApiKey ? 'Manage' : 'Connect Key' }}
            </button>
          </div>
        </div>

        <!-- Suggestion Cards (Interactive Prompts) -->
        <div class="pt-2 text-left space-y-2.5">
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">⚡ Instant Tool-Calling Prompts</p>
            <span class="text-[11px] text-blue-400 font-medium">Click to Run</span>
          </div>
          <div class="grid sm:grid-cols-2 gap-2.5">
            <button
              v-for="s in promptSuggestions"
              :key="s.title"
              @click="submitPrompt(s.prompt)"
              class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-blue-500/60 hover:bg-slate-900 text-left transition-all group shadow-sm hover:shadow-md hover:shadow-blue-500/10"
            >
              <div class="text-xs font-bold text-white group-hover:text-blue-400 flex items-center justify-between mb-1">
                <span class="flex items-center gap-1.5">
                  <span>{{ s.icon }}</span>
                  <span>{{ s.title }}</span>
                </span>
                <span class="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">{{ s.tool }}</span>
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
          <div class="max-w-[85%] sm:max-w-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm font-medium shadow-lg shadow-blue-600/15">
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

            <!-- Active Calling Tool Spinner -->
            <div v-if="activeToolName && mIdx === messages.length - 1" class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2.5 animate-pulse shadow-sm">
              <span class="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Invoking Registered Tool: <strong class="text-amber-200">{{ activeToolName }}</strong>...</span>
            </div>

            <!-- Tool Execution Cards (Expandable Accordion) -->
            <div v-if="msg.tools && msg.tools.length > 0" class="space-y-3">
              <div
                v-for="(tool, tIdx) in msg.tools"
                :key="tIdx"
                class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md"
              >
                <!-- Tool Header Bar -->
                <div class="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="font-bold text-emerald-400">Tool Execution: {{ tool.name }}</span>
                    <span v-if="tool.latencyMs" class="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {{ tool.latencyMs }}ms
                    </span>
                  </div>
                  <button
                    @click="tool.expanded = !tool.expanded"
                    class="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>{{ tool.expanded ? 'Hide Payload' : 'Inspect JSON' }}</span>
                    <span>{{ tool.expanded ? '▲' : '▼' }}</span>
                  </button>
                </div>

                <!-- Custom Visual Card: Weather -->
                <div v-if="tool.name === 'getLiveWeather' && tool.result && !tool.result.error" class="p-4 bg-slate-950/40 flex items-center justify-between">
                  <div class="space-y-1">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Meteorological Feed</p>
                    <h4 class="text-base font-black text-white">{{ tool.result.city }}</h4>
                    <p class="text-xs text-slate-300">{{ tool.result.condition }}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-black text-white">{{ tool.result.temperatureCelsius }}°C</div>
                    <p class="text-[11px] text-slate-400 font-mono">Humidity: {{ tool.result.humidityPercent }}% · Wind: {{ tool.result.windSpeedKmH }} km/h</p>
                  </div>
                </div>

                <!-- Custom Visual Card: Stock / Market -->
                <div v-if="tool.name === 'fetchStockPrice' && tool.result && !tool.result.error" class="p-4 bg-slate-950/40 flex items-center justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">{{ tool.result.symbol }}</span>
                      <span class="text-xs font-bold text-white">{{ tool.result.assetName || tool.result.type }}</span>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ tool.result.exchange || 'Live Telemetry' }} · Cap: {{ tool.result.marketCap || 'N/A' }}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-black text-white">${{ tool.result.priceUSD || tool.result.price }}</div>
                    <span
                      class="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                      :class="(tool.result.change24hPercent || tool.result.dailyChange || '').includes('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'"
                    >
                      {{ tool.result.change24hPercent || tool.result.dailyChange }}
                    </span>
                  </div>
                </div>

                <!-- Custom Visual Card: Interactive Chart -->
                <div v-if="tool.name === 'generate_chart_visualization' && tool.result && tool.result.data" class="p-4 bg-slate-950/40">
                  <p class="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <span>📊</span>
                    <span>{{ tool.result.title }}</span>
                  </p>
                  <div class="space-y-2">
                    <div v-for="point in tool.result.data" :key="point.label" class="space-y-1">
                      <div class="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>{{ point.label }}</span>
                        <span class="text-blue-400 font-bold">${{ Number(point.value).toLocaleString() }}</span>
                      </div>
                      <div class="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
                          :style="{ width: `${Math.min(100, (point.value / (tool.result.total || 1)) * 220)}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Expanded JSON Payload Viewer -->
                <div v-show="tool.expanded" class="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border-t border-slate-800/60 space-y-2">
                  <div>
                    <span class="text-slate-500">// Function Arguments (Invoked by LLM)</span>
                    <pre class="text-cyan-300 mt-1">{{ JSON.stringify(tool.args, null, 2) }}</pre>
                  </div>
                  <div>
                    <span class="text-slate-500">// Execution Output (Sent to LLM Context)</span>
                    <pre class="text-emerald-300 mt-1">{{ JSON.stringify(tool.result, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Response Bubble -->
            <div class="relative group p-5 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800/80 text-sm leading-relaxed text-slate-200 shadow-md">
              <div class="prose-custom whitespace-pre-wrap" v-html="formatMarkdown(msg.text)"></div>
              <span v-if="isStreaming && mIdx === messages.length - 1" class="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>

              <!-- Action Bar (Copy & Voice Speak) -->
              <div v-if="msg.text && !isStreaming" class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                <!-- Text-to-Speech Speak Button -->
                <button
                  @click="toggleSpeak(msg.text, mIdx)"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition-colors flex items-center gap-1.5"
                  :title="speakingIndex === mIdx ? 'Stop Speaking' : 'Read Out Loud (Voice Call Mode)'"
                >
                  <span>{{ speakingIndex === mIdx ? '🔊 Stop Audio' : '🎙️ Speak Audio' }}</span>
                </button>

                <!-- Copy Text Button -->
                <button
                  @click="copyResponse(msg.text, mIdx)"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition-colors flex items-center gap-1"
                >
                  <span>{{ copiedIndex === mIdx ? '✓ Copied' : '📋 Copy Text' }}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </main>

    <!-- ═══════════════════════════════════════════════
         VIEW 2: INTERACTIVE TOOL PLAYGROUND (DIRECT CALLER)
    ═══════════════════════════════════════════════ -->
    <main v-else-if="activeView === 'playground'" class="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-6">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-black text-white flex items-center gap-2">
              <span>🧪</span>
              <span>Interactive Tool Calling Playground</span>
            </h2>
            <p class="text-xs text-slate-400">
              Directly invoke registered backend tools and inspect latency and JSON schema validation.
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            5 Tools Ready
          </span>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        
        <!-- Left: Tool Selector List -->
        <div class="space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Tool to Test</p>
          <div class="space-y-1.5">
            <button
              v-for="t in availableTools"
              :key="t.name"
              @click="selectPlaygroundTool(t)"
              class="w-full p-3 rounded-2xl border text-left transition-all"
              :class="selectedPlaygroundTool.name === t.name ? 'bg-blue-600/15 border-blue-500 text-white shadow-md' : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold font-mono">{{ t.name }}</span>
                <span>{{ t.icon }}</span>
              </div>
              <p class="text-[11px] text-slate-400 line-clamp-2">{{ t.description }}</p>
            </button>
          </div>
        </div>

        <!-- Right: Tool Arguments & Direct Execution Terminal -->
        <div class="md:col-span-2 space-y-4">
          <div class="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <span>⚡</span>
                  <span>{{ selectedPlaygroundTool.name }}</span>
                </h3>
                <p class="text-[11px] text-slate-400">{{ selectedPlaygroundTool.description }}</p>
              </div>
              <button
                @click="executePlaygroundTool"
                :disabled="isExecutingTool"
                class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <span v-if="isExecutingTool" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isExecutingTool ? 'Calling...' : '⚡ Execute Tool' }}</span>
              </button>
            </div>

            <!-- JSON Arguments Input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">Tool Input Arguments (JSON)</label>
              <textarea
                v-model="playgroundArgsJson"
                rows="4"
                class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs font-mono text-cyan-300 outline-none"
              ></textarea>
            </div>

            <!-- Execution Result Panel -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-300">Execution Output & Telemetry</label>
                <span v-if="playgroundLatency" class="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Latency: {{ playgroundLatency }}ms
                </span>
              </div>
              <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-emerald-300 min-h-[160px] max-h-[260px] overflow-y-auto">
                <pre v-if="playgroundResult">{{ JSON.stringify(playgroundResult, null, 2) }}</pre>
                <p v-else class="text-slate-600 italic">Click "Execute Tool" to call backend tool runner and inspect live JSON response...</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ═══════════════════════════════════════════════
         VIEW 3: AGENT EXECUTION PIPELINE VISUALIZER
    ═══════════════════════════════════════════════ -->
    <main v-else-if="activeView === 'pipeline'" class="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-6">
      <div class="space-y-2">
        <h2 class="text-xl font-black text-white flex items-center gap-2">
          <span>📐</span>
          <span>AgentFlow Architecture & Reasoning Loop</span>
        </h2>
        <p class="text-xs text-slate-400">
          How Gemini Function Calling, Server-Sent Events (SSE), and the Node.js Tool Registry interact.
        </p>
      </div>

      <div class="grid gap-4">
        
        <!-- Step 1 -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-black flex items-center justify-center shrink-0">
            1
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-white">Prompt & Tool Declarations Dispatch</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              The user query arrives via HTTP POST. The backend attaches registered JSON schemas (<code class="text-cyan-300 font-mono">tools: [{ functionDeclarations }]</code>) to the Gemini model session.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-black flex items-center justify-center shrink-0">
            2
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-white">Autonomous Decision (Function Call Output)</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              If the model requires external data (Weather, Stocks, Charting, Calculations), it halts natural language generation and outputs a structured <code class="text-amber-300 font-mono">functionCall: { name, args }</code>.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-black flex items-center justify-center shrink-0">
            3
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-white">Node.js Tool Registry Execution & Real-time SSE Stream</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              The server executes the matching tool handler, sends real-time SSE events (<code class="text-emerald-300 font-mono">event: tool_start</code>, <code class="text-emerald-300 font-mono">event: tool_result</code>) to the browser, and injects the output back into Gemini's reasoning context.
            </p>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4 shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-black flex items-center justify-center shrink-0">
            4
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-white">Final Answer Synthesis & Token-by-Token SSE Stream</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Gemini analyzes the tool response data and streams the final synthesis text token-by-token (<code class="text-cyan-300 font-mono">event: token</code>) directly to the frontend.
            </p>
          </div>
        </div>

      </div>
    </main>

    <!-- ═══════════════════════════════════════════════
         BOTTOM INPUT BAR & VOICE CALL MODE (Chat View Only)
    ═══════════════════════════════════════════════ -->
    <footer v-if="activeView === 'chat'" class="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-2">
      
      <!-- Voice Recording Active Indicator -->
      <div v-if="isListening" class="mb-2 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between animate-pulse">
        <span class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span>🎙️ Voice Mode Active: Speak clearly now...</span>
        </span>
        <button @click="stopVoiceInput" class="text-slate-300 hover:text-white underline text-[11px]">Stop Recording</button>
      </div>

      <!-- Input Box Form -->
      <form @submit.prevent="handleSubmit" class="relative flex items-center">
        
        <!-- Microphone / Voice Call Button -->
        <button
          type="button"
          @click="toggleVoiceInput"
          :disabled="isStreaming"
          class="absolute left-3.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          :class="isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'"
          :title="isListening ? 'Stop Voice Recording' : 'Start Voice Calling / Speech Input'"
        >
          <span>🎙️</span>
        </button>

        <input
          v-model="inputQuery"
          type="text"
          :disabled="isStreaming"
          maxlength="2000"
          placeholder="Ask complex queries... (e.g. Check Tokyo weather, NVDA stock, or revenue chart)"
          class="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl pl-14 pr-32 py-4 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-2xl"
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

      <!-- Footer Info -->
      <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 px-2">
        <span>Model: <strong class="text-slate-400 font-mono">{{ selectedModel }}</strong> · Multi-step Agent Loop</span>
        <span>{{ inputQuery.length }} / 2000 chars</span>
      </div>
    </footer>

    <!-- ═══════════════════════════════════════════════
         SETTINGS & API KEY MODAL (WITH DIRECT VALIDATION)
    ═══════════════════════════════════════════════ -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 relative">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">⚙️</span>
            <div>
              <h3 class="text-base font-black text-white">Agent & Gemini API Settings</h3>
              <p class="text-[11px] text-slate-400">Configure your personal Google AI key & target model</p>
            </div>
          </div>
          <button @click="showSettingsModal = false" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div class="space-y-4">
          
          <!-- API Key Input -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-300">Google Gemini API Key</label>
              <button
                @click="showKeyGuideModal = true"
                class="text-[11px] text-blue-400 hover:underline font-bold"
              >
                📖 Need a key? (Step-by-Step Guide)
              </button>
            </div>
            <div class="relative">
              <input
                v-model="tempApiKey"
                :type="showKeyText ? 'text' : 'password'"
                placeholder="AIzaSy..."
                class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none pr-20 font-mono"
              />
              <button
                type="button"
                @click="showKeyText = !showKeyText"
                class="absolute right-3 top-3 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
              >
                {{ showKeyText ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              🔒 Key is saved in your browser storage (<code class="text-cyan-300 font-mono">localStorage</code>) and never written to server disk.
            </p>
          </div>

          <!-- Model Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Target Gemini Model</label>
            <select
              v-model="selectedModel"
              class="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer font-mono"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended · Ultra Low Latency)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Balanced Speed & Cost)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Multi-Step Reasoning)</option>
            </select>
          </div>

          <!-- Validation Message -->
          <div v-if="validationStatus" class="p-3 rounded-xl text-xs font-bold font-mono"
               :class="validationStatus.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'">
            {{ validationStatus.message }}
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
              class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         STEP-BY-STEP GEMINI API KEY GUIDE MODAL
    ═══════════════════════════════════════════════ -->
    <div v-if="showKeyGuideModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        <!-- Guide Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔑</span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">How to Get a Free Google Gemini API Key</h3>
              <p class="text-xs text-slate-400">100% Free · No credit card required · Instant activation</p>
            </div>
          </div>
          <button @click="showKeyGuideModal = false" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <!-- 4 Step Guide Cards -->
        <div class="space-y-3.5">
          
          <!-- Step 1 -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3.5">
            <div class="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div class="space-y-1 flex-1">
              <h4 class="text-xs sm:text-sm font-bold text-white">Open Google AI Studio</h4>
              <p class="text-xs text-slate-400">
                Go to the official Google AI Studio key generator dashboard:
              </p>
              <div class="pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/40 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all"
                >
                  <span>🔗 aistudio.google.com/app/apikey</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3.5">
            <div class="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div class="space-y-1">
              <h4 class="text-xs sm:text-sm font-bold text-white">Sign In & Click "Create API Key"</h4>
              <p class="text-xs text-slate-400">
                Sign in with your Google account. Click the blue button labeled <strong>"Create API Key"</strong> and select <em>"Create API Key in new project"</em>.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3.5">
            <div class="w-7 h-7 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div class="space-y-1">
              <h4 class="text-xs sm:text-sm font-bold text-white">Copy Your Key String</h4>
              <p class="text-xs text-slate-400">
                Copy the newly generated key string (which starts with <code class="text-cyan-300 font-mono font-bold">AIzaSy...</code>).
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3.5">
            <div class="w-7 h-7 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div class="space-y-1">
              <h4 class="text-xs sm:text-sm font-bold text-white">Paste in AgentFlow Studio</h4>
              <p class="text-xs text-slate-400">
                Click <strong>"⚙️ Connect Gemini"</strong> in the top header, paste the key into the input box, and click <strong>"Save Settings"</strong>!
              </p>
            </div>
          </div>

        </div>

        <!-- Free Tier Benefits Info Box -->
        <div class="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1.5">
          <p class="text-xs font-bold text-blue-300 flex items-center gap-1.5">
            <span>🎁</span>
            <span>Google Free Tier Quota Details</span>
          </p>
          <ul class="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Gemini 2.0 Flash:</strong> 15 Requests Per Minute (RPM) & 1,000,000 Tokens/min free.</li>
            <li><strong>Zero Cost:</strong> No payment method or credit card is required.</li>
            <li><strong>Full Privacy:</strong> Key is stored locally in your browser and used only for your sessions.</li>
          </ul>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener"
            class="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Open Google AI Studio</span>
            <span>↗</span>
          </a>
          <button
            @click="showKeyGuideModal = false; showSettingsModal = true"
            class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            I have my Key → Enter Key
          </button>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         TOOLS CATALOG MODAL
    ═══════════════════════════════════════════════ -->
    <div v-if="showToolsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🧰</span>
            <div>
              <h3 class="text-base font-black text-white">Registered Tool Catalog</h3>
              <p class="text-[11px] text-slate-400">5 Schema-validated tools callable by Gemini function calling engine</p>
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
              <div class="flex items-center gap-2">
                <span>{{ tool.icon }}</span>
                <span class="text-xs font-bold text-emerald-400 font-mono">{{ tool.name }}</span>
              </div>
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

const activeView = ref('chat'); // 'chat' | 'playground' | 'pipeline'

const inputQuery = ref('');
const isStreaming = ref(false);
const activeToolName = ref(null);
const messages = ref([]);
const copiedIndex = ref(null);
const speakingIndex = ref(null);
const isListening = ref(false);

const showSettingsModal = ref(false);
const showToolsModal = ref(false);
const showKeyGuideModal = ref(false);
const showKeyText = ref(false);
const validationStatus = ref(null);

const userApiKey = ref('');
const tempApiKey = ref('');
const selectedModel = ref('gemini-2.0-flash');

let abortController = null;
let recognition = null;

const promptSuggestions = [
  {
    title: "Live Weather",
    icon: "🌤️",
    tool: "getLiveWeather",
    prompt: "What is the live weather and temperature in Mumbai today?"
  },
  {
    title: "Market Stock Price",
    icon: "📈",
    tool: "fetchStockPrice",
    prompt: "Fetch the latest market price and 24h change of NVIDIA (NVDA) and Bitcoin."
  },
  {
    title: "Interactive Chart",
    icon: "📊",
    tool: "generate_chart_visualization",
    prompt: "Generate a quarterly performance chart for 2026 product revenues."
  },
  {
    title: "Math Calculation",
    icon: "🧮",
    tool: "calculate_expression",
    prompt: "Calculate 1500 * 86.85 + (2400 / 1.18) with step details."
  }
];

const availableTools = ref([
  {
    name: "getLiveWeather",
    icon: "🌤️",
    description: "Fetches real-time meteorological metrics (temperature, humidity, wind, clouds) for any city.",
    sampleArgs: { city: "Tokyo" }
  },
  {
    name: "fetchStockPrice",
    icon: "📈",
    description: "Retrieves live financial quotes, prices, market capitalization, and daily changes for equities/crypto.",
    sampleArgs: { symbol: "AAPL" }
  },
  {
    name: "generate_chart_visualization",
    icon: "📊",
    description: "Constructs structured chart data points (bar, line, pie) for inline visual display.",
    sampleArgs: { title: "2026 Tech Growth", chartType: "bar", labels: ["Jan", "Apr", "Jul", "Oct"], values: [40000, 65000, 88000, 115000] }
  },
  {
    name: "calculate_expression",
    icon: "🧮",
    description: "Evaluates mathematical expressions and returns exact calculated numeric results.",
    sampleArgs: { expression: "250 * 84.50 + 120" }
  },
  {
    name: "search_web_information",
    icon: "🔍",
    description: "Searches the web for latest research, documentation, and technical knowledge.",
    sampleArgs: { query: "Autonomous AI Agents in 2026" }
  }
]);

// Playground State
const selectedPlaygroundTool = ref(availableTools.value[0]);
const playgroundArgsJson = ref(JSON.stringify(availableTools.value[0].sampleArgs, null, 2));
const playgroundResult = ref(null);
const playgroundLatency = ref(null);
const isExecutingTool = ref(false);

function selectPlaygroundTool(t) {
  selectedPlaygroundTool.value = t;
  playgroundArgsJson.value = JSON.stringify(t.sampleArgs || {}, null, 2);
  playgroundResult.value = null;
  playgroundLatency.value = null;
}

async function executePlaygroundTool() {
  isExecutingTool.value = true;
  playgroundResult.value = null;
  playgroundLatency.value = null;

  try {
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(playgroundArgsJson.value);
    } catch {
      alert('Invalid JSON input in arguments box.');
      isExecutingTool.value = false;
      return;
    }

    const res = await fetch('/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: selectedPlaygroundTool.value.name,
        args: parsedArgs
      })
    });

    const data = await res.json();
    playgroundLatency.value = data.latencyMs || 120;
    playgroundResult.value = data.result || data;
  } catch (err) {
    playgroundResult.value = { error: err.message };
  } finally {
    isExecutingTool.value = false;
  }
}

onMounted(() => {
  const savedKey = localStorage.getItem('agentflow_gemini_key') || '';
  const savedModel = localStorage.getItem('agentflow_gemini_model') || 'gemini-2.0-flash';
  userApiKey.value = savedKey;
  tempApiKey.value = savedKey;
  selectedModel.value = savedModel;

  // Initialize Speech Recognition if supported
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputQuery.value = transcript;
      isListening.value = false;
      handleSubmit();
    };

    recognition.onerror = () => {
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };
  }
});

function toggleVoiceInput() {
  if (!recognition) {
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }
  if (isListening.value) {
    recognition.stop();
    isListening.value = false;
  } else {
    isListening.value = true;
    recognition.start();
  }
}

function stopVoiceInput() {
  if (recognition) {
    recognition.stop();
  }
  isListening.value = false;
}

function toggleSpeak(text, idx) {
  if ('speechSynthesis' in window) {
    if (speakingIndex.value === idx) {
      window.speechSynthesis.cancel();
      speakingIndex.value = null;
      return;
    }
    window.speechSynthesis.cancel();
    speakingIndex.value = idx;
    const cleanText = text.replace(/[*#`_>-]/g, '').slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => { speakingIndex.value = null; };
    utterance.onerror = () => { speakingIndex.value = null; };
    window.speechSynthesis.speak(utterance);
  }
}

function saveSettings() {
  userApiKey.value = tempApiKey.value.trim();
  localStorage.setItem('agentflow_gemini_key', userApiKey.value);
  localStorage.setItem('agentflow_gemini_model', selectedModel.value);
  validationStatus.value = {
    success: true,
    message: userApiKey.value ? '✓ Key saved & connected successfully.' : 'Key cleared. Running in Demo mode.'
  };
  setTimeout(() => {
    showSettingsModal.value = false;
    validationStatus.value = null;
  }, 900);
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
  return text
    .replace(/^### (.*$)/gim, '<strong class="text-sm font-bold text-white block mt-3 mb-1">$1</strong>')
    .replace(/^## (.*$)/gim, '<strong class="text-base font-black text-white block mt-4 mb-2">$1</strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-bold">$1</strong>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-blue-500 pl-3 py-1 my-2 bg-blue-500/5 text-slate-300 text-xs italic">$1</blockquote>')
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

  activeView.value = 'chat';
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
