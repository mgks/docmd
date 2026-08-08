/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

function smartDedent(str) {
  const lines = str.split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  let minIndent = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    minIndent = Math.min(minIndent, indent);
  }

  if (!isFinite(minIndent) || minIndent === 0) return lines.join('\n');

  return lines.map(line =>
    line.startsWith(' '.repeat(minIndent)) ? line.slice(minIndent) : line
  ).join('\n');
}

function heroRule(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const lineContent = state.src.slice(start, max).trim();

  // Support both '::: hero' and ':::hero' (spaceless)
  const regex = /^:::\s*hero(?:\s+(.*))?$/;
  const match = lineContent.match(regex);
  if (!match) return false;
  if (silent) return true;

  const flagsStr = match[1] || '';
  const flags = {
    split: flagsStr.includes('layout:split'),
    slider: flagsStr.includes('layout:slider'),
    glow: flagsStr.includes('glow:true')
  };

  let nextLine = startLine;
  let found = false;
  let depth = 1;
  let fenceMarker = null;

  while (nextLine < endLine) {
    nextLine++;
    if (nextLine >= endLine) break;

    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextContent = state.src.slice(nextStart, nextMax).trim();

    if (!fenceMarker) {
      const match = nextContent.match(/^(`{3,}|~{3,})/);
      if (match) fenceMarker = match[1];
    } else if (nextContent.startsWith(fenceMarker)) {
      fenceMarker = null;
    }

    if (!fenceMarker) {
      if (nextContent.match(/^:::\s*[a-zA-Z]/) && !nextContent.match(/^:::\s*(button|embed|tag)\b/)) {
        depth++;
      } else if (nextContent.match(/^:::\s*$/)) {
        depth--;
        if (depth === 0) {
          found = true;
          break;
        }
      }
    }
  }
  if (!found) return false;

  // Extract content
  let content = '';
  for (let i = startLine + 1; i < nextLine; i++) {
    const lineStart = state.bMarks[i];
    const lineEnd = state.eMarks[i];
    content += state.src.slice(lineStart, lineEnd) + '\n';
  }

  const lines = content.split('\n');

  // Handle Sections based on separators (== side or == slide)
  if (flags.slider) {
    const slides = [];
    let currentSlide = null;
    let currentLines = [];

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();
        if (/^:::\s*(\/slide|endslide)\b/i.test(trimmed)) {
            continue;
        }
        if (trimmed.startsWith('== slide') || /^:::\s*slide\b/i.test(trimmed)) {
            if (currentSlide !== null) {
                slides.push(smartDedent(currentLines.join('\n')));
            }
            currentSlide = true;
            currentLines = [];
        } else {
            currentLines.push(rawLine);
        }
    }
    if (currentSlide !== null) slides.push(smartDedent(currentLines.join('\n')));

    const slideCount = slides.length;
    // Build Tokens
    const openToken = state.push('hero_open', 'div', 1);
    openToken.attrs = [['class', `docmd-hero hero-slider ${flags.glow ? 'hero-glow' : ''}`.trim()]];

    const trackToken = state.push('hero_slider_track_open', 'div', 1);
    trackToken.attrs = [['class', 'hero-slider-track']];

    slides.forEach(slideContent => {
        state.push('hero_slide_open', 'div', 1);
        const rendered = state.md.render(slideContent, { ...state.env, isInsideContainer: true });
        const html = state.push('html_block', '', 0);
        html.content = rendered;
        state.push('hero_slide_close', 'div', -1);
    });

    state.push('hero_slider_track_close', 'div', -1);

    // Inject controls (prev/next + dots)
    if (slideCount > 1) {
      const prevSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
      const nextSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      const dots = slides.map((_, i) => `<button class="hero-slider-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('');
      const controls = state.push('html_block', '', 0);
      controls.content = `<div class="hero-slider-controls">
  <button class="hero-slider-btn hero-slider-prev" aria-label="Previous slide">${prevSvg}</button>
  <div class="hero-slider-dots">${dots}</div>
  <button class="hero-slider-btn hero-slider-next" aria-label="Next slide">${nextSvg}</button>
</div>\n`;
    }

    state.push('hero_close', 'div', -1);

  } else if (flags.split) {
    const mainContentLines = [];
    const sideContentLines = [];
    let foundSeparator = false;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (rawLine.trim().startsWith('== side')) {
            foundSeparator = true;
            continue;
        }
        if (foundSeparator) sideContentLines.push(rawLine);
        else mainContentLines.push(rawLine);
    }

    const openToken = state.push('hero_open', 'div', 1);
    openToken.attrs = [['class', `docmd-hero hero-split ${flags.glow ? 'hero-glow' : ''}`.trim()]];

    // Main Section
    state.push('hero_content_open', 'div', 1);
    const renderedMain = state.md.render(smartDedent(mainContentLines.join('\n')), { ...state.env, isInsideContainer: true });
    const htmlMain = state.push('html_block', '', 0);
    htmlMain.content = renderedMain;
    state.push('hero_content_close', 'div', -1);

    // Side Section
    state.push('hero_side_open', 'div', 1);
    const renderedSide = state.md.render(smartDedent(sideContentLines.join('\n')), { ...state.env, isInsideContainer: true });
    const htmlSide = state.push('html_block', '', 0);
    htmlSide.content = renderedSide;
    state.push('hero_side_close', 'div', -1);

    state.push('hero_close', 'div', -1);

  } else {
    // Normal Banner Layout
    const openToken = state.push('hero_open', 'div', 1);
    openToken.attrs = [['class', `docmd-hero hero-banner ${flags.glow ? 'hero-glow' : ''}`.trim()]];

    state.push('hero_content_open', 'div', 1);
    const rendered = state.md.render(smartDedent(content), { ...state.env, isInsideContainer: true });
    const htmlAt = state.push('html_block', '', 0);
    htmlAt.content = rendered;
    state.push('hero_content_close', 'div', -1);

    state.push('hero_close', 'div', -1);
  }

  state.line = nextLine + 1;
  return true;
}

export default {
  name: 'hero',
  setup(md) {
    md.block.ruler.before('fence', 'docmd_hero', heroRule, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

    md.renderer.rules.hero_open = (tokens, idx) => `<div class="${tokens[idx].attrs[0][1]}">`;
    md.renderer.rules.hero_close = () => '</div>\n';
    md.renderer.rules.hero_content_open = () => '<div class="hero-content">\n';
    md.renderer.rules.hero_content_close = () => '</div>\n';
    md.renderer.rules.hero_side_open = () => '<div class="hero-side">\n';
    md.renderer.rules.hero_side_close = () => '</div>\n';
    md.renderer.rules.hero_slider_track_open = () => '<div class="hero-slider-track">\n';
    md.renderer.rules.hero_slider_track_close = () => '</div>\n';
    md.renderer.rules.hero_slide_open = () => '<div class="hero-slide">\n';
    md.renderer.rules.hero_slide_close = () => '</div>\n';
  }
};