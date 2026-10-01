/**
 * Site-wide Theme Engine & State Manager
 * Manages theme switching, CSS custom property application,
 * dynamic system preference (Light / Dark) auto-detection,
 * 3D canvas background color synchronization, Matrix rain adaptation,
 * and persistent theme preference storage in localStorage.
 */

import { sound } from './audio.js';
import { updateBackgroundTheme } from './background.js';
import { t, onLanguageChange } from './i18n.js';

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    tagline: 'Simple, ultra-readable dark theme with crisp typography',
    primaryHex: '#58a6ff',
    secondaryHex: '#bc8cff',
    bgHex: '#0d1117',
    primaryRgb: [88, 166, 255],
    nodeRgb: [88, 166, 255],
    lineRgb: [48, 54, 61],
    matrixColors: { bright: '#e6edf3', dim: '#58a6ff' },
    logoFilter: 'brightness(0) invert(92%)'
  },
  light: {
    id: 'light',
    name: 'Light',
    tagline: 'Simple, high-contrast light theme with maximum clarity',
    primaryHex: '#0969da',
    secondaryHex: '#8250df',
    bgHex: '#f6f8fa',
    primaryRgb: [9, 105, 218],
    nodeRgb: [9, 105, 218],
    lineRgb: [208, 215, 222],
    matrixColors: { bright: '#0969da', dim: '#656d76' },
    logoFilter: 'brightness(0) opacity(0.88)'
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    tagline: 'Classic cyberpunk green CRT phosphor monitor terminal',
    primaryHex: '#4dff9e',
    secondaryHex: '#7ab0ff',
    bgHex: '#000000',
    primaryRgb: [77, 255, 158],
    nodeRgb: [255, 255, 255],
    lineRgb: [255, 255, 255],
    matrixColors: { bright: '#e8fff2', dim: '#2fbf6f' },
    logoFilter: 'none'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    tagline: 'Subnautica Planet 4546B & Alterra PDA deep cyan aesthetic',
    primaryHex: '#00f0ff',
    secondaryHex: '#ff9d00',
    bgHex: '#010a14',
    primaryRgb: [0, 240, 255],
    nodeRgb: [0, 240, 255],
    lineRgb: [0, 200, 230],
    matrixColors: { bright: '#e0faff', dim: '#00a8b5' },
    logoFilter: 'hue-rotate(36deg) saturate(1.6) brightness(1.12)'
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    tagline: 'Iconic gothic dark palette with purple & pink accents',
    primaryHex: '#bd93f9',
    secondaryHex: '#ff79c6',
    bgHex: '#1e1f29',
    primaryRgb: [189, 147, 249],
    nodeRgb: [189, 147, 249],
    lineRgb: [255, 121, 198],
    matrixColors: { bright: '#ff79c6', dim: '#bd93f9' },
    logoFilter: 'hue-rotate(115deg) saturate(1.3)'
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    tagline: 'Arctic Scandinavian frost blues and cool dark slate',
    primaryHex: '#88c0d0',
    secondaryHex: '#81a1c1',
    bgHex: '#242933',
    primaryRgb: [136, 192, 208],
    nodeRgb: [136, 192, 208],
    lineRgb: [129, 161, 193],
    matrixColors: { bright: '#eceff4', dim: '#5e81ac' },
    logoFilter: 'hue-rotate(42deg) saturate(0.8) brightness(1.05)'
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    tagline: 'Classic DEC VT220 monochrome CRT warm amber phosphor glow',
    primaryHex: '#ffb000',
    secondaryHex: '#ff7700',
    bgHex: '#070502',
    primaryRgb: [255, 176, 0],
    nodeRgb: [255, 176, 0],
    lineRgb: [255, 190, 60],
    matrixColors: { bright: '#fff5d6', dim: '#cc8c00' },
    logoFilter: 'hue-rotate(-112deg) saturate(1.4) brightness(1.1)'
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    tagline: 'Cyberpunk Tokyo indigo night with neon blue highlights',
    primaryHex: '#7aa2f7',
    secondaryHex: '#bb9af7',
    bgHex: '#13141f',
    primaryRgb: [122, 162, 247],
    nodeRgb: [122, 162, 247],
    lineRgb: [187, 154, 247],
    matrixColors: { bright: '#c0caf5', dim: '#7aa2f7' },
    logoFilter: 'hue-rotate(150deg) saturate(1.2) brightness(1.1)'
  },
  gruvbox: {
    id: 'gruvbox',
    name: 'Gruvbox',
    tagline: 'Warm retro groove palette with autumn earth tones',
    primaryHex: '#fabd2f',
    secondaryHex: '#fe8019',
    bgHex: '#1d2021',
    primaryRgb: [250, 189, 47],
    nodeRgb: [250, 189, 47],
    lineRgb: [254, 128, 25],
    matrixColors: { bright: '#ebdbb2', dim: '#fabd2f' },
    logoFilter: 'hue-rotate(-120deg) saturate(1.5) brightness(1.15)'
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    tagline: 'Soothing pastel mocha palette with lavender & sky accents',
    primaryHex: '#cba6f7',
    secondaryHex: '#89dceb',
    bgHex: '#11111b',
    primaryRgb: [203, 166, 247],
    nodeRgb: [203, 166, 247],
    lineRgb: [137, 220, 235],
    matrixColors: { bright: '#cdd6f4', dim: '#cba6f7' },
    logoFilter: 'hue-rotate(130deg) saturate(1.4)'
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    tagline: 'High-contrast classic developer code palette with vivid lime & pink',
    primaryHex: '#a6e22e',
    secondaryHex: '#f92672',
    bgHex: '#1e1f1c',
    primaryRgb: [166, 226, 46],
    nodeRgb: [166, 226, 46],
    lineRgb: [249, 38, 114],
    matrixColors: { bright: '#f8f8f2', dim: '#a6e22e' },
    logoFilter: 'hue-rotate(-15deg) saturate(1.3) brightness(1.05)'
  }
};

