<div align="right">
  <sup>
    <a href="./README.md">EN</a> &nbsp;|&nbsp; <b>ES</b> &nbsp;|&nbsp; <a href="./README.de.md">DE</a> &nbsp;|&nbsp; <a href="./README.ja.md">日本語</a> &nbsp;|&nbsp; <a href="./README.fr.md">FR</a> &nbsp;|&nbsp; <a href="./README.zh.md">中文</a>
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

  <p><b>Documentación lista para producción desde Markdown, en segundos.</b><br/>Zero config. AI-nativo. Construido para desarrolladores.</p>

  <p>
    <a href="https://www.npmjs.com/package/@docmd/core"><img src="https://img.shields.io/npm/v/@docmd/core.svg?style=flat-square&color=CB3837" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@docmd/core?activeTab=versions"><img src="https://img.shields.io/npm/dm/@docmd/core.svg?style=flat-square&color=38bd24" alt="descargas mensuales"></a>
    <a href="https://github.com/docmd-io/docmd"><img src="https://img.shields.io/github/stars/docmd-io/docmd?style=flat-square&logo=github" alt="estrellas de GitHub"></a>
    <a href="https://github.com/docmd-io/docmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/docmd-io/docmd.svg?style=flat-square&color=A31F34" alt="licencia"></a>
  </p>

  <h4>
    <a href="https://docmd.io">Sitio web</a> &nbsp;·&nbsp;
    <a href="https://docs.docmd.io/es/">Documentación</a> &nbsp;·&nbsp;
    <a href="https://live.docmd.io">Editor en vivo</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd-skills">Agent Skills</a> &nbsp;·&nbsp;
    <a href="https://github.com/docmd-io/docmd/issues">Reportar un bug</a>
  </h4>

  <br/>

  <a href="https://docs.docmd.io/es/">
    <img width="820" alt="docmd tema por defecto — vista previa en modo claro y oscuro" src="https://raw.githubusercontent.com/docmd-io/docmd/refs/heads/main/assets/docmd-cover.webp" />
  </a>

  <br/><br/>

</div>

## Inicio rápido

Ejecuta docmd en cualquier carpeta con archivos Markdown — sin instalación:

```bash
npx @docmd/core dev
```

<details>
  <summary><b>Abre en <code>http://localhost:3000</code></b></summary><br>

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
  <img alt="vista previa del servidor de desarrollo docmd" width="820" src="https://docmd.io/assets/images/dev-preview.gif">
</p>

La navegación se genera a partir de la estructura de archivos. Sin archivo de configuración, sin frontmatter obligatorio, sin framework que aprender.

**Cuando estés listo para publicar:**

```bash
npx @docmd/core build
```

Esto produce un sitio estático altamente optimizado (SPA) listo para desplegar en Vercel, Cloudflare Pages, Netlify, GitHub Pages o cualquier host estático.

**Requisitos:** Node.js 18+

<details>
  <summary><b>O instala globalmente / vía Docker</b></summary><br/>

```bash
# Instalar globalmente vía npm
npm install -g @docmd/core

# O vía pnpm
pnpm add -g @docmd/core

# Ejecutarlo
docmd dev    # iniciar el servidor de desarrollo
docmd build  # construir para desplegar
```

O ejecuta vía Docker:

```bash
docker run -p 3000:3000 ghcr.io/docmd-io/docmd:0.9.0
```

> Fije una versión para compilaciones reproducibles.

</details>

## ¿Por qué docmd?

| Característica | docmd | Docusaurus | MkDocs | VitePress | Mintlify |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Configuración requerida** | **Ninguna** | `docusaurus.config.js` | `mkdocs.yml` | `config.mts` | `docs.json` |
| **Payload JS** | **~18 kb** | ~250 kb | ~40 kb | ~50 kb | ~120 kb |
| **Navegación** | **SPA instantánea** | React SPA | Recarga completa | Vue SPA | SPA alojada |
| **Versionado** | **Nativo** | Nativo (complejo) | Plugin mike | Manual | Nativo |
| **i18n** | **Nativo** | Nativo (complejo) | Basado en plugin | Nativo | Nativo |
| **Multi-proyecto** | **Nativo** | Plugin | Plugin | - | - |
| **Búsqueda** | **Integrada** | Algolia (nube) | Integrada | MiniSearch | Nube |
| **Asistente de IA interactivo** | **Integrado (BYOK)** | - | - | - | Integrado (Nube) |
| **Contexto IA (`llms.txt`)** | **Integrado** | - | - | - | Integrado |
| **Servidor MCP** | **Integrado** | - | - | - | Integrado |
| **Agent Skills** | **Integrado** | - | - | - | - |
| **Imagen Docker** | **Oficial** | - | Oficial | - | - |
| **Autoalojado** | **Sí** | Sí | Sí | Sí | - |
| **Coste** | **Gratis (OSS)** | Gratis (OSS) | Gratis (OSS) | Gratis (OSS) | Freemium |

