<div align="right">
  <sup>
    <a href="./README.md">EN</a> &nbsp;|&nbsp; <a href="./README.es.md">ES</a> &nbsp;|&nbsp; <a href="./README.de.md">DE</a> &nbsp;|&nbsp; <a href="./README.ja.md">日本語</a> &nbsp;|&nbsp; <a href="./README.fr.md">FR</a> &nbsp;|&nbsp; <b>中文</b>
  </sup>
</div>

<div align="center">

  <a href="https://docmd.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/docmd-io/docmd/blob/main/packages/ui/assets/images/docmd-logo-dark.png?raw=true" />
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/docmd-io/docmd/blob/main/packages/ui/assets/images/docmd-logo-dark.png?raw=true" />
      <img src="https://github.com/docmd-io/docmd/blob/main/packages/ui/assets/images/docmd-logo-dark.png?raw=true" alt="docmd" width="210" />
    </picture>
  </a>

  <br/>

  <p><b>几秒内从 Markdown 生成生产可用的文档站点。</b><br/>零配置。AI 原生。为开发者打造。</p>

  <p>
    <a href="https://www.npmjs.com/package/@docmd/core"><img src="https://img.shields.io/npm/v/@docmd/core.svg?style=flat-square&color=CB3837" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@docmd/core?activeTab=versions"><img src="https://img.shields.io/npm/dm/@docmd/core.svg?style=flat-square&color=38bd24" alt="每月下载"></a>
    <a href="https://github.com/docmd-io/docmd"><img src="https://img.shields.io/github/stars/docmd-io/docmd?style=flat-square&logo=github" alt="GitHub stars"></a>
    <a href="https://github.com/docmd-io/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/docmd-io/docmd.svg?style=flat-square&color=A31F34" alt="license"></a>
  </p>

  <h4>
    <a href="https://docmd.io">官网</a> &nbsp;·&nbsp;
    <a href="https://docs.docmd.io/zh/">文档</a> &nbsp;·&nbsp;
    <a href="https://live.docmd.io">在线编辑器</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd-skills">Agent Skills</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd/issues">反馈 Bug</a>
  </h4>

  <br/>

  <a href="https://docs.docmd.io/zh/">
    <img width="820" alt="docmd 默认主题 — 浅色与深色模式预览" src="https://raw.githubusercontent.com/docmd-io/docmd/refs/heads/main/assets/docmd-cover.webp" />
  </a>

  <br/><br/>

</div>

## 快速开始

在任何包含 Markdown 文件的目录下直接运行 docmd —— 无需安装：

```bash
npx @docmd/core dev
```

<details>
  <summary><b>在 <code>http://localhost:3000</code> 打开</b></summary><br>

```bash
    _                 _
  _| |___ ___ _____ _| |
 | . | . |  _|     | . |
 |___|___|___|_|_|_|___|

 v0.9.0

BUILD
  Engine          JS
  Source          docs/
  Output          site/
  Versions        2 (06, 05)
  Locales         7 (en, hi, zh, es, de, ja, fr)

DATA INDEXING
  [ DONE ] Syncing git metadata
  [ DONE ] Building search index & RAG embeddings (multi-version)
  [ DONE ] Generating AI Assistant RAG context

PUBLISHING
  [ DONE ] Generated robots.txt
  [ DONE ] Generated .nojekyll (disables Jekyll on GitHub Pages)
  [ DONE ] Generated sitemap
  [ DONE ] Generating LLMs context files (llms.txt)
  [ DONE ] Generating OKF bundles

⬢ Initial build completed in 1.2s.

WATCHING
  Source          ./docs
  Config          ./docmd.config.json
  Assets          ./assets

DEVELOPMENT SERVER RUNNING
  Local Access    http://127.0.0.1:3000
  Network Access  http://192.168.1.6:3000
  Serving from    ./site
```
</details>

<p align="center">
  <img alt="docmd dev 服务器预览" width="820" src="https://docmd.io/assets/images/dev-preview.gif">
</p>

导航由你的目录结构自动生成。无需配置文件、不强制 frontmatter、不必学习框架。

**当准备发布时：**

```bash
npx @docmd/core build
```

这会输出一个高度优化的静态站点（SPA），可直接部署到 Vercel、Cloudflare Pages、Netlify、GitHub Pages 或任何静态主机。

