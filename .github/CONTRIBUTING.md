# Contributing to docmd

First off, thank you for considering contributing to `docmd`! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

We welcome contributions of all kinds: bug fixes, new features, documentation improvements, or even just typo fixes.

## ⚡ Quick Links

*   [**Documentation**](https://docmd.mgks.dev) - Read the docs to understand how the tool works.
*   [**GitHub Issues**](https://github.com/mgks/docmd/issues) - Browse existing bugs or feature requests.
*   [**Discussions**](https://github.com/mgks/docmd/discussions) - Ask questions or share ideas.

---

## 🛠️ Development Setup

`docmd` is a Node.js CLI tool. Developing it locally requires a slightly different setup than a standard web app.

### Prerequisites
*   **Node.js**: Version 22.x or higher.
*   **npm**: Version 10.x or higher.

### 1. Fork and Clone
1.  Fork the repository to your GitHub account.
2.  Clone your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/docmd.git
    cd docmd
    ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Link for Local Development
To test the CLI command (`docmd`) globally on your machine while modifying the source code, use `npm link`.

```bash
# inside the project root
npm link
```

Now, when you run `docmd` in *any* terminal window, it will use the code from your local folder.

### 4. Running the Dev Server
We have a built-in test site located in the `docs/` folder (this is the documentation for docmd itself).

To start the dev server and watch for changes:

```bash
# Method 1: Using the npm script (Recommended)
npm start

# Method 2: If you have linked the package
docmd dev
```

### 5. Developer Mode (Important)
By default, `docmd` only watches the user's content files. To make `docmd` watch **its own internal source code** (templates, css, core logic) and trigger a rebuild when you edit them, set the environment variable:

```bash
# Mac/Linux
export DOCMD_DEV=true
npm start

# Windows (PowerShell)
$env:DOCMD_DEV="true"
npm start
```

---

## 📂 Project Structure

Here is a map of the codebase to help you navigate:

```text
bin/
  └── docmd.js          # The CLI entry point
src/
  ├── commands/         # Logic for 'init', 'build', 'dev'
  ├── core/
  │   ├── config-loader.js   # Loads docmd.config.js
  │   ├── config-validator.js # Validates config structure
  │   ├── file-processor.js  # Orchestrates file reading
  │   ├── html-generator.js  # Injects content into EJS templates
  │   └── markdown/          # The Core Parsing Engine
  │       ├── containers.js  # Callout/Card definitions
  │       ├── rules.js       # Complex logic (Tabs, Changelogs)
  │       └── setup.js       # MarkdownIt configuration
  ├── plugins/          # Built-in plugins (SEO, Sitemap)
  ├── templates/        # EJS HTML templates
  └── assets/           # Internal CSS and JS (Themes)
docs/                   # The documentation site content
site/                   # The generated output folder (gitignored)
```

---

## 🚀 Submitting a Pull Request

1.  **Create a Branch:** Always create a new branch for your changes.
    *   `feat/my-new-feature`
    *   `fix/bug-description`
    *   `docs/update-readme`
2.  **Make Changes:** Write clear, concise code.
3.  **Test:**
    *   Run `docmd build` to ensure the build process finishes without errors.
    *   Verify your changes visually by running `docmd dev`.
4.  **Commit:** We prefer [Conventional Commits](https://www.conventionalcommits.org/).
    *   `feat: add search bar`
    *   `fix: resolve css overflow in tables`
    *   `docs: fix typo in readme`
5.  **Push & Open PR:** Push your branch to your fork and open a Pull Request against the `main` branch of `mgks/docmd`.

---

## 🎨 Style Guidelines

*   **Linting:** Please ensure your code follows the existing style. (We use standard ESLint/Prettier configurations).
*   **No-Style:** If modifying `no-style` templates, ensure no external CSS is injected unless requested.
*   **Compatibility:** `docmd` aims to be lightweight. Avoid adding heavy dependencies unless absolutely necessary.

---

## 🤝 Community

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.