---
title: "Custom Containers"
description: "Enhance your documentation with special components like callouts, cards, and steps using docmd's custom container syntax."
---

# Custom Containers

`docmd` provides a simple syntax for adding richer, pre-styled components to your Markdown content using "custom containers." These are powered by the `markdown-it-container` plugin.

The general syntax is:

```
::: containerName [optionalTitleOrType]
Content for the container goes here.
It can span **multiple lines** and include other *Markdown* elements.
:::
```

## Callouts

Callouts are useful for highlighting important information, warnings, tips, or notes.

**Syntax:**
```
::: callout type
Content of the callout.
:::
```
*   `type`: Can be `info`, `warning`, `tip`, or `danger`.

**Examples:**

::: callout info
This is an informational message. It's good for general notes or neutral supplementary details.
:::

::: callout warning
**Watch out!** This indicates something that requires caution or might lead to unexpected results if ignored.
:::

::: callout tip
Here's a helpful tip or a best practice suggestion to improve a process or understanding.
:::

::: callout danger
**Critical!** This highlights a potential risk, a destructive action, or something that must be avoided.
:::

## Cards

Cards provide a visually distinct block for grouping related content, often with a title.

**Syntax:**
```
::: card Optional Card Title
The main body content of the card.
Supports **Markdown** formatting.
- List item 1
- List item 2
:::
```
*   `Optional Card Title`: If provided after `card`, it becomes the title of the card.

**Example:**

::: card My Feature Overview
This card describes an amazing feature.
* It's easy to use.
* It solves a common problem.

Learn more by reading the full guide.
:::

::: card
This is a card without an explicit title. The content starts directly.
Ideal for small, self-contained snippets.
:::

## Steps

The "steps" container is designed for presenting a sequence of actions or instructions, often in a numbered or ordered fashion.

**Syntax:**

```
::: steps
> 1. **First Step Title:**
> Description of the first step.

> 2. **Second Step Title:**
> Description of the second step.

> *. **Using Asterisk:**
> Alternative numbering style.

> **No Number:**
> Without a number.
:::
```

**How it works:**

The steps container uses blockquotes (`>`) to define individual steps. Start each step with a number or asterisk followed by a period, then the step title in bold. The content after the title becomes the step content.

**Example:**

::: steps
> 1. **Install Dependencies:**
> First, make sure you have Node.js and npm installed. Then, run:
>
> ```bash
> npm install my-package
> ```

> 2. **Configure the Settings:**
> Open the `config.json` file and update the `apiKey` with your credentials.

> 3. **Run the Application:**
> Start the application using:
>
> ```bash
> npm start
> ```
>
> You should see "Application started successfully!" in your console.
:::
:::

These custom containers allow you to create more engaging and structured documentation without needing to write custom HTML or CSS for common patterns. Experiment with them to see how they can improve your content's clarity and visual appeal.