const STORAGE_KEY = 'bunkernet_theme_v2';
let userThemePreference = 'system'; // 'system' | 'dark' | 'light' | 'matrix' | ...
let activeThemeId = 'dark';
const themeListeners = new Set();

/**
 * Detects whether the user's operating system prefers light or dark appearance.
 * @returns {'light' | 'dark'}
 */
export function getSystemThemeId() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
}

/**
 * Returns the user's configured preference ('system' or a specific theme ID).
 */
export function getThemePreference() {
  return userThemePreference;
}

/**
 * Retrieves the currently active theme configuration object.
 */
export function getCurrentTheme() {
  return THEMES[activeThemeId] || THEMES.dark;
}

/**
 * Returns a list of all available theme configurations.
 */
export function getAllThemes() {
  return Object.values(THEMES);
}

/**
 * Subscribe to theme change events.
 * @param {Function} callback - Function called with (newTheme, oldTheme, preference)
 */
export function onThemeChange(callback) {
  themeListeners.add(callback);
  return () => themeListeners.delete(callback);
}

/**
 * Applies a theme by ID, updating DOM attributes, background simulation, and localStorage.
 * Accepts 'system' / 'auto' to synchronize with operating system appearance.
 * @param {string} id - Theme ID or 'system'
 * @param {boolean} [playSound=false] - Whether to trigger sound effect
 * @returns {boolean} True if theme was found and applied
 */
export function applyTheme(id, playSound = false) {
  const targetId = (id || '').toLowerCase().trim();
  const oldTheme = getCurrentTheme();

  if (targetId === 'system' || targetId === 'auto' || targetId === 'default' || targetId === 'reset') {
    userThemePreference = 'system';
    activeThemeId = getSystemThemeId();

    try {
      localStorage.setItem(STORAGE_KEY, 'system');
      localStorage.removeItem('bunkernet_theme');
    } catch (e) {}

    document.documentElement.setAttribute('data-theme', activeThemeId);
    updateBackgroundTheme(THEMES[activeThemeId]);
  } else {
    const theme = THEMES[targetId];
    if (!theme) return false;

    userThemePreference = targetId;
    activeThemeId = targetId;

    try {
      localStorage.setItem(STORAGE_KEY, targetId);
      localStorage.removeItem('bunkernet_theme');
    } catch (e) {}

    document.documentElement.setAttribute('data-theme', targetId);
    updateBackgroundTheme(theme);
  }

  // Play sound if requested
  if (playSound && sound && typeof sound.pickup === 'function') {
    sound.pickup();
  }

  const current = getCurrentTheme();

  // Notify listeners
  themeListeners.forEach(listener => {
    try {
      listener(current, oldTheme, userThemePreference);
    } catch (err) {
      console.error('Error in theme listener:', err);
    }
  });

  return true;
}

