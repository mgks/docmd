---
title: "Contributing to docmd"
description: "Learn how you can contribute to the development and improvement of docmd."
---

# Contributing to docmd

Thank you for your interest in contributing to `docmd`! We welcome contributions from the community to help make `docmd` even better. Whether it's reporting a bug, suggesting a feature, improving documentation, or writing code, your help is appreciated.

## How to Contribute

There are many ways to contribute to `docmd`:

*   **Reporting Bugs:** If you find a bug, please open an issue on our [GitHub Issues page](https://github.com/mgks/docmd/issues). Provide as much detail as possible, including steps to reproduce, expected behavior, and actual behavior.
*   **Suggesting Features:** Have ideas for improvements? Open an issue and describe what you'd like to see.
*   **Improving Documentation:** The documentation you're reading now (this site itself!) is built with `docmd` and lives in the `docs/` directory of the repository.
*   **Writing Code:** If you're interested in fixing bugs or implementing new features, read on for development setup instructions.

## Development Setup

To set up `docmd` for local development:

1. **Fork the Repository:**
   Click the "Fork" button on the [docmd GitHub page](https://github.com/mgks/docmd) to create your own copy.

2. **Clone Your Fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/docmd.git
   cd docmd
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

### Development Workflow

`docmd` uses Node.js and npm.

1. **Make Your Changes:**
   * Fix bugs or add features in the `/src` directory.
   * Add or update tests in the `/tests` directory (if applicable).
   * Update or add documentation in the `/docs` directory to reflect your changes.

2. **Link for Local Testing:**
   To use your development version of `docmd` as a global command-line tool on your system:
   ```bash
   npm link
   ```
   This allows you to run `docmd` from any directory and test your changes.

3. **Test Your Changes:**
   * Run automated tests with `npm test` (if available).
   * Test your changes by running `docmd build` or `docmd dev` (which will use `docmd` itself to build its own documentation located in `docs/`).

4. **Code Style:**
   * Follow the existing code style and formatting.
   * Consider running `npm run lint` to check for style issues (if set up).

## Pull Request Process

Once you're satisfied with your changes:

1. **Commit Your Changes:**
   ```bash
   git add .
   git commit -m "Brief description of your changes"
   ```

2. **Push to Your Fork:**
   ```bash
   git push origin main  # or the branch you created
   ```

3. **Submit a Pull Request:**
   Go to your fork on GitHub and open a pull request to the `main` branch of the original `mgks/docmd` repository. Provide a clear description of your changes.

4. **Code Review:**
   Maintainers will review your PR and may suggest changes or improvements. Please be responsive to feedback.

## Code of Conduct

Please be respectful and considerate when interacting with others in the project. We aim to foster an inclusive and welcoming community.

Thank you for helping make `docmd` a great tool for documentation!