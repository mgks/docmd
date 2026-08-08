<div align="right">
  <sup>
    <a href="./README.md">EN</a> &nbsp;|&nbsp; <a href="./README.es.md">ES</a> &nbsp;|&nbsp; <a href="./README.de.md">DE</a> &nbsp;|&nbsp; <a href="./README.ja.md">日本語</a> &nbsp;|&nbsp; <b>FR</b> &nbsp;|&nbsp; <a href="./README.zh.md">中文</a>
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

  <p><b>Documentation prête pour la production à partir de Markdown, en quelques secondes.</b><br/>Zero config. Native IA. Conçu pour les développeurs.</p>

  <p>
    <a href="https://www.npmjs.com/package/@docmd/core"><img src="https://img.shields.io/npm/v/@docmd/core.svg?style=flat-square&color=CB3837" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@docmd/core?activeTab=versions"><img src="https://img.shields.io/npm/dm/@docmd/core.svg?style=flat-square&color=38bd24" alt="téléchargements mensuels"></a>
    <a href="https://github.com/docmd-io/docmd"><img src="https://img.shields.io/github/stars/docmd-io/docmd?style=flat-square&logo=github" alt="étoiles GitHub"></a>
    <a href="https://github.com/docmd-io/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/docmd-io/docmd.svg?style=flat-square&color=A31F34" alt="licence"></a>
  </p>

  <h4>
    <a href="https://docmd.io">Site web</a> &nbsp;·&nbsp;
    <a href="https://docs.docmd.io">Documentation</a> &nbsp;·&nbsp;
    <a href="https://live.docmd.io">Éditeur en direct</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd-skills">Agent Skills</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd/issues">Signaler un bug</a>
  </h4>

  <br/>

  <a href="https://docs.docmd.io">
    <img width="820" alt="docmd thème par défaut — aperçu en mode clair et sombre" src="https://raw.githubusercontent.com/docmd-io/docmd/refs/heads/main/assets/docmd-cover.webp" />
  </a>

  <br/><br/>

</div>

## Démarrage rapide

Lancez docmd dans n'importe quel dossier contenant des fichiers Markdown — aucune installation requise :

```bash
npx @docmd/core dev
```

<details>
  <summary><b>Ouvre sur <code>http://localhost:3000</code></b></summary><br>

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
  <img alt="aperçu du serveur de développement docmd" width="820" src="https://docmd.io/assets/images/dev-preview.gif">
</p>

La navigation est générée à partir de votre structure de fichiers. Pas de fichier de configuration, pas de frontmatter obligatoire, pas de framework à apprendre.

**Quand vous êtes prêt à publier :**

```bash
npx @docmd/core build
```

Cela produit un site statique (SPA) hautement optimisé, prêt à être déployé sur Vercel, Cloudflare Pages, Netlify, GitHub Pages, ou n'importe quel hébergeur statique.

**Prérequis :** Node.js 18+

<details>
  <summary><b>Ou installer globalement / via Docker</b></summary><br/>

```bash
# Installer globalement via npm
npm install -g @docmd/core

# Ou via pnpm
pnpm add -g @docmd/core

# Lancer
docmd dev    # démarrer le serveur de développement
docmd build  # construire pour le déploiement
```

Ou via Docker :

```bash
docker run -p 3000:3000 ghcr.io/docmd-io/docmd:0.9.0
```

> Épinglez une version pour des builds reproductibles.

</details>

## Pourquoi docmd ?

| Fonctionnalité | docmd | Docusaurus | MkDocs | VitePress | Mintlify |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Configuration requise** | **Aucune** | `docusaurus.config.js` | `mkdocs.yml` | `config.mts` | `docs.json` |
| **Payload JS** | **~18 ko** | ~250 ko | ~40 ko | ~50 ko | ~120 ko |
| **Navigation** | **SPA instantanée** | React SPA | Rechargement complet | Vue SPA | SPA hébergée |
| **Versioning** | **Natif** | Natif (complexe) | Plugin mike | Manuel | Natif |
| **i18n** | **Natif** | Natif (complexe) | Basé sur plugin | Natif | Natif |
| **Multi-projet** | **Natif** | Plugin | Plugin | - | - |
| **Recherche** | **Intégrée** | Algolia (cloud) | Intégrée | MiniSearch | Cloud |
| **Assistant IA interactif** | **Intégré (BYOK)** | - | - | - | Intégré (Cloud) |
| **Contexte IA (`llms.txt`)** | **Intégré** | - | - | - | Intégré |
| **Serveur MCP** | **Intégré** | - | - | - | Intégré |
| **Agent Skills** | **Intégré** | - | - | - | - |
| **Image Docker** | **Officielle** | - | Officielle | - | - |
| **Auto-hébergé** | **Oui** | Oui | Oui | Oui | - |
| **Coût** | **Libre (OSS)** | Libre (OSS) | Libre (OSS) | Libre (OSS) | Freemium |

