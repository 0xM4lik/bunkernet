/**
 * Module Registry & Dynamic UI Builder
 * Central aggregator for all interactive button & app window modules.
 */

import about from './about.js';
import work from './work.js';
import notes from './notes.js';
import matrix from './matrix.js';
import contact from './contact.js';
import { WindowManager } from '../window-manager.js';
import { sound } from '../audio.js';

export const modules = [
  about,
  work,
  notes,
  matrix,
  contact
];

export function getAllModules() {
  return modules;
}

export function getModuleById(id) {
  return modules.find(m => m.id === id);
}

export function getModuleByCommand(cmd) {
  const c = cmd.toLowerCase();
  return modules.find(m => m.command === c || m.id === c);
}

/**
 * Dynamically mounts all registered modules into the button grid and modal window containers.
 * @param {HTMLElement} gridContainer - Container element for ASCII buttons (#menuGrid)
 * @param {HTMLElement} windowsContainer - Container element for modal windows (#appWindowsContainer)
 */
export function mountModules(gridContainer, windowsContainer) {
  if (!gridContainer || !windowsContainer) return;

  // Clear existing content
  gridContainer.innerHTML = '';
  windowsContainer.innerHTML = '';

  // Split buttons into rows (3 in row 1, 2 in row 2)
  const row1 = document.createElement('div');
  row1.className = 'menu-row';
  const row2 = document.createElement('div');
  row2.className = 'menu-row';

  // 1. Build launcher buttons for main terminal
  modules.forEach((mod, index) => {
    const isExternal = Boolean(mod.url);
    const btn = document.createElement(isExternal ? 'a' : 'button');
    btn.className = 'ascii-btn';
    btn.setAttribute('data-window', mod.id);
    btn.setAttribute('aria-label', mod.label);

    if (isExternal) {
      btn.href = mod.url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.addEventListener('click', () => {
        sound.windowOpen();
      });
    } else {
      btn.addEventListener('click', () => {
        sound.windowOpen();
        WindowManager.open(mod.id);
      });
    }

    const pre = document.createElement('pre');
    pre.className = 'ascii-art';
    pre.textContent = mod.asciiArt;

    const span = document.createElement('span');
    span.className = 'ascii-label';
    span.setAttribute('data-text', mod.label);
    span.textContent = mod.label;

    btn.appendChild(pre);
    btn.appendChild(span);

    if (index < 3) {
      row1.appendChild(btn);
    } else {
      row2.appendChild(btn);
    }
  });

  // 2. Build modal windows for registered modal window modules
  modules.forEach((mod) => {
    if (mod.url) return;

    const win = document.createElement('div');
    win.className = `app-window ${mod.windowClass || ''}`.trim();
    win.id = `win-${mod.id}`;
    win.setAttribute('data-window-el', '');
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', `win-title-${mod.id}`);
    if (mod.baseWidth) win.setAttribute('data-base-w', mod.baseWidth);
    if (mod.baseHeight) win.setAttribute('data-base-h', mod.baseHeight);

    win.innerHTML = `
      <div class="resize-handle rh-n" data-dir="n"></div>
      <div class="resize-handle rh-s" data-dir="s"></div>
      <div class="resize-handle rh-e" data-dir="e"></div>
      <div class="resize-handle rh-w" data-dir="w"></div>
      <div class="resize-handle rh-nw" data-dir="nw"></div>
      <div class="resize-handle rh-ne" data-dir="ne"></div>
      <div class="resize-handle rh-sw" data-dir="sw"></div>
      <div class="resize-handle rh-se" data-dir="se" title="Resize">
        <svg class="resize-grip" viewBox="0 0 10 10" aria-hidden="true">
          <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="8" y1="8" x2="8" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="app-titlebar">
        <div class="traffic-lights">
          <button class="light close" data-close aria-label="Close ${mod.windowTitle || mod.label}" title="Close" type="button">
            <svg viewBox="0 0 8 8"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="title-text" id="win-title-${mod.id}">${mod.windowTitle || mod.label}</div>
      </div>
      <div class="app-content">${mod.id === 'matrix' ? (typeof mod.render === 'function' ? mod.render() : '') : ''}</div>
    `;

    // Attach close button listener
    const closeBtn = win.querySelector('[data-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => WindowManager.closeActive());
    }

    // Make window draggable & resizable
    WindowManager.makeDraggable(win);
    WindowManager.makeResizable(win, {
      onResize: (w, h) => {
        if (typeof mod.onResize === 'function') {
          mod.onResize(win, w, h);
        }
      }
    });

    windowsContainer.appendChild(win);
  });

  gridContainer.appendChild(row1);
  if (row2.children.length > 0) {
    gridContainer.appendChild(row2);
  }
}
