# ⚡ AgentFlow — Autonomous AI Agent Starter Kit (Node.js + Vue 3)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-emerald.svg)](https://vuejs.org/)

An enterprise-ready, open-source starter kit for building **Autonomous Multi-Step AI Agents** with schema-validated **Tool Calling**, real-time **Server-Sent Events (SSE) streaming**, and a reactive **Vue 3** frontend.

Built with ❤️ by **[Santosh Gautam](https://www.hisantosh.com/)**.
- Portfolio: [hisantosh.com](https://www.hisantosh.com/)
- GitHub: [@Santosh-gautam](https://github.com/Santosh-gautam)

---

## 🚀 Key Features

- **Autonomous ReAct Agent Loop**: Evaluates user prompts, selects tools, inspects outputs, and reasons iteratively until task completion.
- **Server-Sent Events (SSE)**: Streams token deltas and tool execution state in real-time.
- **JSON Schema Tool Registry**: Add custom tools (e.g. SQL queries, scrapers, APIs) with strict runtime input validation.
- **Free Google Gemini API Support**: Uses Gemini 2.0 / 1.5 Flash (100% free tier, zero credit card required).
- **Mock Demo Mode**: Runs locally out-of-the-box even without an API key!
- **Modern Vue 3 + Tailwind CSS UI**: Live typing indicator, expandable tool outputs, and responsive dark mode design.

---

## 📁 Architecture Overview

```
agentflow-starter-kit/
├── server/                 # Express + SSE Agent Orchestrator
│   ├── tools/              # Schema-validated tools (Calculator, WebSearch, DB)
│   │   ├── calculator.js
│   │   ├── webSearch.js
│   │   └── index.js
│   ├── index.js            # Agent execution loop & SSE endpoint
│   └── package.json
├── client/                 # Vue 3 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── App.vue         # Reactive Chat Interface with Tool Badges
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start (2 Minutes)

### 1. Clone the repository
```bash
git clone https://github.com/Santosh-gautam/agentflow-ai-agent-starter-kit.git
cd agentflow-ai-agent-starter-kit
```

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
*(Optional: Add your free Gemini API key in `server/.env` from [Google AI Studio](https://aistudio.google.com/))*.

### 3. Setup Client (In a new terminal)
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## 🛠️ Adding Custom Tools

To add a new tool, define its JSON Schema and async execution function in `server/tools/`:

```javascript
// server/tools/myCustomTool.js
export const myTool = {
  declaration: {
    name: "fetch_customer_orders",
    description: "Fetches recent customer orders by email address.",
    parameters: {
      type: "OBJECT",
      properties: {
        email: { type: "STRING", description: "Customer email address" }
      },
      required: ["email"]
    }
  },
  async execute({ email }) {
    // Query database or third-party API safely
    return { email, ordersCount: 4, recentOrderTotal: "$120.00" };
  }
};
```

Export it in `server/tools/index.js`, and the agent will automatically discover and invoke it when needed!

---

## 📄 License

This project is licensed under the **MIT License** — free to use in personal, open-source, and commercial projects.