## Fonctionnalités

### Zéro config, démarrage instantané
Pointez docmd vers n'importe quel dossier de Markdown et il s'exécute. La navigation est générée automatiquement à partir de votre structure de fichiers. Vous pouvez écrire votre premier doc et l'avoir en ligne en moins d'une minute — pas de boilerplate, pas de pipeline de build à configurer, pas de décisions à prendre à l'avance.

### Minuscule par défaut, rapide partout
Le payload JavaScript par défaut est de ~18 ko. Les pages naviguent comme une SPA instantanée. La sortie est du HTML statique — optimisé pour le SEO, avec sitemap, URLs canoniques et métadonnées Open Graph intégrées. Recherche full-text hors ligne intégrée, sans service cloud requis.

### Native IA
docmd est conçu pour la façon dont la documentation est lue et utilisée aujourd'hui :
- **Assistant IA interactif (`@docmd/plugin-ai`)** — Widget de documentation interactif propulsé par RAG, relais cloud zéro config avec BYOK (Apportez Votre Propre Clé : OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama) et sécurité stricte d'origine de domaine.
- **Serveur MCP** — `docmd mcp` expose votre documentation aux agents IA sur stdio, leur permettant de chercher, lire et valider le contenu directement.
- **Contexte (`llms.txt` / `llms-full.txt`)** — contexte complet de la documentation généré au build, prêt pour tout LLM.
- **Agent Skills** — ensembles d'instructions modulaires pour les LLMs et les agents IDE ([docmd-skills](https://github.com/docmd-io/docmd-skills)).
- **Open Knowledge Format (OKF)** — bundles de connaissances structurés multilingues pour agents IA.
- **Copier en Markdown / Copier le contexte** — boutons en un clic dans le navigateur, optimisés pour coller dans un chat IA.

### Conçu pour passer à l'échelle
- Internationalisation avec builds multilingues
- Versioning pour plusieurs versions de documentation
- Workspaces pour les monorepos et les configurations multi-projets
- Système de plugins pour étendre le comportement du cœur
- Support complet du theming, modèles intégrés, CSS/JS personnalisé, mode clair/sombre

## CLI

```bash
docmd dev            # serveur de développement local
docmd build          # construire pour le déploiement
docmd live           # éditeur en direct basé sur le navigateur
docmd init           # générer un nouveau docmd.config.json dans le dossier courant
docmd stop           # arrêter les serveurs `docmd dev` / `docmd live` en cours
docmd doctor         # vérification préalable : config + statut d'installation des plugins
docmd migrate        # importer depuis Docusaurus, VitePress, MkDocs ou Starlight
docmd deploy         # générer la configuration pour Docker, NGINX, Caddy, Vercel, Netlify
docmd validate       # vérifier tous les liens internes
docmd mcp            # exécuter comme serveur MCP sur stdio
docmd add <name>     # installer un plugin ou un modèle
```

## Plugins

La fonctionnalité principale repose sur un système de plugins robuste. L'essentiel est inclus par défaut, tandis que des plugins optionnels peuvent être ajoutés selon les besoins spécifiques.