## Funcionalidades

### Zero config, inicio instantáneo
Apunta docmd a cualquier carpeta de Markdown y se ejecuta. La navegación se genera automáticamente a partir de la estructura de archivos. Puedes escribir tu primer doc y tenerlo en vivo en menos de un minuto — sin boilerplate, sin pipeline de build que configurar, sin decisiones que tomar por adelantado.

### Diminuto por defecto, rápido en todas partes
El payload de JavaScript por defecto es ~18 kb. Las páginas navegan como una SPA instantánea. La salida es HTML estático — optimizado para SEO, con sitemap, URLs canónicas y metadatos Open Graph incluidos. Búsqueda offline de texto completo integrada, sin servicio en la nube necesario.

### AI-nativo
docmd está construido para la forma en que la documentación se lee y se usa hoy:
- **Asistente de IA interactivo (`@docmd/plugin-ai`)** — Widget de documentación interactivo impulsado por RAG con relay en la nube sin configuración, Traiga Su Propia Clave (BYOK: OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama) y seguridad estricta de origen de dominio.
- **Servidor MCP** — `docmd mcp` expone tu documentación a agentes de IA sobre stdio, permitiéndoles buscar, leer y validar contenido directamente.
- **Contexto (`llms.txt` / `llms-full.txt`)** — contexto completo de documentación generado en tiempo de build, listo para cualquier LLM.
- **Agent Skills** — conjuntos de instrucciones modulares para LLMs y agentes de IDE ([docmd-skills](https://github.com/docmd-io/docmd-skills)).
- **Open Knowledge Format (OKF)** — paquetes de conocimiento estructurado multi-idioma para agentes de IA.
- **Copiar como Markdown / Copiar contexto** — botones de un clic en el navegador, optimizados para pegar en chats de IA.

### Construido para escalar
- Internacionalización con builds multi-idioma
- Versionado para múltiples releases de documentación
- Workspaces para monorepos y setups multi-proyecto
- Sistema de plugins para extender el comportamiento del núcleo
- Soporte completo de temas, plantillas integradas, CSS/JS personalizado, modo claro/oscuro

## CLI

```bash
docmd dev            # servidor de desarrollo local
docmd build          # construir para desplegar
docmd live           # Editor en vivo basado en navegador
docmd init           # crear un nuevo docmd.config.json en la carpeta actual
docmd stop           # detener servidores `docmd dev` / `docmd live` en ejecución
docmd doctor         # verificación previa: config + estado de instalación de plugins
docmd migrate        # importar desde Docusaurus, VitePress, MkDocs o Starlight
docmd deploy         # generar configuración para Docker, NGINX, Caddy, Vercel, Netlify
docmd validate       # comprobar todos los enlaces internos
docmd mcp            # ejecutar como servidor MCP sobre stdio
docmd add <name>     # instalar un plugin o plantilla
```

## Plugins

La funcionalidad principal está impulsada por un sistema de plugins robusto. Lo esencial viene incluido por defecto, mientras que los plugins opcionales pueden añadirse según necesidades específicas.

| Plugin | Estado | Descripción |
| :--- | :---: | :--- |
| `search` | Núcleo | Búsqueda offline de texto completo con coincidencia difusa |
| `ai` | Núcleo | Asistente de IA interactivo impulsado por RAG con soporte BYOK |
| `seo` | Núcleo | Etiquetas SEO y metadatos Open Graph |
| `sitemap` | Núcleo | Genera `sitemap.xml` |
| `git` | Núcleo | Historial de commits de Git y fechas de última actualización |
| `analytics` | Núcleo | Integración ligera de analytics |
| `llms` | Núcleo | Generación de contexto IA (`llms.txt` / `llms-full.txt`) |
| `okf` | Núcleo | Bundles Open Knowledge Format para agentes IA (por locale) |
| `mermaid` | Núcleo | Soporte de diagramas Mermaid |
| `openapi` | Núcleo | Renderizador de especificación OpenAPI 3.x en tiempo de build |
| `pwa` | Opcional | Progressive Web App — navegación offline |
| `threads` | Opcional | Hilos de discusión inline *(por @svallory)* |
| `math` | Opcional | Renderizado matemático KaTeX / LaTeX | | Núcleo | Etiquetas SEO y metadatos Open Graph |
| `sitemap` | Núcleo | Genera `sitemap.xml` |
| `git` | Núcleo | Historial de commits de Git y fechas de última actualización |
| `analytics` | Núcleo | Integración ligera de analytics |
| `llms` | Núcleo | Generación de contexto IA (`llms.txt` / `llms-full.txt`) |
| `mermaid` | Núcleo | Soporte de diagramas Mermaid |
| `openapi` | Núcleo | Renderizador de especificación OpenAPI 3.x en tiempo de build |
| `okf` | Core | Bundles Open Knowledge Format para agentes IA (por locale) |
| `pwa` | Opcional | Progressive Web App — navegación offline |
| `threads` | Opcional | Hilos de discusión inline *(por @svallory)* |
| `math` | Opcional | Renderizado matemático KaTeX / LaTeX |

Instalar plugins opcionales:

```bash
docmd add <plugin-name>
```

Crea el tuyo: [Guía de desarrollo de plugins](https://docs.docmd.io/es/development/building-plugins/)

## Configuración

No se requiere configuración para comenzar. Añade un `docmd.config.json` (o `.ts` / `.js`) en la raíz de tu proyecto solo cuando necesites más control:

```json
{
  "title": "Mi Proyecto",
  "url": "https://docs.miproyecto.com",
  "src": "./docs",
  "out": "./dist"
}
```

Se admiten archivos de configuración TypeScript y JavaScript para valores dinámicos.

Referencia completa: [Resumen de configuración](https://docs.docmd.io/es/configuration/overview)

## Estructura del proyecto

```text
my-docs/
├── docs/                ← Tus archivos markdown
├── assets/              ← Imágenes y archivos estáticos
├── docmd.config.json    ← Configuración opcional
└── package.json
```

## Editor en vivo

Un editor basado en navegador para escribir y previsualizar documentación — sin configuración local.

<p>
  <img alt="vista previa del editor en vivo docmd" width="820" src="https://docs.docmd.io/assets/previews/live-editor-preview.webp">
</p>

**Pruébalo en [live.docmd.io](https://live.docmd.io)**

## API programática

Usa docmd en scripts de Node.js, pipelines de CI o pasos de build personalizados. (Soporta tanto CommonJS como ESM.)

```javascript
import { build } from '@docmd/core';

await build('./docmd.config.json', { isDev: false });
```

Referencia completa: [Node API](https://docs.docmd.io/es/development/node-api-reference/)

## Comunidad

- **Bugs y problemas** → [GitHub Issues](https://github.com/docmd-io/docmd/issues)
- **Preguntas e ideas** → [Discussions](https://github.com/orgs/docmd-io/discussions)
- **Contribuir** → [CONTRIBUTING.md](.github/CONTRIBUTING.md)
- **Roadmap** → [GitHub Discussions](https://github.com/orgs/docmd-io/discussions/2)

## Soporte

- Dar a conocer docmd es la forma más directa de apoyar su desarrollo. [Compártelo en X](https://twitter.com/intent/tweet?url=https://github.com/docmd-io/docmd&text=docmd%20-%20Documentación%20lista%20para%20producción%20desde%20Markdown%20en%20segundos.) con amigos o dale una estrella.
- Si docmd te ahorra tiempo, un [sponsorship en GitHub](https://github.com/sponsors/mgks) ayuda mucho.
- ¿Ideas o bugs? Abre un issue o PR, siéntete libre de contribuir con tus propios plugins.

## Licencia

MIT — consulta [`LICENSE`](./LICENSE) para más detalles.