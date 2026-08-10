## Standard Containers

::: callout info "Callout semantic types" icon:info # Container comments starting with # are supported!
Callouts isolate information that requires attention. Choose from `info`, `tip`, `warning`, `danger`, or `success`.
::: /callout

::: card "Feature Highlight" icon:sparkles
Cards give content a distinct frame with optional title and icon. They support buttons, tags, tooltips, and nested Markdown.

##### Self-closing containers on dedicated lines don't require closing tags:
```
::: button "GitHub Repository" url:"external:https://github.com/docmd-io/docmd" icon:github
```
::: button "GitHub Repository" url:"external:https://github.com/docmd-io/docmd" icon:github
::: tag "v0.9.1 Release" style:success icon:check
::: /card

> Inline tags ::: tag "Standalone Tag" style:primary icon:star ::: /tag and tooltips ::: tip "Zero-configuration build engine" term:"Hover Tooltip" url:"external:https://docmd.io" ::: /tip use inline closing tags.