| Plugin | Statut | Description |
| :--- | :---: | :--- |
| `search` | Cœur | Recherche full-text hors ligne avec correspondance approximative |
| `ai` | Cœur | Assistant IA interactif propulsé par RAG avec support BYOK |
| `seo` | Cœur | Balises SEO et métadonnées Open Graph |
| `sitemap` | Cœur | Génère `sitemap.xml` |
| `git` | Cœur | Historique des commits Git et dates de dernière mise à jour |
| `analytics` | Cœur | Intégration légère d'analytics |
| `llms` | Cœur | Génération du contexte IA (`llms.txt` / `llms-full.txt`) |
| `okf` | Cœur | Bundles Open Knowledge Format pour agents IA (par locale) |
| `mermaid` | Cœur | Support des diagrammes Mermaid |
| `openapi` | Cœur | Rendu de spécification OpenAPI 3.x au build |
| `pwa` | Optionnel | Progressive Web App — navigation hors ligne |
| `threads` | Optionnel | Fils de discussion inline *(par @svallory)* |
| `math` | Optionnel | Rendu mathématique KaTeX / LaTeX | `search` | Cœur | Recherche full-text hors ligne avec correspondance approximative |
| `seo` | Cœur | Balises SEO et métadonnées Open Graph |
| `sitemap` | Cœur | Génère `sitemap.xml` |
| `git` | Cœur | Historique des commits Git et dates de dernière mise à jour |
| `analytics` | Cœur | Intégration légère d'analytics |
| `llms` | Cœur | Génération du contexte IA (`llms.txt` / `llms-full.txt`) |
| `mermaid` | Cœur | Support des diagrammes Mermaid |
| `openapi` | Cœur | Rendu de spécification OpenAPI 3.x au build |
| `okf` | Core | Bundles Open Knowledge Format pour agents IA (par locale) |
| `pwa` | Optionnel | Progressive Web App — navigation hors ligne |
| `threads` | Optionnel | Fils de discussion inline *(par @svallory)* |
| `math` | Optionnel | Rendu mathématique KaTeX / LaTeX |

Installer des plugins optionnels :

```bash
docmd add <plugin-name>
```

Créez le vôtre : [Guide de développement de plugins](https://docs.docmd.io/development/building-plugins/)

## Configuration

Aucune configuration n'est requise pour commencer. Ajoutez un `docmd.config.json` (ou `.ts` / `.js`) à la racine de votre projet uniquement lorsque vous avez besoin de plus de contrôle :

```json
{
  "title": "Mon Projet",
  "url": "https://docs.monprojet.fr",
  "src": "./docs",
  "out": "./dist"
}
```

Les fichiers de configuration TypeScript et JavaScript sont pris en charge pour les valeurs dynamiques.

Référence complète : [Aperçu de la configuration](https://docs.docmd.io/configuration/overview)

## Structure du projet

```text
my-docs/
├── docs/                ← Vos fichiers markdown
├── assets/              ← Images et fichiers statiques
├── docmd.config.json    ← Configuration optionnelle
└── package.json
```

## Éditeur en direct

Un éditeur basé sur navigateur pour écrire et prévisualiser la documentation — aucune configuration locale requise.

<p>
  <img alt="aperçu de l'éditeur en direct docmd" width="820" src="https://docs.docmd.io/assets/previews/live-editor-preview.webp">
</p>

**Essayez-le sur [live.docmd.io](https://live.docmd.io)**

## API programmatique

Utilisez docmd dans des scripts Node.js, des pipelines CI ou des étapes de build personnalisées. (Supporte CommonJS et ESM.)

```javascript
import { build } from '@docmd/core';

await build('./docmd.config.json', { isDev: false });
```

Référence complète : [Node API](https://docs.docmd.io/development/node-api-reference/)

## Communauté

- **Bugs et problèmes** → [GitHub Issues](https://github.com/docmd-io/docmd/issues)
- **Questions et idées** → [Discussions](https://github.com/orgs/docmd-io/discussions)
- **Contribuer** → [CONTRIBUTING.md](.github/CONTRIBUTING.md)
- **Roadmap** → [GitHub Discussions](https://github.com/orgs/docmd-io/discussions/2)

## Soutien

- Faire connaître docmd est la façon la plus directe de soutenir son développement. [Partagez-le sur X](https://twitter.com/intent/tweet?url=https://github.com/docmd-io/docmd&text=docmd%20-%20Documentation%20prête%20pour%20la%20production%20à%20partir%20de%20Markdown%20en%20quelques%20secondes.) avec vos amis ou attribuez-lui une étoile.
- Si docmd vous fait gagner du temps, un [sponsorship GitHub](https://github.com/sponsors/mgks) est très appréciable.
- Des idées ou des bugs ? Ouvrez une issue ou une PR, n'hésitez pas à contribuer avec vos propres plugins.

## Licence

MIT — voir [`LICENSE`](./LICENSE) pour plus de détails.