---
title: "Tabs Container"
description: "Create tabbed content sections with the tabs container for organizing related information."
---

# Tabs Container

The tabs container allows you to organize content into multiple tabbed sections, making it easy to present related information in a clean, organized way.

## Basic Usage

```markdown
::: tabs

== tab "First Tab"
Content for the first tab goes here.

== tab "Second Tab"
Content for the second tab goes here.

== tab "Third Tab"
Content for the third tab goes here.

:::
```

::: tabs

== tab "First Tab"
Content for the first tab goes here.

== tab "Second Tab"
Content for the second tab goes here.

== tab "Third Tab"
Content for the third tab goes here.

:::

## Tabs with Nested Content

### Tabs with Buttons

```markdown
::: tabs

== tab "Download"
Get the latest version of our application.

::: button Download_Here external:https://github.com/mgks/docmd/releases
::: button Learn_More #advanced-tabs
::: button NPM_Package external:https://www.npmjs.com/package/@mgks/docmd

== tab "Documentation"
Read our comprehensive documentation.

::: button View_Getting_Started #basic-usage
::: button API_Reference external:https://github.com/mgks/docmd/wiki
::: button View_Examples #advanced-tabs

:::
```

::: tabs

== tab "Download"
Get the latest version of our application.

::: button Download_Here external:https://github.com/mgks/docmd/releases
::: button Learn_More #advanced-tabs
::: button NPM_Package external:https://www.npmjs.com/package/@mgks/docmd

== tab "Documentation"
Read our comprehensive documentation.

::: button View_Getting_Started #basic-usage
::: button API_Reference external:https://github.com/mgks/docmd/wiki
::: button View_Examples #advanced-tabs

:::

### Tabs with Callouts

```markdown
::: tabs

== tab "Getting Started"
Welcome to our platform!

::: callout info Welcome
This is your first time here. Let's get you started!
:::

::: callout tip Pro Tip
Check out our quick start guide for the fastest setup.
:::

== tab "Advanced Features"
Explore advanced functionality.

::: callout warning Important
Some features require additional configuration.
:::

::: callout success Ready
You're all set to explore advanced features!
:::

:::
```

::: tabs

== tab "Getting Started"
Welcome to our platform!

::: callout info Welcome
This is your first time here. Let's get you started!
:::

::: callout tip Pro Tip
Check out our quick start guide for the fastest setup.
:::

== tab "Advanced Features"
Explore advanced functionality.

::: callout warning Important
Some features require additional configuration.
:::

::: callout success Ready
You're all set to explore advanced features!
:::

:::

## Complex Nested Structure

````bash
::: tabs

== tab "Nested Card Example"
::: card Installation Guide

**Download**
Get the latest version for your platform.

::: button Get_Latest external:https://github.com/mgks/docmd/releases

**Install**
Run the installer and follow the prompts.

```bash
install docmd
```

:::

== tab "Callout Example"

**Configure**
Set up your preferences.

::: callout warning Configuration
Don't forget to configure your settings!
:::

:::
````

::: tabs

== tab "Nested Card Example"
::: card Installation Guide

**Download**
Get the latest version for your platform.

::: button Get_Latest external:https://github.com/mgks/docmd/releases

**Install**
Run the installer and follow the prompts.

```bash
install docmd
```

:::

== tab "Callout Example"

**Configure**
Set up your preferences.

::: callout warning Configuration
Don't forget to configure your settings!
:::

:::

## Customization

Tabs containers automatically handle:

- **Responsive design** - Works on all screen sizes
- **Theme integration** - Matches your site's theme
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Smooth transitions** - Elegant tab switching animations

## Best Practices

1. **Clear Labels** - Use descriptive tab names
2. **Consistent Content** - Keep similar content types in each tab
3. **Logical Order** - Arrange tabs in a logical sequence
4. **Not Too Many** - Limit to 5-7 tabs for best usability
5. **Mobile Friendly** - Consider mobile users when organizing content

## Nesting Limitations

::: callout error Important Limitation
**Steps containers cannot be used inside tabs** due to parsing conflicts. If you need step-by-step instructions within tabs, use regular numbered lists or consider restructuring your content.
:::

- **Tabs cannot contain tabs** - This prevents infinite recursion
- **Steps inside tabs not supported** - Use regular ordered lists instead
- **Maximum depth** - While technically unlimited, keep it under 7 levels for readability
- **Performance** - Very deep nesting may impact rendering performance