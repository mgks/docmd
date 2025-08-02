---
title: "No-Style Page Example"
description: "An example of a page using the no-style feature"
noStyle: true
components:
  meta: true
  favicon: true
  css: true
  theme: true
  scripts: true
  mainScripts: true
copyCode: true
customHead: |
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 3rem;
      margin-bottom: 10px;
      color: #4a6cf7;
    }
    .header p {
      font-size: 1.2rem;
      color: #666;
    }
    .content {
      background-color: #f8f9fa;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4a6cf7;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 20px;
    }
    .button:hover {
      background-color: #3a5ce4;
    }
    [data-theme="dark"] {
      color-scheme: dark;
    }
    [data-theme="dark"] body {
      background-color: #121212;
      color: #e0e0e0;
    }
    [data-theme="dark"] .content {
      background-color: #1e1e1e;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    [data-theme="dark"] .header p {
      color: #aaa;
    }
  </style>
bodyClass: "no-style-example"
---

<div class="container">
  <div class="header">
    <h1>No-Style Page Example</h1>
    <p>This page demonstrates the no-style feature with a custom layout</p>
  </div>
  
  <div class="content">
    <h2>What is this page?</h2>
    <p>
      This is an example page that uses the <code>noStyle: true</code> frontmatter option to create a completely custom page layout.
      Unlike regular documentation pages, this page doesn't use the standard docmd layout with sidebar navigation and table of contents.
    </p>
    
    <h2>How does it work?</h2>
    <p>
      The <code>noStyle</code> option tells docmd to use a special template that only includes the components you explicitly request
      via the <code>components</code> object in frontmatter. This gives you complete control over the page structure.
    </p>
    
    <h2>Features enabled on this page:</h2>
    <ul>
      <li><strong>meta</strong>: Meta tags, title, and description for SEO</li>
      <li><strong>favicon</strong>: The site favicon</li>
      <li><strong>css</strong>: Basic CSS for markdown content</li>
      <li><strong>theme</strong>: Theme support for light/dark mode</li>
      <li><strong>scripts</strong>: JavaScript for functionality</li>
    </ul>
    
    <h2>Custom styling</h2>
    <p>
      This page includes custom CSS in the <code>customHead</code> frontmatter field. This allows you to define page-specific styles
      without affecting the rest of your site.
    </p>
    
    <a href="/content/no-style-pages/" class="button">Get Back to No-Style Pages Documentation</a>
  </div>
</div> 