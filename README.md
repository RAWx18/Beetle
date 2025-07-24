<div align="center">

![Beetle Logo](beetle_frontend/public/favicon.png)

**The Next-Generation Git Collaboration Platform**

*Transforming Open Source Development with AI-Powered Branch Intelligence*

[![OpenSource License](https://img.shields.io/badge/License-Apache%20License-orange.svg?style=for-the-badge)](LICENSE.md)
[![Contributors](https://img.shields.io/github/contributors/RAWx18/Beetle.svg?style=for-the-badge&logo=git)](https://github.com/RAWx18/Beetle/graphs/contributors)
[![Under Development](https://img.shields.io/badge/Status-Under%20Development-yellow.svg?style=for-the-badge)](#)
[![Join Discord](https://img.shields.io/badge/Join%20us%20on-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/FkrWfGtZn3)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/10871/badge)](https://www.bestpractices.dev/projects/10871)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/RAWx18/Beetle/badge)](https://scorecard.dev/viewer/?uri=github.com/RAWx18/Beetle)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Ffossas%2Ffossa-cli.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Ffossas%2Ffossa-cli?ref=badge_shield)

[🚀 **Try Demo**](https://beetle-demo.vercel.app/) • [📖 **Documentation**](https://github.com/RAWx18/Beetle/README.md) • [💬 **Join Community**](https://discord.gg/FkrWfGtZn3)

</div>

---

<div align="center">
  <h3>Security & Open Source Badge</h3>

  <a href="https://www.bestpractices.dev/projects/10871" style="margin-right: 30px;">
    <img src="https://openssf.org/wp-content/uploads/2024/03/bestpracticesbadge.svg" width="120" alt="OpenSSF Best Practices"/>
  </a>

  <a href="https://github.com/marketplace/actions/ossf-scorecard-action" style="margin-left: 30px;">
    <img src="https://openssf.org/wp-content/uploads/2024/03/openssf_security_scorecards.png" width="60" alt="OSSF Scorecard Action"/>
  </a>
</div>



---

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ and npm/yarn
- Python 3.9+
- Qdrant database (cloud or local)
- Git

### Environment Variables

### Backend Configuration

#### Required Environment Variables

Create a `.env` file in the `beetle_backend` directory with the following variables:

```env
# ========================
# Server Configuration
# ========================
PORT=3001
NODE_ENV=development

# ========================
# Database Configuration
# ========================
# Local JSON storage path
DB_PATH=./data/beetle_db.json

# ========================
# Qdrant Vector Database
# ========================
QDRANT_URL=https://your-qdrant-instance:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_PORT=6333

# ========================
# Authentication
# ========================
# JWT Settings
JWT_SECRET=generate_a_secure_random_string
JWT_EXPIRES_IN=7d

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# ========================
# Security
# ========================
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001

# ========================
# Rate Limiting
# ========================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window

# ========================
# AI Configuration
# ========================
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Cache Settings
CACHE_TTL=3600  # 1 hour

# ========================
# AI Pipeline Settings
# ========================
# Document Processing
AI_MAX_DOCUMENTS=1000
AI_BATCH_SIZE=32
AI_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
AI_CHAT_MODEL=gemini-2.0-flash

# Web Scraping
AI_MAX_PAGES=10
AI_MAX_DEPTH=2
AI_SCRAPER_TIMEOUT=30000  # 30 seconds

# Content Formatting
AI_MIN_CONTENT_LENGTH=50
AI_MAX_CONTENT_LENGTH=100000
AI_REMOVE_HTML=true
AI_DETECT_LANGUAGE=true
AI_GENERATE_SUMMARY=true

# Vector Database
AI_COLLECTION_NAME=documents

# Search Configuration
AI_USE_HYBRID_SEARCH=true
AI_KEYWORD_WEIGHT=0.3
AI_VECTOR_WEIGHT=0.7

# Context Management
AI_MAX_CONTEXT_LENGTH=4000
AI_MAX_SOURCES=5
AI_INCLUDE_CITATIONS=true
AI_INCLUDE_CONFIDENCE=true

# Response Generation
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_TOP_P=0.9
AI_TOP_K=40

# ========================
# Service Integration
# ========================
# Python Backend URL
PYTHON_SERVER=http://localhost:8000
```

> **Note**: Replace all placeholder values (starting with `your_`) with your actual configuration values.

#### Frontend - `.env.local` in `beetle_frontend/`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Beetle.git
   cd Beetle
   ```

2. **Setup Python Backend**
   ```bash
   # Navigate to backend directory
   cd beetle_backend
   
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Setup JavaScript Backend**
   ```bash
   # Navigate to backend directory
   cd beetle_backend
   
   # Install dependencies
   npm install
   
   # Copy .env.example to .env and update values
   cp .env.example .env
   ```

4. **Setup Frontend**
   ```bash
   # Navigate to frontend directory
   cd ../beetle_frontend
   
   # Install dependencies
   npm install
   
   # Copy .env.local.example to .env.local and update values
   cp .env.local.example .env.local
   ```

### Running the Application

1. **Start Python Backend** (in a new terminal)
   ```bash
   cd beetle_backend
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   uvicorn fastapi_server:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start JavaScript Backend** (in a new terminal)
   ```bash
   cd beetle_backend
   ./setup.bat # On windows
   ./setup.sh # On linux
   ```

3. **Start Frontend** (in a new terminal)
   ```bash
   cd beetle_frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:3001/api-docs

## 🌟 What is Beetle?

<img src="beetle_frontend/public/mascott/mascott_4.png" width="200" height="200" align="right" alt="Beetle Mascot">

**Beetle** revolutionizes Git-based collaboration by introducing **Branch-Level Intelligence** — a paradigm shift that transforms how teams plan, develop, and contribute to open-source projects. Unlike traditional project management tools, Beetle understands your codebase at the branch level, providing contextual AI assistance, intelligent contribution tracking, and seamless workflow orchestration.

Our friendly mascot here represents the core philosophy of Beetle: small, efficient, but incredibly powerful when working together in a team!

Cursor wrapped VS Code. Hugging Face wrapped Git. Now, GitHub Wrapper is here — ready to revolutionize the open source world like never before.

---

# ⚡ Key Features

<div align="center">

### 🧠 **AI-Powered Intelligence**
```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Contextual Code Assistant                               │
│  📝 Smart PR Summaries                                      │
│  🎯 Intelligent Issue Triage                                │
│  👀 Code Review Assistance                                  │
│  💡 Suggestions on which issues to work                     │
│  🎪 Which project best to contribute to and all             │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 **Easy Workflow Management**
```
┌─────────────────────────────────────────────────────────────┐
│  🌿 Branch-Specific Planning                                │
│  🤝 Help opensource contributors know what's important      │
│  🔄 Automated Status Tracking                               │
│  📋 Custom Workflow Templates                               │
└─────────────────────────────────────────────────────────────┘
```

### 📊 **Analytics & Insights**
```
┌─────────────────────────────────────────────────────────────┐
│  🔥 Contribution Heatmaps                                   │
│  ⚡ Velocity Tracking                                        │
│  👥 See who's working on which issue/PR                     │
│  📈 Team Performance Dashboards                             │
│  🎯 Showcase skills & avoid conflicts                       │
└─────────────────────────────────────────────────────────────┘
```

### 🌐 **Enterprise Integration**
```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Multi-Platform Support (GitHub, GitLab, Bitbucket)      │
│  🔐 SSO Authentication                                      │
│  🤖 Multi Agent FAQ agent integrated                        │
│  ⚡ Webhook Automation                                       │
└─────────────────────────────────────────────────────────────┘
```

</div>

---

<div align="center">

## 🚀 **Why Choose Our Platform?**

| 🎯 **Smart** | 🚀 **Fast** | 🤝 **Collaborative** | 🔒 **Secure** |
|:---:|:---:|:---:|:---:|
| AI-driven insights | Lightning fast responses | Team-first approach | Enterprise-grade security |
| Contextual recommendations | Real-time updates | Conflict-free workflows | SSO & compliance ready |

</div>

---

## 🚀 Quick Start

<div align="center">
<img src="beetle_frontend/public/mascott/mascott_2.png" width="200" height="200" alt="Docker Beetle">
</div>

### Installation

```bash
# Clone the repository
git clone https://github.com/RAWx18/beetle.git

# Navigate to project directory
cd beetle
```

```bash
# Setup backend and run backend server as per README.md in backend
cd beetle_backend/
```

```bash
# Setup frontend and run frontend server as per README.md in frontend
cd beetle_frontend/
```

### Static Demo

[Deployed on Vercel](https://beetle-demo.vercel.app/)

<!-- ---

## 📚 Documentation

<table>
<tr>
<td align="center" width="20%">

### 🏁 **Getting Started**
[Quick Start Guide](https://docs.beetle.dev/quick-start)<br>
[Installation Guide](https://docs.beetle.dev/installation)<br>
[Configuration](https://docs.beetle.dev/configuration)

</td>
<td align="center" width="20%">
<img src="path/to/mascot6.png" width="80" height="80" alt="Docs Beetle">
</td>
<td align="center" width="20%">

### 🔧 **API Reference**
[REST API](https://docs.beetle.dev/api/rest)<br>
[GraphQL API](https://docs.beetle.dev/api/graphql)<br>
[Webhooks](https://docs.beetle.dev/api/webhooks)

</td>
<td align="center" width="20%">

### 🧩 **Integrations**
[GitHub Integration](https://docs.beetle.dev/integrations/github)<br>
[Slack Integration](https://docs.beetle.dev/integrations/slack)<br>
[Custom Plugins](https://docs.beetle.dev/integrations/plugins)

</td>
<td align="center" width="20%">

### 🎓 **Tutorials**
[Team Setup](https://docs.beetle.dev/tutorials/team-setup)<br>
[Workflow Design](https://docs.beetle.dev/tutorials/workflows)<br>
[Best Practices](https://docs.beetle.dev/tutorials/best-practices)

</td>
</tr>
</table> -->

<!-- ---

## 🎬 Demo

<div align="center">

<img src="path/to/mascot7.png" width="150" height="150" alt="Demo Beetle">

### 📱 **Interactive Demo**
[🚀 **Launch Interactive Demo**](https://demo.beetle.dev)

### 🎥 **Video Walkthrough**
[![Beetle Demo Video](https://img.youtube.com/vi/your-video-id/maxresdefault.jpg)](https://www.youtube.com/watch?v=your-video-id)

</div>

--- -->

## 🛣️ Roadmap

<img src="beetle_frontend/public/mascott/mascott_1.png" width="200" height="200" align="right" alt="Roadmap Beetle">

### 🚀 **Q3 2025 - Intelligence Enhancement**
- ✅ ~~Structure Idea~~
- ✅ ~~UI Designed~~
- ✅ ~~Static Demo Implemented~~
- 🔄 Backend with Github Integrated
- ⏳ AI integration

[📋 **View Full Roadmap**](https://github.com/RAWx18/Beetle/wiki)

---

## 🤝 Contributing

<img src="beetle_frontend/public/mascott/mascott_3.png" width="200" height="200" align="right" alt="Contributing Beetle">

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contributing Steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Our mascot is excited to see what amazing contributions you'll bring to the Beetle community!

<p align="center">
<img src="https://readme-contribs.as93.net/contributors/RAWx18/beetle?avatarSize=100&perRow=5&shape=circle&title=Our+Awesome+Contributors&fontSize=14&textColor=ffffff&backgroundColor=000000&outerBorderWidth=2&outerBorderColor=ffcc00&outerBorderRadius=8&hideLabel=true" alt="Contributors"/>
</p>

---

## 🌍 Community & Support

<div align="center">

[![Join Discord](https://img.shields.io/badge/Join%20us%20on-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/FkrWfGtZn3)

### 📞 **Support Channels**

| Channel                                                         | Typical Response Time | Best For                                             |
| --------------------------------------------------------------- | --------------------- | ---------------------------------------------------- |
| 🎮 [Discord](https://discord.gg/FkrWfGtZn3)                     | Real-time             | Quick questions, community discussions               |
| 📧 [Email Support](mailto:rawx18.dev@gmail.com)                 | 24–48 hours           | Technical issues, detailed bug reports               |
| 🐦 [Twitter / X](https://x.com/RAWx18_dev)                      | Online                | Tagging the project, general updates, public reports |
| 🐛 [GitHub Issues](https://github.com/beetle-dev/beetle/issues) | 1–3 days              | Bug reports, feature requests, feedback              |

</div>

---

## 📊 Project Statistics

<div align="center">

| Metric | Value |
|--------|-------|
| 📝 **Total Commits** | ![Commits](https://img.shields.io/github/commit-activity/t/RAWx18/beetle) |
| 🔀 **Pull Requests** | ![PRs](https://img.shields.io/github/issues-pr/RAWx18/beetle) |
| 🐛 **Issues Resolved** | ![Issues](https://img.shields.io/github/issues-closed/RAWx18/beetle) |
| 📦 **Latest Release** | ![Release](https://img.shields.io/github/v/release/RAWx18/beetle) |

</div>

---

## 📜 License

This project is licensed under the Non-Commercial Use License - see the [LICENSE.md](LICENSE.md) file for details.

---

## 🙏 Acknowledgments

- All our contributors and community members
- Open source libraries that made this possible
- Beta testers and early adopters

---

## 🌟 Star Graph: Project Beetle

<div align="center"> <img src="https://starchart.cc/RAWx18/beetle.svg" alt="Star Graph for Project Beetle" width="600"/> <br/> <sub>✨ GitHub star history of <strong><a href="https://github.com/RAWx18/beetle" target="_blank">RAWx18/beetle</a></strong></sub> </div>

---

<br></br>

<div align="center">

**Made with ❤️ by the Beetle Team**

*Transforming the future of collaborative development, one commit at a time.*

</div>
