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

import mermaid from 'mermaid';
import { fixSvgNamespaces } from './svg-utils.js';

(async function () {
  'use strict';
  let counter = 0;
  let iconsRegistered = false;


  function getThemeForElement(el: HTMLElement) {
    const container = el.closest('.mermaid-container') as HTMLElement | null;
    const customTheme = container?.dataset.theme || el.dataset.theme;
    if (customTheme) return customTheme;
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
  }

  async function renderAll() {
    if (!iconsRegistered) {
      try {
        mermaid.registerIconPacks([
          {
            name: 'icon',
            loader: () =>
              fetch('https://unpkg.com/@iconify-json/lucide@1/icons.json').then((res) => {
                if (!res.ok) throw new Error(`Failed to load icons: ${res.statusText}`);
                return res.json();
              }),
          },
        ]);
        iconsRegistered = true;
      } catch (e) {
        console.warn('Mermaid icon registration failed:', e);
      }
    }

    // Ensure DOM is settled
    await new Promise(resolve => requestAnimationFrame(resolve));

    const elements = document.querySelectorAll('.mermaid:not([data-processed="true"])') as NodeListOf<HTMLElement>;

    for (const el of elements) {
      if (!el.dataset.original) el.dataset.original = el.textContent || '';
      const code = el.dataset.original;

      try {
        const elemTheme = getThemeForElement(el);
        mermaid.initialize({ startOnLoad: false, theme: elemTheme as any, securityLevel: 'loose' });
        const id = `mermaid-svg-${counter++}`;
        const { svg } = await mermaid.render(id, code);

        // Apply container class first to establish styling context
        el.classList.add('docmd-mermaid-container');
        el.innerHTML = '';

        const parser = new DOMParser();
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper';
        // Fix missing xmlns:xlink declaration — mermaid.render() omits it (unlike
        // mermaid.run()) causing DOMParser to return <parsererror> for diagrams
        // that use xlink:href, most notably C4Context person icons.
        const svgDoc = parser.parseFromString(fixSvgNamespaces(svg), 'image/svg+xml');
        wrapper.appendChild(svgDoc.documentElement);

        const svgEl = wrapper.querySelector('svg');

        if (svgEl) {
          // Remove natural constraints to prevent label clipping when scaled via CSS transform
          svgEl.removeAttribute('style');
          svgEl.style.maxWidth = 'none';
          svgEl.style.maxHeight = 'none';
          svgEl.style.transformOrigin = 'center';
          svgEl.style.display = 'block';
          svgEl.style.margin = '0 auto';
        }

        // Control buttons - appended to the OUTER container so they stay fixed!
        const controls = document.createElement('div');
        controls.className = 'mermaid-controls';

        const btnStyle = 'background: var(--bg-color, #fff); border: 1px solid var(--border-color, #e4e4e7); border-radius: 6px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); width: 28px; height: 28px; color: var(--text-muted, #71717a);';

        const createBtn = (title: string, svgContent: string) => {
          const btn = document.createElement('button');
          btn.style.cssText = btnStyle;
          btn.title = title;
          const btnSvgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          btn.appendChild(btnSvgDoc.documentElement);
          return btn;
        };

        const zoomInBtn = createBtn('Zoom in', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>');
        const zoomOutBtn = createBtn('Zoom out', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>');
        const resetBtn = createBtn('Reset view', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>');
        const fullscreenBtn = createBtn('Fullscreen', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>');
        const upBtn = createBtn('Pan Up', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>');
        const downBtn = createBtn('Pan Down', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
        const leftBtn = createBtn('Pan Left', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>');
        const rightBtn = createBtn('Pan Right', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>');
        controls.style.gap = '4px';

        const row1 = document.createElement('div');
        row1.style.cssText = 'display: flex; gap: 4px;';
        row1.appendChild(zoomInBtn);
        row1.appendChild(zoomOutBtn);
        row1.appendChild(resetBtn);
        row1.appendChild(fullscreenBtn);

        const row2 = document.createElement('div');
        row2.style.cssText = 'display: flex; gap: 4px;';
        row2.appendChild(upBtn);
        row2.appendChild(downBtn);
        row2.appendChild(leftBtn);
        row2.appendChild(rightBtn);

        controls.appendChild(row1);
        controls.appendChild(row2);
        
        wrapper.appendChild(controls);
        el.appendChild(wrapper);

        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        const updateTransform = (skipTransition = false) => {
          if (svgEl) {
            svgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            svgEl.style.transition = (isDragging || skipTransition) ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
          }
        };

        const initView = () => {
          if (!svgEl) return;
          scale = 1;
          translateX = 0;
          translateY = 0;
          
          // Let the SVG naturally size itself with max constraints
          svgEl.style.width = '';
          svgEl.style.height = '';
          svgEl.style.maxWidth = '100%';
          svgEl.style.maxHeight = '420px';
          svgEl.style.transformOrigin = 'center';
          wrapper.style.height = 'auto'; // Remove any dynamic height
          
          updateTransform(true);
        };

        initView();

        const pan = (dx: number, dy: number) => {
           translateX += dx;
           translateY += dy;
           updateTransform();
        };

        const zoom = (factor: number) => {
           // Simple zoom from center
           scale *= factor;
           updateTransform();
        };

        zoomInBtn.addEventListener('click', () => zoom(1.25));
        zoomOutBtn.addEventListener('click', () => zoom(1 / 1.25));
        upBtn.addEventListener('click', () => pan(0, 50));
        downBtn.addEventListener('click', () => pan(0, -50));
        leftBtn.addEventListener('click', () => pan(50, 0));
        rightBtn.addEventListener('click', () => pan(-50, 0));
        resetBtn.addEventListener('click', () => { initView(); });

        fullscreenBtn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => console.warn(err));
          } else {
            document.exitFullscreen();
          }
        });

        document.addEventListener('fullscreenchange', () => {
          if (!svgEl) return;
          if (document.fullscreenElement === wrapper) {
            wrapper.classList.add('mermaid-fullscreen');
            svgEl.style.maxWidth = 'calc(100vw - 40px)';
            svgEl.style.maxHeight = 'calc(100vh - 40px)';
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
          } else {
            wrapper.classList.remove('mermaid-fullscreen');
            initView();
          }
        });

        wrapper.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX - translateX;
          startY = e.clientY - translateY;
          wrapper.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          e.preventDefault(); // Prevent text selection
          translateX = e.clientX - startX;
          translateY = e.clientY - startY;
          updateTransform();
        });

        const stopDrag = () => {
          if (!isDragging) return;
          isDragging = false;
          wrapper.style.cursor = 'grab';
          updateTransform(); // Trigger transition if needed
        };

        window.addEventListener('mouseup', stopDrag);
        wrapper.addEventListener('mouseleave', stopDrag);

        el.setAttribute('data-processed', 'true');

      } catch (err) {
        console.error(err);
        el.setAttribute('data-processed', 'error');
      }
    }
  }

  // 1. Initial Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }

  // 2. SPA Navigation Load
  document.addEventListener('docmd:page-mounted', renderAll);

  // 3. Render when a hidden Tab or Collapsible is opened
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('.docmd-tabs-nav-item, .collapsible-summary')) {
      setTimeout(renderAll, 50);
    }
  });

  // 4. Theme Toggle
  const themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        document.querySelectorAll('.mermaid').forEach(el => el.removeAttribute('data-processed'));
        renderAll();
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

})();