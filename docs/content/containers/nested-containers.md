---
title: "Nested Containers"
description: "Learn how to use the advanced nested container system to create complex, interactive documentation layouts with seamless container nesting."
---

# Nested Containers

The advanced nested container system in docmd allows you to create complex, interactive documentation layouts by nesting containers within each other. This powerful feature enables you to build rich, structured content that was previously impossible.

## Overview

With docmd v0.2.0, you can nest containers seamlessly:

- **Cards within Tabs** - Organize content into structured sections within tabs
- **Callouts within Cards** - Add informational content within structured cards
- **Buttons within Any Container** - Place action buttons in any context
- **Multiple Levels of Nesting** - Support for complex nested structures up to 7+ levels
- **Steps for Simple Sequences** - Use steps containers for straightforward, sequential instructions

## Container Nesting Rules

### Supported Nesting Combinations

| Container | Can Nest Inside | Can Contain |
|-----------|----------------|-------------|
| **Callouts** | Any container | Any container |
| **Cards** | Any container | Any container |
| **Buttons** | Any container | None (self-closing) |
| **Steps** | Any container (except tabs) | Any container (except tabs) |
| **Tabs** | Any container (except steps) | Any container (except tabs, steps) |

### Nesting Best Practices

1. **Logical Structure** - Nest containers in a way that makes logical sense
2. **Readability** - Don't nest too deeply (3-4 levels maximum for readability)
3. **Performance** - Complex nesting is supported but keep it reasonable
4. **Content Organization** - Use nesting to organize related content
5. **Use the Right Tool** - Use steps for simple sequences, cards/tabs for complex content

### Nesting Limitations

::: callout error Known Issues
**Steps ↔ Tabs Incompatibility:** Steps and tabs containers cannot be nested within each other due to parsing complexity. Use them as separate sections instead.
:::

- **Tabs cannot contain tabs** - This prevents infinite recursion
- **Tabs cannot contain steps** - Due to parsing conflicts with markdown processing
- **Steps cannot contain tabs** - Due to parsing complexity 
- **Steps cannot be inside tabs** - Due to container recognition issues
- **Maximum depth** - While technically unlimited, keep it under 7 levels for readability
- **Performance** - Very deep nesting may impact rendering performance

## Basic Nesting Examples

### Cards with Nested Content

```bash
::: card Installation Guide

Here's how to install the application:

::: callout tip Pro Tip
Make sure to download the correct version for your platform.
:::

::: button Download_Now /downloads

:::
```

::: card Installation Guide

Here's how to install the application:

::: callout tip Pro Tip
Make sure to download the correct version for your platform.
:::

::: button Download_Now /downloads

:::

### Tabs with Nested Content

```bash
::: tabs

== tab "Windows"
Download the Windows installer (.exe) file.

::: callout tip
Make sure to run as administrator for best results.
:::

::: button Download_Windows /downloads/windows

== tab "macOS"
Download the macOS package (.pkg) file.

::: callout warning
You may need to allow the app in Security & Privacy settings.
:::

::: button Download_macOS /downloads/macos

== tab "Linux"
Download the Linux tarball (.tar.gz) file.

::: button Download_Linux /downloads/linux

:::
```

::: tabs

== tab "Windows"
Download the Windows installer (.exe) file.

::: callout tip
Make sure to run as administrator for best results.
:::

::: button Download_Windows /downloads/windows

== tab "macOS"
Download the macOS package (.pkg) file.

::: callout warning
You may need to allow the app in Security & Privacy settings.
:::

::: button Download_macOS /downloads/macos

== tab "Linux"
Download the Linux tarball (.tar.gz) file.

::: button Download_Linux /downloads/linux

:::

## Advanced Nesting Patterns

### Complex Nested Structure

````bash
::: card Installation Guide

**Download**
Get the latest version for your platform.

::: button Download_Now /downloads

**Install**
Run the installer and follow the prompts.

```bash
install docmd
```

**Configure**
Set up your preferences.

::: callout warning Important
Don't forget to configure your settings!
:::

:::
````

::: card Installation Guide

**Download**
Get the latest version for your platform.

::: button Download_Now /downloads

**Install**
Run the installer and follow the prompts.

```bash
install docmd
```

**Configure**
Set up your preferences.

::: callout warning Important
Don't forget to configure your settings!
:::

:::

### Cards with Multiple Nested Elements

```markdown
::: card API Reference

::: callout info API Key Required
All API requests require a valid API key.
:::

**Setup Steps**

1. Get your API key from the dashboard
2. Include it in your request headers
3. Test your connection

::: button Test_API /api/test

:::
```

::: card API Reference

::: callout info API Key Required
All API requests require a valid API key.
:::

**Setup Steps**

1. Get your API key from the dashboard
2. Include it in your request headers
3. Test your connection

::: button Test_API /api/test

:::

## Steps Container

Steps containers are designed for simple, sequential instructions and work well with other containers:

```bash
::: steps

1. **Download the Application**
   Get the latest version from our download page.

   ::: button Download_Now /downloads

2. **Install the Application**
   Run the installer and follow the setup wizard.

   ::: callout tip Pro Tip
   Check our system requirements page for detailed information.
   :::

3. **Configure Settings**
   Set up your preferences and start using the app.

   ::: card Configuration
   - Choose your theme
   - Set up notifications
   - Configure integrations
   :::

:::
```

::: steps

1. **Download the Application**
   Get the latest version from our download page.

   ::: button Download_Now /downloads

2. **Install the Application**
   Run the installer and follow the setup wizard.

   ::: callout tip Pro Tip
   Check our system requirements page for detailed information.
   :::

3. **Configure Settings**
   Set up your preferences and start using the app.

   ::: card Configuration
   - Choose your theme
   - Set up notifications
   - Configure integrations
   :::

:::

## Troubleshooting

### Common Issues

1. **Container not rendering** - Ensure proper spacing and syntax
2. **Nested content not showing** - Check for proper closing tags
3. **Performance issues** - Reduce nesting depth if experiencing slowdowns

### Debugging Tips

- **Check syntax** - Ensure all containers have proper opening and closing tags
- **Verify nesting** - Make sure containers are properly nested
- **Test incrementally** - Build complex structures step by step
- **Use browser dev tools** - Inspect the generated HTML for issues
- **Use the right container** - Steps for simple sequences, cards/tabs for complex content

## Migration from v0.1.x

### Breaking Changes

- **Container parsing** - The internal parsing system has been optimized for reliability
- **Nesting behavior** - Most containers support seamless nesting

### What's New

- **Enhanced nesting** - Cards, tabs, callouts, and buttons support seamless nesting
- **Better performance** - Improved parsing performance for complex structures
- **Clear limitations** - Well-defined boundaries for what each container can do

### Backward Compatibility

- **Existing syntax** - All existing container syntax remains the same
- **Enhanced functionality** - New nesting capabilities are additive for supported containers

## Future Container Types

The nested container system is designed to be easily extensible. Future container types that could be added include:

- **Timeline containers** - For chronological content
- **Changelog containers** - For version history
- **FAQ containers** - For question-answer content
- **Gallery containers** - For image collections
- **Code playground containers** - For interactive code examples

The architecture supports adding new containers by simply defining them in the containers object and implementing their render functions. 