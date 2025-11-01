---
title: "CLI Commands"
description: "A reference guide to all available docmd command-line interface (CLI) commands and their options."
---

# CLI Commands

`docmd` provides a set of commands to help you initialize, build, and preview your documentation site.

## `docmd init`

Initializes a new `docmd` project in the current directory.

**Usage:**
```bash
docmd init
```

**Description:**
This command creates the basic file and directory structure required for a `docmd` project:
*   `docs/`: A directory to store your Markdown source files.
    *   `docs/index.md`: A sample Markdown file.
*   `docmd.config.js`: The main configuration file for your site, pre-filled with default settings.

If a `docs/` directory or `docmd.config.js` file already exists, `docmd init` will typically warn you and avoid overwriting them to prevent accidental data loss.

**Options:**
This command currently does not take any options.

## `docmd build`

Builds your static documentation site.

**Usage:**
```bash
docmd build [options]
```

**Description:**
The `build` command reads your Markdown files from the source directory (specified by `srcDir` in `docmd.config.js`, defaults to `docs/`), processes them along with your `docmd.config.js`, and generates a complete static website in the output directory (specified by `outputDir` in `docmd.config.js`, defaults to `site/`).

The output `site/` directory contains all the HTML, CSS, JavaScript, and other assets needed to deploy your documentation.

By default, the build process will update all assets to ensure you have the latest versions from the docmd package. This ensures your site benefits from the latest improvements and fixes.

**Options:**

*   `-c, --config <path>`
    *   **Default:** `docmd.config.js` or `config.js`
    *   **Description:** Specifies the path to the configuration file.

*   `-p, --preserve`
    *   **Default:** `false`
    *   **Description:** Preserves existing asset files instead of updating them.

*   `--silent`
    *   **Default:** `false`
    *   **Description:** Suppresses most log output in the console. Useful for running in automated environments.

## `docmd dev`

Starts a local development server with live reloading.

**Usage:**
```bash
docmd dev [options]
```

**Description:**
The `dev` command is essential for writing and previewing your documentation. It:
1.  Performs an initial build of your site.
2.  Starts a local web server (usually on `http://localhost:3000`).
3.  Watches your source files (`docs/` directory, `docmd.config.js`, and internal `docmd` theme assets) for changes.
4.  When a change is detected, it automatically rebuilds the necessary parts of your site and triggers a live reload in your browser.

This provides a fast feedback loop, allowing you to see your changes almost instantly.

**Options:**

*   `-c, --config <path>`
    *   **Default:** `docmd.config.js` or `config.js`
    *   **Description:** Specifies the path to the configuration file.

*   `--port <number>`
    *   **Default:** `3000`
    *   **Description:** Specifies the port for the development server. If the port is in use, docmd will automatically try the next available one.
    *   **Example:** `docmd dev --port 8080`

*   `-p, --preserve`
    *   **Default:** `false`
    *   **Description:** Preserves existing asset files instead of updating them.

*   `--silent`
    *   **Default:** `false`
    *   **Description:** Suppresses most log output in the console. Useful for running in automated environments.

**Note:** The development server starts on port 3000 by default. If port 3000 is already in use, the server will automatically try the next available port (3001, 3002, etc.) until it finds an open port.

## Global Options (Apply to all commands)

*   `--version`
    *   **Usage:** `docmd --version`
    *   **Description:** Displays the installed version of `docmd`.
*   `--help`
    *   **Usage:** `docmd --help` or `docmd <command> --help` (e.g., `docmd build --help`)
    *   **Description:** Displays help information for `docmd` or a specific command, including available options.

This reference should help you effectively use `docmd` from your command line. For more detailed explanations of how these commands fit into the workflow, see the [Getting Started > Basic Usage](/getting-started/basic-usage/) guide.