/**
 * Cycles to the next available theme in the registry.
 * @param {boolean} [playSound=true]
 */
export function cycleNextTheme(playSound = true) {
  const keys = Object.keys(THEMES);
  const currentIndex = keys.indexOf(activeThemeId);
  const nextIndex = (currentIndex + 1) % keys.length;
  const nextThemeId = keys[nextIndex];
  applyTheme(nextThemeId, playSound);
  return THEMES[nextThemeId];
}

const ICONS = {
  auto: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.25"/><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor"/></svg>`,
  dark: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 9.5a6 6 0 1 1-7-7 5 5 0 0 0 7 7z" fill="currentColor" fill-opacity="0.2"/></svg>`,
  light: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/><line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/><line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/></svg>`,
  palette: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6.5" r="1" fill="currentColor"/><circle cx="8" cy="4.5" r="1" fill="currentColor"/><circle cx="11" cy="6.5" r="1" fill="currentColor"/><circle cx="11.5" cy="9.5" r="1" fill="currentColor"/><path d="M8 14.5a6.5 6.5 0 1 0-6.5-6.5c0 1.5 1 2.5 2.5 2.5h1.25a1.25 1.25 0 0 1 1.25 1.25c0 .75.5 1.75 1.5 1.75z"/></svg>`
};

/**
 * Sets up the authentic macOS titlebar theme popup menu and button.
 */
