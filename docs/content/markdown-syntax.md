---
title: "Markdown Syntax Guide"
description: "Learn how to use Markdown syntax to format your documentation in docmd."
---

# Markdown Syntax

`docmd` uses `markdown-it` under the hood, which is a highly extensible and standards-compliant Markdown parser. It supports CommonMark syntax by default, along with some useful extensions like GitHub Flavored Markdown (GFM) tables and strikethrough.

## Common Elements

You can use all standard Markdown elements:

*   **Headings:**
    ```markdown
    # Heading 1
    ## Heading 2
    ### Heading 3
    ...
    ###### Heading 6
    ```
*   **Paragraphs:** Just type text. Separate paragraphs with a blank line.
*   **Emphasis:**
    ```markdown
    *This text will be italic.*
    _This will also be italic._

    **This text will be bold.**
    __This will also be bold.__

    ***This text will be bold and italic.***
    ```
*   **Lists:**
    *   **Unordered:**
        ```markdown
        * Item 1
        * Item 2
          * Nested Item 2a
          * Nested Item 2b
        + Item 3 (using +)
        - Item 4 (using -)
        ```
    *   **Ordered:**
        ```markdown
        1. First item
        2. Second item
        3. Third item
           1. Nested ordered item
        ```
*   **Links:**
    ```markdown
    [Link Text](https://www.example.com)
    [Link with Title](https://www.example.com "Link Title")
    [Relative Link to another page](../section/other-page/)
    ```
    *Note: For internal links to other documentation pages, use relative paths to the `.md` files. `docmd` will convert these to the correct HTML paths during the build.*

*   **Images:**
    ```markdown
    ![Alt text for image](/path/to/your/image.jpg "Optional Image Title")
    ```
    *Place images in your `docs/` directory (e.g., `docs/images/`) or a similar assets folder that gets copied to your `site/` output.*

*   **Blockquotes:**
    ```markdown
    > This is a blockquote.
    > It can span multiple lines.
    ```
*   **Horizontal Rules:**
    ```markdown
    ---
    ***
    ___
    ```
*   **Inline Code:**
    ```markdown
    Use `backticks` for inline code like `variableName`.
    ```

## Code Blocks & Syntax Highlighting

`docmd` uses `highlight.js` for automatic syntax highlighting of fenced code blocks. Specify the language after the opening triple backticks:

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
greet('docmd user');
```

```python
def hello():
    print("Hello from Python!")

hello()
```

```html
<div>
  <p>This is some HTML.</p>
</div>
```

```css
body {
  font-family: sans-serif;
  color: #333;
}
```

```bash
npm install -g docmd
docmd init my-docs
```

If you don't specify a language, `highlight.js` will attempt to auto-detect it, or it will be rendered as plain preformatted text.

## Tables (GFM Style)

You can create tables using GitHub Flavored Markdown syntax:

```bash
| Header 1 | Header 2 | Header 3 |
| :------- | :------: | -------: |
| Align L  | Center   | Align R  |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```
Renders as:

| Header 1 | Header 2 | Header 3 |
| :------- | :------: | -------: |
| Align L  | Center   | Align R  |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Strikethrough (GFM Style)

Wrap text with two tildes (`~~`) for strikethrough:
```bash
This is ~~strikethrough~~ text.
```
Renders as: This is ~~strikethrough~~ text.

## HTML

Because `markdown-it` is configured with `html: true`, you can embed raw HTML directly in your Markdown files. However, use this sparingly, as it can make your content less portable and harder to maintain.

```html
<div style="color: blue;">
  This is a blue div rendered directly from HTML.
</div>
```

For most formatting needs, standard Markdown and `docmd`'s [Custom Containers](/content/custom-containers/) should suffice.

# Advanced Markdown Capabilities

Beyond the basic syntax, `docmd` supports a variety of advanced Markdown features to help you create richer documentation.

## Example Callout

::: callout info
This is a real callout example to test container rendering. Callouts are great for highlighting important information.
:::

::: callout warning
**Warning!** Be careful when using advanced features, ensure they are properly documented.
:::

## GFM (GitHub Flavored Markdown)

docmd supports GitHub Flavored Markdown extensions including:

- **Task Lists** - Create interactive checklists:
  ```markdown
  - [x] Completed task
  - [ ] Incomplete task
  - [ ] Another item
  ```
  
  Renders as:
  - [x] Completed task
  - [ ] Incomplete task
  - [ ] Another item

- **Autolinked References** - URL and email addresses are automatically linked:
  ```markdown
  Visit https://docmd.mgks.dev for more information.
  Contact support@example.com for help.
  ```

- **Emoji** - Use emoji shortcodes:
  ```markdown
  I :heart: documentation! :rocket: :smile:
  ```
  
  Renders emoji symbols like: I ❤️ documentation! 🚀 😄

## Footnotes

You can add footnotes to your content for references or additional information[^1].

```markdown
Here's a statement that needs citation[^1].

[^1]: This is the footnote content.
```

Multiple footnotes can be used throughout your document[^2], and the definitions can be collected at the bottom.

[^1]: This is the first footnote reference.
[^2]: This is the second footnote with more information.

## Definition Lists

Some Markdown parsers support definition lists:

```markdown
Term
: Definition for the term.
: Another definition for the same term.

Another Term
: Definition of another term.
```

Term
: Definition for the term.
: Another definition for the same term.

Another Term
: Definition of another term.

## Abbreviations

You can define abbreviations in your Markdown (depending on plugin support):

```markdown
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

HTML is defined by the W3C standards.
```

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

HTML is defined by the W3C standards.

## Math Expressions

If enabled with the appropriate plugins, you can include mathematical expressions using LaTeX syntax:

```markdown
Inline math: $E=mc^2$

Block math:
$$
\frac{d}{dx}e^x = e^x
$$
```

## Container Extensions

Beyond standard Markdown, docmd provides custom containers for enhanced formatting. 
These are detailed in the [Custom Containers](/content/custom-containers/) guide, and include:

::: callout info
Use containers for callouts, cards, and steps to structure your documentation.
:::

## Conclusion

Markdown provides a powerful yet simple way to write and format documentation. With docmd's extensions and customizations, you can create rich, beautiful documentation that's easy to maintain.

For more examples and practical applications, check the rest of the documentation or browse the source of this page by viewing its Markdown file.