**环境要求：** Node.js 18+

<details>
  <summary><b>或全局安装 / 通过 Docker</b></summary><br/>

```bash
# 通过 npm 全局安装
npm install -g @docmd/core

# 或通过 pnpm
pnpm add -g @docmd/core

# 运行
docmd dev    # 启动开发服务器
docmd build  # 构建用于部署
```

或通过 Docker 运行：

```bash
docker run -p 3000:3000 ghcr.io/docmd-io/docmd:0.9.0
```

> 固定一个版本以获得可复现的构建。

</details>

## 为什么选择 docmd？

| 特性 | docmd | Docusaurus | MkDocs | VitePress | Mintlify |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **需要配置** | **无需** | `docusaurus.config.js` | `mkdocs.yml` | `config.mts` | `docs.json` |
| **JS 体积** | **~18 kb** | ~250 kb | ~40 kb | ~50 kb | ~120 kb |
| **导航** | **即时 SPA** | React SPA | 全量重载 | Vue SPA | 托管 SPA |
| **版本管理** | **原生** | 原生（复杂） | mike 插件 | 手动 | 原生 |
| **i18n** | **原生** | 原生（复杂） | 插件方式 | 原生 | 原生 |
| **多项目** | **原生** | 插件 | 插件 | - | - |
| **搜索** | **内置** | Algolia（云） | 内置 | MiniSearch | 云 |
| **AI 助手** | **内置 (BYOK)** | - | - | - | 内置 (云) |
| **AI 上下文 (`llms.txt`)** | **内置** | - | - | - | 内置 |
| **MCP 服务器** | **内置** | - | - | - | 内置 |
| **Agent Skills** | **内置** | - | - | - | - |
| **Docker 镜像** | **官方** | - | 官方 | - | - |
| **自托管** | **可** | 可 | 可 | 可 | - |
| **费用** | **免费 (OSS)** | 免费 (OSS) | 免费 (OSS) | 免费 (OSS) | Freemium |

## 功能特性

### 零配置，即时启动
把 docmd 指向任意 Markdown 目录，它就会运行。导航会根据你的目录结构自动生成。你可以在不到一分钟的时间内写好第一篇文档并上线 —— 没有模板代码，没有需要配置的构建流程，也不需要提前做技术决策。

### 默认轻量，处处高速
默认的 JavaScript 体积约 25 kb，页面以即时 SPA 的方式切换。输出为静态 HTML —— 已做好 SEO 优化，包含 sitemap、canonical URL 与 Open Graph 元数据。内置离线全文搜索，无需任何云服务。

