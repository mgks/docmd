---
title: "Installation"
description: "Learn how to install docmd on your system globally or as a project dependency."
---

# Installation

You can install `docmd` using npm (Node Package Manager), which comes with Node.js. If you don't have Node.js and npm installed, please visit [nodejs.org](https://nodejs.org/) to download and install them first (Node.js version 20.x or higher is recommended for `docmd`).

## Global Installation (Recommended for CLI Use)

For using `docmd` as a command-line tool across multiple projects, global installation is the most convenient method.

Open your terminal or command prompt and run:

```bash
npm install -g docmd
```

This command downloads `docmd` and makes the `docmd` executable available in your system's PATH.

### Verify Installation
After installation, you can verify that `docmd` is installed correctly by running:
```bash
docmd --version
```
This should print the installed version of `docmd`. You can also see available commands with:
```bash
docmd --help
```

## Local Installation (Per Project)

Alternatively, you might prefer to install `docmd` as a development dependency for a specific project. This is useful if you want to lock down a specific version of `docmd` for that project or use it within npm scripts.

Navigate to your project's root directory in the terminal and run:
```bash
npm install --save-dev docmd
```
*(Or `npm install --save-dev @username/docmd` for a scoped package.)*

When installed locally, `docmd` is not directly available as a global command. You can run it using:

*   **`npx` (Recommended):** `npx` is a tool that comes with npm and allows you to execute package binaries.
    ```bash
    npx docmd init
    npx docmd build
    ```
*   **NPM Scripts:** Add scripts to your project's `package.json`:
    ```json
    // package.json
    {
      "scripts": {
        "docs:init": "docmd init",
        "docs:dev": "docmd dev",
        "docs:build": "docmd build"
      }
    }
    ```
    Then, you can run them like:
    ```bash
    npm run docs:dev
    npm run docs:build
    ```

## Troubleshooting

*   **Permission Errors (EACCES):** If you encounter permission errors during global installation on macOS or Linux, you might need to run the command with `sudo`:
    ```bash
    sudo npm install -g docmd
    ```
    However, a better long-term solution is often to [configure npm to use a directory you own](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).
*   **Command Not Found:** If `docmd` is not found after global installation, ensure that the npm global binaries directory is in your system's PATH.

With `docmd` installed, you're ready to move on to [Basic Usage](/getting-started/basic-usage/) to create and manage your documentation site.