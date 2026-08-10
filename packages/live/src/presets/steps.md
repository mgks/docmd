## Steps Container

::: steps

::: step "Initialise Project"
Run `npx @docmd/core init` to scaffold your directory with a starter `docmd.config.json`.
::: /step

::: step "Author Content"
Write your docs in standard Markdown. The parser auto-discovers `.md` files in your `src/` directory.
::: /step

::: step "Build & Deploy"
Run `npx @docmd/core build` to produce a static site under `./site`, ready for any CDN.
::: /step

::: /steps

### Legacy Fallback Syntax

::: callout info 
Legacy ordered-list step syntax in standalone block.
:::

::: steps
1. **Scaffold Project**
   Run init command.

2. **Generate Site**
   Run build command.
:::