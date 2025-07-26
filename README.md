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

### Prerequisites

- Node.js v18+ and npm/yarn
- Python 3.11+
- Qdrant database (cloud or local)
- Git

### Environment Variables

> Backend Configuration

```bash
cp beetle_backend/env.example beetle_backend/.env
```

> Frontend Configuration

```bash
cp beetle_frontend/env.example beetle_frontend/.env
```

> **Note**: Replace all placeholder values (starting with `your_`) with your actual configuration values.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RAWx18/Beetle.git
   cd Beetle
   ```

2. **Setup Python Backend**
   ```bash
   cd beetle_backend
   python -m venv venv
   source venv/bin/activate  # On Linux/Mac
   .\venv\Scripts\activate # On Windows
   pip install -r requirements.txt
   ```

3. **Setup JavaScript Backend**
   ```bash
   cd beetle_backend
   npm install
   ```

4. **Setup Frontend**
   ```bash
   cd beetle_frontend
   npm install
   ```

### Running the Application

1. **Start Python Backend** (in first terminal)
   ```bash
   cd beetle_backend
   source venv/bin/activate  # On Linux/Mac
   .\venv\Scripts\activate # On Windows
   cd src/ai
   uvicorn fastapi_server:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start JavaScript Backend** (in second terminal)
   ```bash
   cd beetle_backend
   ./setup.bat # On windows
   ./setup.sh # On linux
   ./setup.js # On Mac
   ```

3. **Start Frontend** (in third terminal)
   ```bash
   cd beetle_frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
  
### Static Demo

[Deployed on Vercel](https://beetle-demo.vercel.app/)

## 🛣️ Roadmap

<img src="beetle_frontend/public/mascott/mascott_1.png" width="200" height="200" align="right" alt="Roadmap Beetle">

### 🚀 **Q3 2025 - Intelligence Enhancement**
- ✅ ~~Structure Idea~~
- ✅ ~~UI Designed~~
- ✅ ~~Static Demo Implemented~~
- ✅ ~~Backend with Github Integrated~~
- ⏳ AI RAG integration
- ⏳ Security Enhancement & Rate Limit Optimization

[📋 **View Full Roadmap**](https://beetle-github.vercel.app/)

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
<img src="https://readme-contribs.as93.net/contributors/RAWx18/beetle?avatarSize=50&perRow=5&shape=circle&title=Our+Awesome+Contributors&fontSize=14&textColor=ffffff&backgroundColor=000000&outerBorderWidth=2&outerBorderRadius=8&hideLabel=true" alt="Contributors"/>
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
