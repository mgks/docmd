<div align="right">
  <sup>
    <a href="./README.md">EN</a> &nbsp;|&nbsp; <a href="./README.es.md">ES</a> &nbsp;|&nbsp; <a href="./README.de.md">DE</a> &nbsp;|&nbsp; <b>日本語</b> &nbsp;|&nbsp; <a href="./README.fr.md">FR</a> &nbsp;|&nbsp; <a href="./README.zh.md">中文</a>
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

  <p><b>Markdown から数秒でプロダクション品質のドキュメントを。</b><br/>Zero config。AI ネイティブ。開発者のために。</p>

  <p>
    <a href="https://www.npmjs.com/package/@docmd/core"><img src="https://img.shields.io/npm/v/@docmd/core.svg?style=flat-square&color=CB3837" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@docmd/core?activeTab=versions"><img src="https://img.shields.io/npm/dm/@docmd/core.svg?style=flat-square&color=38bd24" alt="monthly downloads"></a>
    <a href="https://github.com/docmd-io/docmd"><img src="https://img.shields.io/github/stars/docmd-io/docmd?style=flat-square&logo=github" alt="GitHub stars"></a>
    <a href="https://github.com/docmd-io/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/docmd-io/docmd.svg?style=flat-square&color=A31F34" alt="license"></a>
  </p>

  <h4>
    <a href="https://docmd.io">ウェブサイト</a> &nbsp;·&nbsp;
    <a href="https://docs.docmd.io">ドキュメント</a> &nbsp;·&nbsp;
    <a href="https://live.docmd.io">ライブエディタ</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd-skills">Agent Skills</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd/issues">バグ報告</a>
  </h4>

  <br/>

  <a href="https://docs.docmd.io">
    <img width="820" alt="docmd デフォルトテーマ — ライト/ダークモードのプレビュー" src="https://raw.githubusercontent.com/docmd-io/docmd/refs/heads/main/assets/docmd-cover.webp" />
  </a>

  <br/><br/>

</div>

## クイックスタート

Markdown ファイルがある任意のフォルダで docmd を実行 — インストール不要：

```bash
npx @docmd/core dev
```

<details>
  <summary><b><code>http://localhost:3000</code> で開きます</b></summary><br>

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
  <img alt="docmd dev サーバーのプレビュー" width="820" src="https://docmd.io/assets/images/dev-preview.gif">
</p>

ナビゲーションはファイル構造から自動生成されます。設定ファイル不要、frontmatter 必須なし、学ぶべきフレームワークもありません。

**公開の準備ができたら：**

```bash
npx @docmd/core build
```

これは Vercel、Cloudflare Pages、Netlify、GitHub Pages、その他の静的ホストにデプロイ可能な、高度に最適化された静的サイト（SPA）を出力します。

**要件：** Node.js 18+

<details>
  <summary><b>またはグローバルインストール / Docker 経由</b></summary><br/>

```bash
# npm でグローバルインストール
npm install -g @docmd/core

# または pnpm
pnpm add -g @docmd/core

# 実行
docmd dev    # dev サーバーを起動
docmd build  # デプロイ用にビルド
```

または Docker 経由：

```bash
docker run -p 3000:3000 ghcr.io/docmd-io/docmd:0.9.0
```

> 再現可能なビルドのためにバージョンを固定してください。

</details>

## なぜ docmd？

| 機能 | docmd | Docusaurus | MkDocs | VitePress | Mintlify |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **設定が必要** | **なし** | `docusaurus.config.js` | `mkdocs.yml` | `config.mts` | `docs.json` |
| **JS ペイロード** | **~18 kb** | ~250 kb | ~40 kb | ~50 kb | ~120 kb |
| **ナビゲーション** | **即時 SPA** | React SPA | フルリロード | Vue SPA | ホスト型 SPA |
| **バージョン管理** | **ネイティブ** | ネイティブ（複雑） | mike プラグイン | 手動 | ネイティブ |
| **i18n** | **ネイティブ** | ネイティブ（複雑） | プラグインベース | ネイティブ | ネイティブ |
| **マルチプロジェクト** | **ネイティブ** | プラグイン | プラグイン | - | - |
| **検索** | **組み込み** | Algolia（クラウド） | 組み込み | MiniSearch | クラウド |
| **AI コンテキスト (`llms.txt`)** | **組み込み** | - | - | - | 組み込み |
| **MCP サーバー** | **組み込み** | - | - | - | 組み込み |
| **Agent Skills** | **組み込み** | - | - | - | - |
| **Docker イメージ** | **公式** | - | 公式 | - | - |
| **セルフホスト** | **可** | 可 | 可 | 可 | - |
| **コスト** | **無料 (OSS)** | 無料 (OSS) | 無料 (OSS) | 無料 (OSS) | フリーミアム |

## 機能

### Zero config、即時スタート
任意の Markdown フォルダを docmd に指定するだけで実行できます。ナビゲーションはファイル構造から自動生成されます。最初のドキュメントを書いて 1 分以内に公開可能 — ボイラープレートなし、ビルドパイプラインの設定なし、事前の意思決定は不要です。

### 標準で軽量、どこでも高速
デフォルトの JavaScript ペイロードは ~18 kb。ページは即時 SPA としてナビゲートします。出力は静的 HTML — SEO 最適化済み、sitemap、正規 URL、Open Graph メタデータを含む。オフラインの全文検索を内蔵、クラウドサービス不要。