export function setupThemeMenu() {
  const wrap = document.getElementById('themeMenuWrap');
  const btn = document.getElementById('themeMenuBtn');
  const label = document.getElementById('themeBtnLabel');
  const iconWrap = document.getElementById('themeBtnIcon');
  const popover = document.getElementById('themeMenuPopover');

  if (!wrap || !btn || !popover) return;

  function renderPopoverItems() {
    const isAuto = userThemePreference === 'system';
    const isDark = !isAuto && activeThemeId === 'dark';
    const isLight = !isAuto && activeThemeId === 'light';

    const coreHtml = `
      <button class="macos-menu-item ${isAuto ? 'is-selected' : ''}" data-theme-id="system" type="button" role="menuitem" aria-label="Auto detect system theme">
        <span class="macos-menu-item-icon">${ICONS.auto}</span>
        <span class="macos-menu-item-label">${t('theme.auto')}</span>
        <span class="macos-menu-check">
          <svg viewBox="0 0 10 10"><polyline points="2 5.5 4.5 8 8 2.5"/></svg>
        </span>
      </button>
      <button class="macos-menu-item ${isDark ? 'is-selected' : ''}" data-theme-id="dark" type="button" role="menuitem" aria-label="Dark theme">
        <span class="macos-menu-item-icon">${ICONS.dark}</span>
        <span class="macos-menu-item-label">${t('theme.dark')}</span>
        <span class="macos-menu-check">
          <svg viewBox="0 0 10 10"><polyline points="2 5.5 4.5 8 8 2.5"/></svg>
        </span>
      </button>
      <button class="macos-menu-item ${isLight ? 'is-selected' : ''}" data-theme-id="light" type="button" role="menuitem" aria-label="Light theme">
        <span class="macos-menu-item-icon">${ICONS.light}</span>
        <span class="macos-menu-item-label">${t('theme.light')}</span>
        <span class="macos-menu-check">
          <svg viewBox="0 0 10 10"><polyline points="2 5.5 4.5 8 8 2.5"/></svg>
        </span>
      </button>
      <div class="macos-menu-divider" role="separator"></div>
      <div class="macos-menu-section-header">${t('theme.section')}</div>
    `;

    const stylizedThemes = Object.values(THEMES).filter(t => t.id !== 'dark' && t.id !== 'light');
    const stylizedHtml = stylizedThemes.map(t => {
      const isSelected = !isAuto && t.id === activeThemeId;
      return `
        <button class="macos-menu-item ${isSelected ? 'is-selected' : ''}" data-theme-id="${t.id}" type="button" role="menuitem">
          <span class="macos-menu-item-swatch" style="background-color: ${t.primaryHex};"></span>
          <span class="macos-menu-item-label">${t.name}</span>
          <span class="macos-menu-check">
            <svg viewBox="0 0 10 10"><polyline points="2 5.5 4.5 8 8 2.5"/></svg>
          </span>
        </button>
      `;
    }).join('');

    const hintHtml = `<div class="macos-menu-hint" aria-hidden="true">${t('theme.cliHint')}</div>`;
    popover.innerHTML = coreHtml + stylizedHtml + hintHtml;
  }

  function updateMenuUI(theme, pref) {
    const isAuto = (pref || userThemePreference) === 'system';
    const effectivePref = isAuto ? 'system' : (theme.id || activeThemeId);

    if (label) {
      if (isAuto) {
        label.textContent = 'Auto';
      } else if (effectivePref === 'dark') {
        label.textContent = t('theme.dark');
      } else if (effectivePref === 'light') {
        label.textContent = t('theme.light');
      } else {
        label.textContent = theme.name;
      }
    }

    if (iconWrap) {
      if (isAuto) {
        iconWrap.innerHTML = ICONS.auto;
      } else if (effectivePref === 'dark') {
        iconWrap.innerHTML = ICONS.dark;
      } else if (effectivePref === 'light') {
        iconWrap.innerHTML = ICONS.light;
      } else {
        iconWrap.innerHTML = ICONS.palette;
      }
    }

    if (btn) {
      if (isAuto) {
        btn.setAttribute('title', `${t('titlebar.theme')}: Auto (${theme.name})`);
      } else {
        btn.setAttribute('title', `${t('titlebar.theme')}: ${theme.name}`);
      }
    }

    renderPopoverItems();
  }

  // Set initial UI state
  renderPopoverItems();
  updateMenuUI(getCurrentTheme(), userThemePreference);

  function openMenu() {
    wrap.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    wrap.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (wrap.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Prevent titlebar drag on button & popover
  const stopProp = (e) => e.stopPropagation();
  btn.addEventListener('pointerdown', stopProp);
  btn.addEventListener('mousedown', stopProp);
  btn.addEventListener('touchstart', stopProp);
  popover.addEventListener('pointerdown', stopProp);
  popover.addEventListener('mousedown', stopProp);
  popover.addEventListener('touchstart', stopProp);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Handle item click
  popover.addEventListener('click', (e) => {
    const item = e.target.closest('.macos-menu-item');
    if (!item) return;
    e.stopPropagation();
    const themeId = item.getAttribute('data-theme-id');
    if (themeId) {
      applyTheme(themeId, true);
      closeMenu();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Subscribe to theme changes (e.g. from CLI or system preference changes)
  onThemeChange((theme, oldTheme, pref) => {
    updateMenuUI(theme, pref);
  });

  // Subscribe to language changes to update localized labels & hints
  onLanguageChange(() => {
    renderPopoverItems();
    updateMenuUI(getCurrentTheme(), userThemePreference);
  });
}

// Backward-compatibility alias
export const setupThemeDropdown = setupThemeMenu;

/**
 * Initializes the theme engine.
 * Automatically checks operating system preferences (prefers-color-scheme) by default
 * if no manual preference has been chosen. Also listens for dynamic OS appearance switches.
 */
export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}

  const urlTheme = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null;
  if (urlTheme && THEMES[urlTheme]) {
    userThemePreference = urlTheme;
    activeThemeId = urlTheme;
  } else if (!saved || saved === 'system' || saved === 'auto') {
    userThemePreference = 'system';
    activeThemeId = getSystemThemeId();
  } else if (THEMES[saved]) {
    userThemePreference = saved;
    activeThemeId = saved;
  } else {
    userThemePreference = 'system';
    activeThemeId = getSystemThemeId();
  }

  // Apply to DOM & 3D background immediately
  document.documentElement.setAttribute('data-theme', activeThemeId);
  updateBackgroundTheme(THEMES[activeThemeId]);

  // Set up live listener for system OS preference changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (userThemePreference === 'system') {
        const newSysId = getSystemThemeId();
        if (newSysId !== activeThemeId) {
          activeThemeId = newSysId;
          document.documentElement.setAttribute('data-theme', newSysId);
          updateBackgroundTheme(THEMES[newSysId]);
          const cur = getCurrentTheme();
          themeListeners.forEach(listener => {
            try {
              listener(cur, null, 'system');
            } catch (err) {
              console.error('Error in theme listener:', err);
            }
          });
        }
      }
    };

    if (mediaDark.addEventListener) {
      mediaDark.addEventListener('change', handleSystemChange);
    } else if (mediaDark.addListener) {
      mediaDark.addListener(handleSystemChange);
    }
  }
}
