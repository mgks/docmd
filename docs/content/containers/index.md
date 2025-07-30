---
title: "Custom Containers"
description: "Enhance your documentation with special components like callouts, cards, steps, and tabs using docmd's custom container syntax."
---

`docmd` provides a simple syntax for adding richer, pre-styled components to your Markdown content. These are powered by the `markdown-it-container` plugin.

The general syntax for simple containers like `callout` and `card` is:

```markdown
::: containerName [optionalTitleOrType]
Content for the container goes here.
:::
```

For more complex components like `steps` and `tabs`, we use a more robust and intuitive syntax that relies on standard Markdown, preventing common nesting issues.

## Advanced Nested Container System

With docmd v0.2.0, all containers support **seamless nesting** - you can nest any container within any other container to create complex, interactive documentation layouts.

**New in v0.2.0:** [Learn about nested containers →](./nested-containers)

## Available Containers

Select a container type from the list below or from the sidebar to see detailed usage instructions and examples.

- [**Callouts**](./callouts/) - For highlighting important information like notes, tips, and warnings.
- [**Cards**](./cards/) - For grouping related content into visually distinct blocks.
- [**Steps**](./steps/) - For presenting a sequence of instructions in a numbered format.
- [**Tabs**](./tabs/) - For organizing content in a switchable, tabbed interface.
- [**Buttons**](./buttons/) - For creating stylish, clickable calls to action.
- [**Nested Containers**](./nested-containers/) - For creating complex, interactive layouts with container nesting.

These custom containers allow you to create more engaging and structured documentation without needing to write custom HTML or CSS.