### AI ネイティブ
docmd は今ドキのドキュメントの読み方・使われ方に合わせて構築されています：
- **MCP サーバー** — `docmd mcp` がドキュメントを stdio 経由で AI Agent に公開し、検索・読み取り・検証を直接行えます。
- **コンテキスト (`llms.txt` / `llms-full.txt`)** — ビルド時に生成される完全なドキュメントコンテキスト、あらゆる LLM で即利用可能。
- **Agent Skills** — LLM と IDE Agent 向けのモジュール式インストラクショセット ([docmd-skills](https://github.com/docmd-io/docmd-skills))。
- **Markdown としてコピー / コンテキストをコピー** — ブラウザ内のワンクリックボタン。AI チャットへの貼り付けに最適化。

### スケールを見据えて構築
- マルチロケールビルドによる国際化
- 複数ドキュメントリリースに対応するバージョン管理
- モノレポ・マルチプロジェクト構成向け Workspaces
- コア機能を拡張するプラグインシステム
- 完全なテーマ対応、ビルトインテンプレート、カスタム CSS/JS、ライト/ダークモード

## CLI

```bash
docmd dev            # ローカル dev サーバー
docmd build          # デプロイ用ビルド
docmd live           # ブラウザベースのライブエディタ
docmd init           # 現在のディレクトリに新しい docmd.config.json を作成
docmd stop           # 実行中の `docmd dev` / `docmd live` サーバーを停止
docmd doctor         # 事前チェック: 設定 + プラグインのインストール状況
docmd migrate        # Docusaurus / VitePress / MkDocs / Starlight から取り込み
docmd deploy         # Docker / NGINX / Caddy / Vercel / Netlify 用設定を生成
docmd validate       # 内部リンクを全てチェック
docmd mcp            # stdio 上で MCP サーバーとして動作
docmd add <name>     # プラグインまたはテンプレートをインストール
```

## プラグイン

コア機能は堅牢なプラグインシステムによって支えられています。必須機能は標準で含まれており、特定のニーズに応じてオプショナルプラグインを追加できます。

| プラグイン | ステータス | 説明 |
| :--- | :---: | :--- |
| `search` | コア | あいまい一致対応のオフライン全文検索 |
| `seo` | コア | SEO タグと Open Graph メタデータ |
| `sitemap` | コア | `sitemap.xml` を生成 |
| `git` | コア | Git のコミット履歴と最終更新日 |
| `analytics` | コア | 軽量なアナリティクス連携 |
| `llms` | コア | AI コンテキスト生成 (`llms.txt` / `llms-full.txt`) |
| `mermaid` | コア | Mermaid 図対応 |
| `openapi` | コア | ビルド時の OpenAPI 3.x スペックレンダラー |
| `okf` | Core | AI エージェント向け Open Knowledge Format バンドル (ロケール別) |
| `pwa` | オプション | Progressive Web App — オフラインナビゲーション |
| `threads` | オプション | インラインディスカッションスレッド *(by @svallory)* |
| `math` | オプション | KaTeX / LaTeX 数式レンダリング |

オプショナルプラグインのインストール：

```bash
docmd add <plugin-name>
```

自作：[プラグイン開発ガイド](https://docs.docmd.io/development/building-plugins/)

## 設定

始めるのに設定は不要です。プロジェクトルートに `docmd.config.json`（または `.ts` / `.js`）を追加するのは、より詳細な制御が必要な場合のみです：

```json
{
  "title": "マイプロジェクト",
  "url": "https://docs.myproject.com",
  "src": "./docs",
  "out": "./dist"
}
```

TypeScript / JavaScript 形式の設定ファイルは動的な値の指定に対応しています。

リファレンス全体：[設定概要](https://docs.docmd.io/configuration/overview)

## プロジェクト構成

```text
my-docs/
├── docs/                ← あなたの Markdown ファイル
├── assets/              ← 画像と静的ファイル
├── docmd.config.json    ← 任意の設定
└── package.json
```

## ライブエディタ

ブラウザベースのエディタでドキュメントを執筆・プレビュー — ローカル環境構築は不要。

<p>
  <img alt="docmd ライブエディタのプレビュー" width="820" src="https://docs.docmd.io/assets/previews/live-editor-preview.webp">
</p>

**[live.docmd.io](https://live.docmd.io) で試す**

## プログラマティック API

Node.js スクリプト、CI パイプライン、カスタムビルドステップで docmd を利用できます。（CommonJS / ESM の両対応。）

```javascript
import { build } from '@docmd/core';

await build('./docmd.config.json', { isDev: false });
```

リファレンス全体：[Node API](https://docs.docmd.io/development/node-api-reference/)

## コミュニティ

- **バグ報告・問題** → [GitHub Issues](https://github.com/docmd-io/docmd/issues)
- **質問・アイデア** → [Discussions](https://github.com/orgs/docmd-io/discussions)
- **コントリビューション** → [CONTRIBUTING.md](.github/CONTRIBUTING.md)
- **ロードマップ** → [GitHub Discussions](https://github.com/orgs/docmd-io/discussions/2)

## サポート

- docmd の開発を最も直接的に支援する方法は、周りの人に知らせることです。X で [シェア](https://twitter.com/intent/tweet?url=https://github.com/docmd-io/docmd&text=docmd%20-%20Markdown%20から%20数秒で%20プロダクション品質の%20ドキュメントを。) したり、スターを付けるのも良いでしょう。
- docmd があなたの時間を節約できているなら、[GitHub Sponsorship](https://github.com/sponsors/mgks) は大きな励みになります。
- アイデアやバグがあれば Issue や PR をお気軽に。プラグインのコントリビューションも歓迎します。

## ライセンス

MIT — 詳細は [`LICENSE`](./LICENSE) を参照。