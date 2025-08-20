---
title: "Steps Container"
description: "Create step-by-step instructions and tutorials with the steps container."
---

# Steps Container

The steps container allows you to create clear, sequential instructions and tutorials. It automatically numbers your steps and provides a clean, organized layout.

## Basic Usage

**Code:**

```markdown
::: steps

1. **Create a new project**
   Initialize your project with the necessary configuration files.

2. **Install dependencies**
   Run the package manager to install required libraries.

3. **Start development**
   Begin coding your application with the setup complete.

   ::: button Learn_More #customization color:green

:::
```

**Rendered Preview:**

::: steps

1. **Create a new project**
   Initialize your project with the necessary configuration files.

2. **Install dependencies**
   Run the package manager to install required libraries.

3. **Start development**
   Begin coding your application with the setup complete.

   ::: button Learn_More #customization color:green

:::

## Steps with Nested Containers

You can include cards, callouts, and buttons inside steps for richer content:

**Code:**

```markdown
::: steps

1. **Plan Your Project**
   Define the scope and requirements for your application.

   ::: callout info Planning Tip
   Consider creating user stories to better understand your requirements.
   :::

2. **Setup Development Environment**
   Configure your local development tools and workspace.

   ::: card Environment Checklist
   - Install code editor (VS Code recommended)
   - Setup version control (Git)
   - Install Node.js and npm
   - Configure linting and formatting tools
   :::

3. **Initialize Project**
   Create the project structure and configuration files.

   ::: button Create_Project external:https://github.com/new color:#2564e4

4. **Start Coding**
   Begin implementing your application features.

   ::: callout success Ready to Code
   Your development environment is now ready! Happy coding!
   :::

:::
```

**Rendered Preview:**

::: steps

1. **Plan Your Project**
   Define the scope and requirements for your application.

   ::: callout info Planning Tip
   Consider creating user stories to better understand your requirements.
   :::

2. **Setup Development Environment**
   Configure your local development tools and workspace.

   ::: card Environment Checklist
   - Install code editor (VS Code recommended)
   - Setup version control (Git)
   - Install Node.js and npm
   - Configure linting and formatting tools
   :::

3. **Initialize Project**
   Create the project structure and configuration files.

   ::: button Create_Project external:https://github.com/new color:#2564e4

4. **Start Coding**
   Begin implementing your application features.

   ::: callout success Ready to Code
   Your development environment is now ready! Happy coding!
   :::

:::

## Steps and Tabs Compatibility

::: callout error Important Limitation
**Steps and tabs containers are incompatible** - they cannot be nested within each other due to markdown parsing conflicts. Use them as separate sections instead.

**Supported in steps:** Cards, callouts, buttons  
**Not supported:** Tabs containers
:::

**Code:**

```markdown
## Installation Steps

::: steps

1. **Choose Your Platform**
   Select the appropriate installation method for your operating system.

2. **Download the Installer**
   Get the latest version from the downloads section.

3. **Run Installation**
   Follow the setup wizard to complete installation.

:::

## Platform-Specific Instructions

::: tabs
== tab "Windows"
Download the `.exe` installer and run as administrator.

::: button Learn_More #customization

== tab "macOS" 
Download the `.dmg` file and drag to Applications folder.

::: button Learn_More #customization

:::
```

## Customization

Steps containers automatically apply consistent styling and numbering. The container handles:

- **Automatic numbering** - Steps are numbered sequentially
- **Consistent spacing** - Proper spacing between steps
- **Responsive design** - Works on all screen sizes
- **Theme integration** - Matches your site's theme
- **Smart list handling** - Only step items get special styling, nested lists remain normal