### AI 原生
docmd 的设计贴合文档在当今被阅读与使用的方式：
- **交互式 AI 助手 (`@docmd/plugin-ai`)** — RAG 驱动的交互式文档小部件，零配置云中继与 BYOK（自带 API 密钥支持 OpenAI、Anthropic、Gemini、DeepSeek、Groq、Ollama），具备严格的域名来源安全校验。
- **MCP 服务器** — `docmd mcp` 通过 stdio 把你的文档暴露给 AI Agent，让它们可以直接搜索、阅读并校验内容。
- **上下文 (`llms.txt` / `llms-full.txt`)** — 在构建时生成完整的文档上下文，可被任何 LLM 立即消费。
- **Agent Skills** — 面向 LLM 与 IDE Agent 的模块化指令集合（[docmd-skills](https://github.com/docmd-io/docmd-skills)）。
- **Open Knowledge Format (OKF)** — 面向 AI 代理的多语言结构化知识包。
- **复制为 Markdown / 复制上下文** — 浏览器内一键按钮，专门为粘贴到 AI 对话中做了优化。

### 为规模化而生
- 通过多语言构建实现国际化
- 支持多个文档版本的版本管理
- 面向 monorepo 与多项目场景的 Workspaces
- 用于扩展核心行为的插件体系
- 完整的 Theming 支持、内置模板、自定义 CSS/JS，以及浅色 / 深色模式

## CLI

```bash
docmd dev            # 本地开发服务器
docmd build          # 构建用于部署
docmd live           # 浏览器端在线编辑器
docmd init           # 在当前目录生成新的 docmd.config.json
docmd stop           # 停止正在运行的 `docmd dev` / `docmd live` 服务器
docmd doctor         # 预检查: 配置 + 插件安装状态
docmd migrate        # 从 Docusaurus / VitePress / MkDocs / Starlight 导入
docmd deploy         # 生成 Docker / NGINX / Caddy / Vercel / Netlify 配置
docmd validate       # 检查全部内部链接
docmd mcp            # 以 MCP 服务器方式在 stdio 上运行
docmd add <name>     # 安装插件或模板
```

## 插件

核心功能由一套稳健的插件系统驱动。基础能力默认已包含，特定需求可加装可选插件。

| 插件 | 状态 | 描述 |
| :--- | :---: | :--- |
| `search` | 核心 | 带模糊匹配的离线全文搜索 |
| `ai` | 核心 | RAG 驱动的交互式 AI 助手，支持 BYOK |
| `seo` | 核心 | SEO 标签与 Open Graph 元数据 |
| `sitemap` | 核心 | 生成 `sitemap.xml` |
| `git` | 核心 | Git 提交历史与最后更新时间 |
| `analytics` | 核心 | 轻量级分析集成 |
| `llms` | 核心 | AI 上下文生成（`llms.txt` / `llms-full.txt`） |
| `mermaid` | 核心 | Mermaid 图表支持 |
| `openapi` | 核心 | 构建期 OpenAPI 3.x 规范渲染器 |
| `okf` | 核心 | 面向 AI 代理的 Open Knowledge Format 包（按语言） |
| `pwa` | 可选 | Progressive Web App —— 离线导航 |
| `threads` | 可选 | 内联讨论串 *(by @svallory)* |
| `math` | 可选 | KaTeX / LaTeX 数学公式渲染 |

安装可选插件：

```bash
docmd add <plugin-name>
```

开发你自己的插件：[插件开发指南](https://docs.docmd.io/zh/development/building-plugins/)

## 配置

上手无需任何配置。仅在需要更多控制时，在项目根目录添加 `docmd.config.json`（或 `.ts` / `.js`）：

```json
{
  "title": "我的项目",
  "url": "https://docs.myproject.com",
  "src": "./docs",
  "out": "./dist"
}
```

TypeScript 与 JavaScript 格式的配置文件支持动态值。

完整参考：[配置概览](https://docs.docmd.io/zh/configuration/overview)

## 项目结构

```text
my-docs/
├── docs/                ← 你的 Markdown 文件
├── assets/              ← 图片与静态资源
├── docmd.config.json    ← 可选配置
└── package.json
```

## 在线编辑器

基于浏览器的编辑器，所见即所得地撰写并预览文档 —— 无需任何本地配置。

<p>
  <img alt="docmd 在线编辑器预览" width="820" src="https://docs.docmd.io/assets/previews/live-editor-preview.webp">
</p>

**前往 [live.docmd.io](https://live.docmd.io) 体验**

## 编程式 API

在 Node.js 脚本、CI 流水线或自定义构建步骤中使用 docmd。（同时支持 CommonJS 与 ESM。）

```javascript
import { build } from '@docmd/core';

await build('./docmd.config.json', { isDev: false });
```

完整参考：[Node API](https://docs.docmd.io/zh/development/node-api-reference/)

## 社区

- **Bug 与问题** → [GitHub Issues](https://github.com/docmd-io/docmd/issues)
- **问题与想法** → [Discussions](https://github.com/orgs/docmd-io/discussions)
- **参与贡献** → [CONTRIBUTING.md](.github/CONTRIBUTING.md)
- **路线图** → [GitHub Discussions](https://github.com/orgs/docmd-io/discussions/2)

## 支持我们

- 让更多人知道 docmd 是支持其开发最直接的方式 —— 在 X 上 [分享给你的朋友](https://twitter.com/intent/tweet?url=https://github.com/docmd-io/docmd&text=docmd%20-%20几秒内从%20Markdown%20生成生产可用的文档站点。)，或点个 Star。
- 如果 docmd 节省了你的时间，[GitHub Sponsorship](https://github.com/sponsors/mgks) 是巨大的鼓励。
- 有想法或发现 Bug？欢迎提 Issue 或 PR，欢迎贡献你自己的插件。

## 许可

MIT —— 详见 [`LICENSE`](./LICENSE)。