/**
 * Terminal Window Controller & CRT Effects
 * Manages traffic light window state, dock restore pill, draggable terminal,
 * audio consent prompt, CRT phosphor ignition, and scramble-text effects.
 */

import { sound, enableAudioFromUserGesture, setAudioMuted } from './audio.js';
import { makeDraggable, makeResizable, WindowManager } from './window-manager.js';
import { setBackgroundControlsEnabled } from './background.js';
import { getModuleById } from './modules/index.js';
import { t, onLanguageChange } from './i18n.js';
import { config } from './config.js';

/** Detect mobile viewport — used to skip keyboard-triggering focus */
function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

let terminal = null;
let btnClose = null;
let btnMin = null;
let btnMax = null;
let desktopDock = null;
let dockRestore = null;
let dockLabel = null;

let isMaximized = false;
let isHidden = false;
let terminalState = 'open'; // 'open' | 'minimized' | 'closed'
let terminalDrag = null;
let terminalResize = null;
let promptDrag = null;

const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#01";

/**
 * Updates the terminal scale CSS custom property to dynamically scale internal contents.
 */
export function updateTerminalScale() {
  if (!terminal) return;
  const isMax = terminal.classList.contains('maximized');
  if (isMax) {
    const scale = Math.max(1.05, Math.min(2.4, Math.min(window.innerWidth / 920, window.innerHeight / 660)));
    terminal.style.setProperty('--term-scale', scale.toFixed(3));
    return;
  }

  const w = terminal.offsetWidth || 860;
  const h = terminal.offsetHeight || 600;
  const ratioW = w / 860;
  const ratioH = h / 600;
  // Floor of 0.88 guarantees text and buttons are never tiny or illegible on compact viewports
  const scale = Math.max(0.88, Math.min(2.4, Math.min(ratioW, ratioH)));
  terminal.style.setProperty('--term-scale', scale.toFixed(3));
}

/**
 * Displays the retro Audio Consent Prompt dialog with entrance animation & tactile drag.
 * @param {Function} onChoice - Callback invoked with boolean (true = sound on, false = muted).
 */
export function showAudioPrompt(onChoice) {
  const dialog = document.getElementById('audioPromptDialog');
  const box = document.getElementById('audioPromptBox');
  const titlebar = document.getElementById('audioPromptTitlebar');
  const btnYes = document.getElementById('btnAudioYes');
  const btnNo = document.getElementById('btnAudioNo');

  const btnClose = document.getElementById('btnAudioClose');

  if (!dialog || !btnYes || !btnNo) {
    if (typeof onChoice === 'function') onChoice(true);
    return;
  }

  // Localize prompt content and buttons
  const promptText = dialog.querySelector('.audio-prompt-text');
  if (promptText) promptText.textContent = t('audio.enableText');

  const yesLabel = btnYes.querySelector('.ascii-label');
  if (yesLabel) {
    yesLabel.textContent = t('audio.yes');
    yesLabel.setAttribute('data-text', t('audio.yes'));
  }
  btnYes.setAttribute('aria-label', t('audio.yesAria'));

  const noLabel = btnNo.querySelector('.ascii-label');
  if (noLabel) {
    noLabel.textContent = t('audio.no');
    noLabel.setAttribute('data-text', t('audio.no'));
  }
  btnNo.setAttribute('aria-label', t('audio.noAria'));

  // Close button on audio prompt gracefully dismisses with audio muted
  if (btnClose) {
    btnClose.setAttribute('aria-label', t('titlebar.close'));
    btnClose.setAttribute('title', t('titlebar.close'));
    btnClose.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setAudioMuted(true);
      dismiss(false);
    };
  }

  // Make prompt draggable silently without triggering pickup sound before consent
  if (box && titlebar) {
    promptDrag = makeDraggable(box, titlebar, { mode: 'transform', silent: true });
  }

  dialog.classList.add('visible');
  if (box) {
    box.classList.add('open-anim');
    box.addEventListener('animationend', () => {
      box.classList.remove('open-anim');
      box.style.opacity = '1';
      box.style.transform = 'translate(0px, 0px)';
    }, { once: true });
  }

  const keyHandler = (e) => {
    if (!dialog.classList.contains('visible')) return;
    if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
      window.removeEventListener('keydown', keyHandler);
      btnYes.click();
    } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
      window.removeEventListener('keydown', keyHandler);
      btnNo.click();
    }
  };
  window.addEventListener('keydown', keyHandler);

  function dismiss(choice) {
    window.removeEventListener('keydown', keyHandler);
    if (window.anime && box) {
      window.anime({
        targets: box,
        opacity: [1, 0],
        scale: [1, 0.92],
        translateY: [0, 10],
        duration: 220,
        easing: 'cubicBezier(0.4, 0, 0.2, 1)',
        complete: () => {
          dialog.classList.remove('visible');
          if (typeof onChoice === 'function') onChoice(choice);
        }
      });
    } else {
      dialog.classList.remove('visible');
      if (typeof onChoice === 'function') onChoice(choice);
    }
  }

  btnYes.onclick = () => {
    enableAudioFromUserGesture().then(() => {
      dismiss(true);
    });
  };

  btnNo.onclick = () => {
    setAudioMuted(true);
    dismiss(false);
  };
}

/**
 * Opens the main terminal window with sound and open animation.
 */
export function openTerminalWindow() {
  terminal = document.getElementById('terminal');
  if (!terminal) return;

  updateTerminalScale();
  setBackgroundControlsEnabled(false);
  sound.terminalOpen();
  terminal.style.visibility = 'visible';
  terminal.style.removeProperty('animation');
  terminal.classList.remove('closing', 'minimizing', 'unminimizing');
  void terminal.offsetWidth;
  terminal.classList.add('open');

  // Once the opening CSS animation completes, unlock transform for tactile drag-and-drop
  terminal.addEventListener('animationend', () => {
    if (!terminal.classList.contains('closing') && !terminal.classList.contains('minimizing') && !terminal.classList.contains('unminimizing')) {
      terminal.classList.remove('open');
      terminal.style.removeProperty('animation');
      terminal.style.opacity = '1';
      terminal.style.transform = 'translate(0px, 0px)';
    }
  }, { once: true });

  terminalState = 'open';
  isHidden = false;
  updateDockState('open');
}

/**
 * Orchestrates the step-by-step terminal reveal sequence.
 */
export function startTerminalSequence() {
  openTerminalWindow();
  setTimeout(revealLogo, 750);
  setTimeout(revealMenu, 1400);
  setTimeout(enablePrompt, 2000);
}

/**
 * Scrambles text content with random matrix glyphs before resolving to final text.
 * @param {HTMLElement} el - Target DOM element.
 * @param {string} finalText - The resolved string.
 * @param {Object} [opts] - Animation options (duration, delay, playSound, onComplete).
 */
export function scrambleTo(el, finalText, opts = {}) {
  if (!el) return;
  if (!window.anime || !finalText) {
    el.textContent = finalText || '';
    if (typeof opts.onComplete === 'function') opts.onComplete();
    return;
  }

  if (el._scrambleProxy) {
    window.anime.remove(el._scrambleProxy);
    el._scrambleProxy = null;
  }

  const original = finalText.split('');
  const length = original.length;
  const totalSteps = Math.max(16, Math.min(36, Math.floor(length * 3)));
  const proxy = { f: 0 };
  el._scrambleProxy = proxy;

  const origin = opts.origin || 'center';
  const isReveal = Boolean(opts.reveal);
  const mid = (length - 1) / 2;
  const maxDist = Math.max(mid, length - 1 - mid);

  window.anime({
    targets: proxy,
    f: totalSteps,
    round: 1,
    easing: 'easeOutQuad',
    duration: opts.duration || 350,
    delay: opts.delay || 0,
    update: () => {
      const isWindowActive = el.closest('.app-window')
        ? !el.closest('.app-window').classList.contains('closing')
        : (terminalState !== 'closed' && terminalState !== 'minimized');
      if (!el.isConnected || !isWindowActive) {
        window.anime.remove(proxy);
        el.textContent = finalText;
        el._scrambleProxy = null;
        return;
      }
      const progress = proxy.f / totalSteps;
      let output = '';

      if (isReveal) {
        // Initial decode reveal: characters start scrambled and resolve from center outward
        if (origin === 'left') {
          const revealCount = Math.floor(progress * length);
          for (let i = 0; i < length; i++) {
            if (i < revealCount) {
              output += original[i];
            } else if (original[i] === ' ') {
              output += ' ';
            } else {
              output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
          }
        } else {
          const revealRadius = progress * (maxDist + 0.55);
          for (let i = 0; i < length; i++) {
            const distFromMid = Math.abs(i - mid);
            if (distFromMid <= revealRadius) {
              output += original[i];
            } else if (original[i] === ' ') {
              output += ' ';
            } else {
              output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
          }
        }
      } else {
        // Kinetic scramble wave on hover: matrix perturbation propagates from center outwards
        for (let i = 0; i < length; i++) {
          if (original[i] === ' ') {
            output += ' ';
            continue;
          }
          const normDist = origin === 'left'
            ? (length > 1 ? (i / (length - 1)) : 0)
            : (maxDist > 0 ? (Math.abs(i - mid) / maxDist) : 0);

          const startScramble = normDist * 0.32;
          const endScramble = startScramble + 0.48;

          if (progress >= startScramble && progress < endScramble) {
            output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          } else {
            output += original[i];
          }
        }
      }

      el.textContent = output;
      if (opts.playSound && Math.random() > 0.65) {
        sound.streamTick();
      }
    },
    complete: () => {
      el.textContent = finalText;
      el._scrambleProxy = null;
      if (typeof opts.onComplete === 'function') opts.onComplete();
    }
  });
}

/**
 * Streams text character-by-character with mechanical typing sound and temporary cursor.
 * @param {HTMLElement} el - Target DOM element.
 * @param {string} finalText - The resolved string.
 * @param {Object} [opts] - Options (duration, delay, onComplete, playSound).
 */
export function typewriterTo(el, finalText, opts = {}) {
  if (!el) return;
  const parentWin = el.closest('.app-window');
  const termWin = el.closest('.terminal');
  if (!el.isConnected ||
      (parentWin && (!parentWin.classList.contains('open') || parentWin.classList.contains('closing'))) ||
      (termWin && (terminalState !== 'open' || termWin.classList.contains('closing')))) {
    el.textContent = finalText;
    if (typeof opts.onComplete === 'function') opts.onComplete();
    return;
  }

  if (!window.anime) {
    el.textContent = finalText;
    if (typeof opts.onComplete === 'function') opts.onComplete();
    return;
  }

  const length = finalText.length;
  const proxy = { f: 0 };
  const cursor = document.createElement('span');
  cursor.className = 'term-cursor';
  el.textContent = '';
  el.appendChild(cursor);

  window.anime.remove(proxy);
  window.anime({
    targets: proxy,
    f: length,
    round: 1,
    easing: 'linear',
    duration: opts.duration || Math.min(450, Math.max(180, length * 16)),
    delay: opts.delay || 0,
    update: () => {
      if (!el.isConnected ||
          (parentWin && (!parentWin.classList.contains('open') || parentWin.classList.contains('closing'))) ||
          (termWin && (terminalState !== 'open' || termWin.classList.contains('closing')))) {
        window.anime.remove(proxy);
        el.textContent = finalText;
        if (cursor.parentNode) cursor.remove();
        return;
      }
      const cur = Math.floor(proxy.f);
      el.textContent = finalText.substring(0, cur);
      el.appendChild(cursor);
      if (opts.playSound !== false) {
        sound.streamTick();
      }
    },
    complete: () => {
      el.textContent = finalText;
      cursor.remove();
      if (typeof opts.onComplete === 'function') opts.onComplete();
    }
  });
}

/**
 * Streams full TUI page contents character-by-character from top to bottom,
 * with mechanical switch audio ticks and instant click-to-skip.
 * @param {HTMLElement} containerEl - The module content container (.app-content).
 * @param {string|Object} [htmlInput] - The HTML template string or options.
 * @param {Object} [options] - Options (onComplete, speed).
 */
export function streamFullPageTUI(containerEl, htmlInput, options = {}) {
  if (typeof htmlInput === 'object' && htmlInput !== null && !options.onComplete) {
    options = htmlInput;
    htmlInput = null;
  }

  if (!containerEl) return;

  const targetHTML = htmlInput || containerEl.innerHTML;
  if (!targetHTML || !targetHTML.trim()) {
    if (typeof options.onComplete === 'function') options.onComplete();
    return;
  }

  const parentWin = containerEl.closest('.app-window');
  const terminalWin = containerEl.closest('.terminal');

  const isParentClosed = () => {
    if (!containerEl.isConnected) return true;
    if (parentWin && (!parentWin.classList.contains('open') || parentWin.classList.contains('closing') || parentWin.style.display === 'none')) {
      return true;
    }
    if (terminalWin && (terminalState !== 'open' || terminalWin.classList.contains('closing') || terminalWin.style.visibility === 'hidden')) {
      return true;
    }
    return false;
  };

  // If container's window is already closed/closing or disconnected, don't stream
  if (isParentClosed()) {
    containerEl.innerHTML = targetHTML;
    if (typeof options.onComplete === 'function') options.onComplete();
    return;
  }

  // Cancel any existing stream on this container or window
  if (typeof containerEl._abortStream === 'function') {
    containerEl._abortStream();
  }
  if (parentWin && typeof parentWin._abortStream === 'function') {
    parentWin._abortStream();
  }

  // If container is matrix or has canvas, do not wipe canvas
  if (containerEl.querySelector('canvas') || targetHTML.includes('<canvas')) {
    containerEl.innerHTML = targetHTML;
    if (typeof options.onComplete === 'function') options.onComplete();
    return;
  }

  let isSkipped = false;
  let timerId = null;
  let currentCursor = null;

  function cleanup() {
    containerEl.removeEventListener('click', finalizeAll);
    window.removeEventListener('keydown', finalizeAll);
  }

  function abort() {
    if (isSkipped) return;
    isSkipped = true;

    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (currentCursor) {
      currentCursor.remove();
      currentCursor = null;
    }
    cleanup();
    if (containerEl._abortStream === abort) {
      containerEl._abortStream = null;
    }
    if (parentWin && parentWin._abortStream === abort) {
      parentWin._abortStream = null;
    }
  }

  containerEl._abortStream = abort;
  if (parentWin) {
    parentWin._abortStream = abort;
  }

  // Mount structure and immediately blank text content to prevent ANY flash
  containerEl.innerHTML = targetHTML;

  // Collect sequential text units
  const units = [];

  function collectUnits(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttribute('data-no-stream') || (node.closest && node.closest('[data-no-stream]'))) {
        return;
      }
      if (node.tagName === 'PRE') {
        units.push({ el: node, text: node.textContent, isPre: true });
        return;
      }
      if (node.classList.contains('tui-actions') || node.classList.contains('tui-links-row')) {
        Array.from(node.children).forEach(btn => {
          units.push({
            el: btn,
            text: btn.textContent,
            rawHtml: btn.querySelector('svg') ? btn.innerHTML : null,
            isPre: false
          });
        });
        return;
      }
      if (
        node.classList.contains('tui-spec-key') ||
        node.classList.contains('tui-spec-val') ||
        node.classList.contains('tui-neofetch-title') ||
        node.classList.contains('tui-neofetch-divider') ||
        node.classList.contains('tui-palette-swatches') ||
        node.classList.contains('tui-heading') ||
        node.classList.contains('tui-line') ||
        node.classList.contains('tui-bright') ||
        node.classList.contains('tui-dim') ||
        node.classList.contains('tui-btn') ||
        node.classList.contains('tui-tree-branch') ||
        node.classList.contains('tui-tree-label')
      ) {
        units.push({
          el: node,
          text: node.textContent,
          rawHtml: node.querySelector('svg') ? node.innerHTML : null,
          isPre: false
        });
        return;
      }
      if (node.children.length === 0 && node.textContent.trim()) {
        units.push({ el: node, text: node.textContent, isPre: false });
        return;
      }
      Array.from(node.children).forEach(collectUnits);
    }
  }

  collectUnits(containerEl);

  // Blank all text units initially
  units.forEach(u => { u.el.textContent = ''; });

  const globeEl = containerEl.querySelector('.tui-globe-pre');
  let initialDelay = 0;
  if (globeEl) {
    if (parentWin) {
      const modId = parentWin.id.replace('win-', '');
      const mod = getModuleById(modId);
      if (mod && typeof mod.onOpen === 'function') {
        mod.onOpen(parentWin);
      }
    }
    globeEl.classList.add('revealed');
    sound.logoPop();
    initialDelay = 550;
  }

  function finalizeAll() {
    if (isSkipped) return;
    isSkipped = true;

    if (timerId) clearTimeout(timerId);
    if (currentCursor) {
      currentCursor.remove();
      currentCursor = null;
    }

    units.forEach(u => {
      if (u.rawHtml) {
        u.el.innerHTML = u.rawHtml;
      } else {
        u.el.textContent = u.text;
      }
    });

    cleanup();
    if (containerEl._abortStream === abort) {
      containerEl._abortStream = null;
    }
    if (parentWin && parentWin._abortStream === abort) {
      parentWin._abortStream = null;
    }
    if (typeof options.onComplete === 'function') options.onComplete();
  }

  containerEl.addEventListener('click', finalizeAll, { once: true });
  window.addEventListener('keydown', finalizeAll, { once: true });

  let unitIdx = 0;
  let charIdx = 0;

  // Calculate speed: roughly 750ms total sequence across all characters
  const totalChars = units.reduce((acc, u) => acc + u.text.length, 0);
  const msPerChar = Math.max(5, Math.min(14, Math.floor(750 / (totalChars || 1))));

  function step() {
    if (isSkipped) return;

    if (isParentClosed()) {
      abort();
      return;
    }

    if (unitIdx >= units.length) {
      if (currentCursor) currentCursor.remove();
      finalizeAll();
      return;
    }

    const unit = units[unitIdx];
    const fullText = unit.text;

    if (charIdx === 0) {
      if (currentCursor) currentCursor.remove();
      currentCursor = document.createElement('span');
      currentCursor.className = 'term-cursor';
      unit.el.appendChild(currentCursor);
    }

    if (charIdx < fullText.length) {
      charIdx++;
      unit.el.textContent = fullText.substring(0, charIdx);
      unit.el.appendChild(currentCursor);
      if (charIdx % 2 === 0) {
        if (!isParentClosed()) {
          sound.streamTick();
        }
      }
      timerId = setTimeout(step, msPerChar);
    } else {
      // Finished current unit
      if (unit.rawHtml) {
        unit.el.innerHTML = unit.rawHtml;
      } else {
        unit.el.textContent = fullText;
      }
      if (currentCursor) currentCursor.remove();
      currentCursor = null;
      unitIdx++;
      charIdx = 0;
      timerId = setTimeout(step, Math.max(10, msPerChar * 2));
    }
  }

  if (initialDelay > 0) {
    timerId = setTimeout(step, initialDelay);
  } else {
    step();
  }
}

/**
 * Backward compatibility alias for streamFullPageTUI.
 */
export const streamTUIContent = streamFullPageTUI;

/**
 * Triggers the CRT ignition reveal sequence on the logo with audio,
 * then seamlessly transitions to a steady faint phosphor glow.
 */
export function revealLogo() {
  const logo = document.getElementById('asciiLogo');
  const wrap = document.getElementById('logoWrap');
  if (!logo) return;

  sound.logoPop();
  logo.classList.add('revealed');
  if (wrap) wrap.classList.add('revealed');

  setTimeout(() => {
    logo.classList.remove('revealed');
    logo.classList.add('glow');
    if (wrap) {
      wrap.classList.remove('revealed');
      wrap.classList.add('glow');
    }
  }, 750);
}

/**
 * Resets terminal internal components (logo, menu, prompt) to initial state
 * so the full boot/reveal sequence can replay smoothly without flash.
 */
export function resetTerminalContentForReveal() {
  const logo = document.getElementById('asciiLogo');
  const wrap = document.getElementById('logoWrap');
  const grid = document.getElementById('menuGrid');
  const promptLine = document.getElementById('promptLine');
  const promptHistory = document.getElementById('promptHistory');
  const promptInput = document.getElementById('promptInput');

  if (wrap) {
    wrap.classList.remove('revealed', 'glow');
  }

  if (logo) {
    logo.classList.remove('revealed', 'glow');
    logo.style.removeProperty('animation');
    logo.style.removeProperty('opacity');
    logo.style.removeProperty('transform');
    void logo.offsetWidth;
  }

  if (grid) {
    if (window.anime) window.anime.remove(grid);
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(10px)';
    document.querySelectorAll('.ascii-label').forEach(label => {
      const txt = label.getAttribute('data-text') || '';
      label.textContent = txt ? txt.replace(/[^\s]/g, '#') : '';
    });
  }

  if (promptHistory) {
    promptHistory.innerHTML = '';
  }
  if (promptInput) {
    promptInput.value = '';
  }

  if (promptLine) {
    if (window.anime) window.anime.remove(promptLine);
    promptLine.style.opacity = '0';
  }
}

/**
 * Updates the desktop dock item and dock bar visibility.
 * The dock is ONLY shown when the terminal is minimized or closed.
 * @param {'open'|'minimized'|'closed'} state - The window state.
 */
export function updateDockState(state) {
  if (!desktopDock) {
    desktopDock = document.getElementById('desktopDock');
  }
  if (!dockRestore) {
    dockRestore = document.getElementById('dockRestore');
  }

  if (state === 'open') {
    if (desktopDock) {
      desktopDock.classList.remove('visible');
    }
    if (dockRestore) {
      dockRestore.classList.remove('is-open', 'is-minimized', 'dock-bounce');
    }
    return;
  }

  // When minimized or closed, the dock slides into view
  if (desktopDock) {
    desktopDock.classList.add('visible');
  }

  if (dockRestore) {
    dockRestore.classList.remove('is-open', 'is-minimized', 'dock-bounce');
    if (state === 'minimized') {
      dockRestore.classList.add('is-minimized');
      void dockRestore.offsetWidth;
      dockRestore.classList.add('dock-bounce');
    }
  }
}

function showDockRestore(kind) {
  updateDockState(kind);
}

/**
 * Initializes button hover scramble effects and ASCII art animations.
 */
export function initButtonScrambles() {
  document.querySelectorAll('.ascii-btn').forEach(btn => {
    const label = btn.querySelector('.ascii-label');
    const artEl = btn.querySelector('.ascii-art');
    const winId = btn.getAttribute('data-window');
    const mod = getModuleById(winId);

    let animTimer = null;
    let frameToggle = false;

    const startArtAnimation = () => {
      if (!artEl || !mod) return;
      if (animTimer) clearInterval(animTimer);

      if (Array.isArray(mod.hoverFrames) && mod.hoverFrames.length > 0) {
        let frameIdx = 0;
        artEl.textContent = mod.hoverFrames[frameIdx];
        animTimer = setInterval(() => {
          frameIdx = (frameIdx + 1) % mod.hoverFrames.length;
          artEl.textContent = mod.hoverFrames[frameIdx];
        }, mod.hoverInterval || 450);
      } else if (typeof mod.getHoverFrame === 'function') {
        artEl.textContent = mod.getHoverFrame();
        animTimer = setInterval(() => {
          artEl.textContent = mod.getHoverFrame();
        }, mod.hoverInterval || 350);
      } else if (mod.asciiArtHover) {
        frameToggle = true;
        artEl.textContent = mod.asciiArtHover;
        animTimer = setInterval(() => {
          frameToggle = !frameToggle;
          artEl.textContent = frameToggle ? mod.asciiArtHover : mod.asciiArt;
        }, mod.hoverInterval || 450);
      }
    };

    const stopArtAnimation = () => {
      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
      }
      if (artEl && mod && mod.asciiArt) {
        artEl.textContent = mod.asciiArt;
      }
      frameToggle = false;
    };

    if (label) {
      btn.addEventListener('mouseenter', () => {
        const currentText = label.getAttribute('data-text') || (mod ? mod.label : label.textContent);
        scrambleTo(label, currentText, { duration: 350 });
        if (!btn.closest('#audioPromptDialog')) {
          sound.hoverBlip();
        }
        startArtAnimation();
      });
      btn.addEventListener('focus', () => {
        const currentText = label.getAttribute('data-text') || (mod ? mod.label : label.textContent);
        scrambleTo(label, currentText, { duration: 350 });
        startArtAnimation();
      });
      btn.addEventListener('mouseleave', stopArtAnimation);
      btn.addEventListener('blur', stopArtAnimation);
    }
  });
}

/**
 * Reveals the ASCII launcher menu grid with staggered text scrambling.
 */
export function revealMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  if (window.anime) {
    window.anime({
      targets: grid,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 500,
      easing: 'easeOutQuad'
    });
  } else {
    grid.style.opacity = '1';
  }

  grid.querySelectorAll('.ascii-label').forEach((label, i) => {
    const finalText = label.getAttribute('data-text');
    scrambleTo(label, finalText, { delay: 150 + i * 100, duration: 400, reveal: true });
  });
}

/**
 * Enables the interactive CLI input prompt and plays ready chime.
 */
export function enablePrompt() {
  sound.ready();
  const promptLine = document.getElementById('promptLine');
  if (promptLine) {
    if (window.anime) {
      window.anime({
        targets: promptLine,
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad'
      });
    } else {
      promptLine.style.opacity = '1';
    }
  }
  setTimeout(() => {
    const input = document.getElementById('promptInput');
    if (input && !isMobile()) input.focus();
  }, 420);
}

/**
 * Initializes terminal traffic lights and window controls.
 */
export function initTerminal() {
  terminal = document.getElementById('terminal');
  const titlebar = document.getElementById('titlebar');
  btnClose = document.getElementById('btnClose');
  btnMin = document.getElementById('btnMin');
  btnMax = document.getElementById('btnMax');
  desktopDock = document.getElementById('desktopDock');
  dockRestore = document.getElementById('dockRestore');
  dockLabel = document.getElementById('dockLabel');
  const ghBtn = document.getElementById('terminalGithubBtn');
  const ghLabel = document.getElementById('terminalGithubLabel');

  function updateTerminalChromeTitles() {
    if (btnClose) {
      btnClose.setAttribute('aria-label', t('titlebar.close'));
      btnClose.setAttribute('title', t('titlebar.close'));
    }
    if (btnMin) {
      btnMin.setAttribute('aria-label', t('titlebar.min'));
      btnMin.setAttribute('title', t('titlebar.min'));
    }
    if (btnMax) {
      btnMax.setAttribute('aria-label', t('titlebar.max'));
      btnMax.setAttribute('title', t('titlebar.max'));
    }
    const rhSe = document.querySelector('.rh-se');
    if (rhSe) rhSe.setAttribute('title', t('titlebar.resize'));

    if (dockRestore) {
      dockRestore.setAttribute('aria-label', t('dock.terminal'));
      dockRestore.setAttribute('title', t('dock.terminal'));
      const tooltip = dockRestore.querySelector('.dock-tooltip');
      if (tooltip) tooltip.textContent = t('dock.terminal');
    }

    if (ghBtn) {
      const ghText = t('terminal.github');
      const ghAria = t('terminal.githubAria');
      ghBtn.setAttribute('aria-label', ghAria);
      ghBtn.setAttribute('title', ghText);
      if (ghLabel) {
        ghLabel.textContent = ghText;
        ghLabel.setAttribute('data-text', ghText);
      }
    }
  }

  updateTerminalChromeTitles();
  onLanguageChange(updateTerminalChromeTitles);

  if (ghBtn) {
    if (config.repoUrl) {
      ghBtn.href = config.repoUrl;
    }
    ghBtn.addEventListener('mouseenter', () => {
      ghBtn.classList.add('is-hovered');
      sound.hoverBlip();
      if (ghLabel) {
        const text = t('terminal.github');
        scrambleTo(ghLabel, text, { duration: 260 });
      }
    });
    ghBtn.addEventListener('mouseleave', () => {
      ghBtn.classList.remove('is-hovered');
    });
    ghBtn.addEventListener('focus', () => {
      ghBtn.classList.add('is-hovered');
      if (ghLabel) {
        const text = t('terminal.github');
        scrambleTo(ghLabel, text, { duration: 260 });
      }
    });
    ghBtn.addEventListener('blur', () => {
      ghBtn.classList.remove('is-hovered');
    });
    ghBtn.addEventListener('click', () => {
      sound.keyTick();
    });
  }

  // Initialize tactile drag with pickup elevation & dynamic tilt on main terminal
  if (terminal && titlebar) {
    terminalDrag = makeDraggable(terminal, titlebar, { mode: 'transform' });
  }

  // Initialize 8-directional drag resizing with dynamic content scaling
  if (terminal) {
    terminalResize = makeResizable(terminal, {
      minWidth: 360,
      minHeight: 240,
      onResize: updateTerminalScale
    });
    updateTerminalScale();
  }

  window.addEventListener('resize', updateTerminalScale);

  // Disable browser page zoom and zoom/resize the active window or terminal on Ctrl + Wheel / Trackpad pinch
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const activeWin = WindowManager.getActiveWindow();
      if (activeWin && activeWin.classList.contains('open')) {
        const curW = activeWin.offsetWidth;
        const curH = activeWin.offsetHeight;
        const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
        const minW = 320;
        const minH = 200;
        const maxW = Math.max(minW, window.innerWidth - 20);
        const maxH = Math.max(minH, window.innerHeight - 20);

        const targetW = Math.min(maxW, Math.max(minW, Math.round(curW * zoomFactor)));
        const targetH = Math.min(maxH, Math.max(minH, Math.round(curH * zoomFactor)));

        activeWin.style.width = `${targetW}px`;
        activeWin.style.height = `${targetH}px`;
        WindowManager.center(activeWin);
        return;
      }

      if (!terminal || terminal.classList.contains('maximized') || terminal.style.visibility === 'hidden' || isHidden) {
        return;
      }

      const currentW = terminal.offsetWidth;
      const currentH = terminal.offsetHeight;
      const minW = 360;
      const minH = 240;
      const maxW = Math.max(minW, window.innerWidth - 20);
      const maxH = Math.max(minH, window.innerHeight - 20);

      // negative deltaY is zoom in (scroll up), positive is zoom out (scroll down)
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      let targetW = Math.round(currentW * zoomFactor);
      let targetH = Math.round(currentH * zoomFactor);

      targetW = Math.min(maxW, Math.max(minW, targetW));
      targetH = Math.min(maxH, Math.max(minH, targetH));

      terminal.style.width = `${targetW}px`;
      terminal.style.height = `${targetH}px`;
      updateTerminalScale();

      if (terminalDrag) {
        const pos = terminalDrag.getPosition();
        const maxOffX = Math.max(0, (window.innerWidth - targetW) / 2 - 10);
        const maxOffY = Math.max(0, (window.innerHeight - targetH) / 2 - 10);
        const clampedX = Math.min(maxOffX, Math.max(-maxOffX, pos.x));
        const clampedY = Math.min(maxOffY, Math.max(-maxOffY, pos.y));
        terminalDrag.setPosition(clampedX, clampedY);
      }
    }
  }, { passive: false });

  // Disable browser zoom keyboard shortcuts and control window / terminal scale
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_' || e.key === '0') {
        e.preventDefault();

        const activeWin = WindowManager.getActiveWindow();
        if (activeWin && activeWin.classList.contains('open')) {
          const curW = activeWin.offsetWidth;
          const curH = activeWin.offsetHeight;
          const minW = 320;
          const minH = 200;
          const maxW = Math.max(minW, window.innerWidth - 20);
          const maxH = Math.max(minH, window.innerHeight - 20);

          let targetW = curW;
          let targetH = curH;

          if (e.key === '+' || e.key === '=') {
            targetW = Math.min(maxW, Math.round(curW * 1.08));
            targetH = Math.min(maxH, Math.round(curH * 1.08));
          } else if (e.key === '-' || e.key === '_') {
            targetW = Math.max(minW, Math.round(curW * 0.92));
            targetH = Math.max(minH, Math.round(curH * 0.92));
          } else if (e.key === '0') {
            targetW = Math.min(640, Math.round(window.innerWidth * 0.92));
            targetH = Math.min(480, Math.round(window.innerHeight * 0.82));
          }

          activeWin.style.width = `${targetW}px`;
          activeWin.style.height = `${targetH}px`;
          WindowManager.center(activeWin);
          return;
        }

        if (!terminal || terminal.classList.contains('maximized') || terminal.style.visibility === 'hidden' || isHidden) {
          return;
        }

        const currentW = terminal.offsetWidth;
        const currentH = terminal.offsetHeight;
        const minW = 360;
        const minH = 240;
        const maxW = Math.max(minW, window.innerWidth - 20);
        const maxH = Math.max(minH, window.innerHeight - 20);

        let targetW = currentW;
        let targetH = currentH;

        if (e.key === '+' || e.key === '=') {
          targetW = Math.min(maxW, Math.round(currentW * 1.08));
          targetH = Math.min(maxH, Math.round(currentH * 1.08));
        } else if (e.key === '-' || e.key === '_') {
          targetW = Math.max(minW, Math.round(currentW * 0.92));
          targetH = Math.max(minH, Math.round(currentH * 0.92));
        } else if (e.key === '0') {
          targetW = Math.min(820, Math.round(window.innerWidth * 0.94));
          targetH = Math.min(580, Math.round(window.innerHeight * 0.84));
          if (terminalDrag) terminalDrag.resetPosition();
        }

        terminal.style.width = `${targetW}px`;
        terminal.style.height = `${targetH}px`;
        updateTerminalScale();

        if (terminalDrag) {
          const pos = terminalDrag.getPosition();
          const maxOffX = Math.max(0, (window.innerWidth - targetW) / 2 - 10);
          const maxOffY = Math.max(0, (window.innerHeight - targetH) / 2 - 10);
          terminalDrag.setPosition(
            Math.min(maxOffX, Math.max(-maxOffX, pos.x)),
            Math.min(maxOffY, Math.max(-maxOffY, pos.y))
          );
        }
      }
    }
  });

  // Traffic light close button (Window close & app quit state)
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      if (terminalState !== 'open') return;
      sound.terminalClose();

      if (isMaximized) {
        isMaximized = false;
        terminal.classList.remove('maximized');
        if (terminalDrag) terminalDrag.resetPosition();
      }

      terminal.classList.remove('open', 'minimizing', 'unminimizing');
      terminal.style.removeProperty('animation');
      void terminal.offsetWidth; // Force CSS reflow
      terminal.classList.add('closing');

      terminalState = 'closed';
      isHidden = true;
      setBackgroundControlsEnabled(true);

      setTimeout(() => {
        terminal.style.visibility = 'hidden';
        terminal.classList.remove('closing');
        updateDockState('closed');
      }, 200);
    });
  }

  // Traffic light minimize button (Suction into dock & restore state)
  if (btnMin) {
    btnMin.addEventListener('click', () => {
      if (terminalState !== 'open') return;
      sound.minimize();

      if (isMaximized) {
        isMaximized = false;
        terminal.classList.remove('maximized');
        if (terminalDrag) terminalDrag.resetPosition();
      }

      terminal.classList.remove('open', 'closing', 'unminimizing');
      terminal.style.removeProperty('animation');
      void terminal.offsetWidth; // Force CSS reflow
      terminal.classList.add('minimizing');

      terminalState = 'minimized';
      isHidden = true;
      setBackgroundControlsEnabled(true);

      // Reveal dock as window minimizes into bottom center
      setTimeout(() => {
        updateDockState('minimized');
      }, 100);

      setTimeout(() => {
        terminal.style.visibility = 'hidden';
        terminal.classList.remove('minimizing');
      }, 380);
    });
  }

  // Traffic light maximize button
  if (btnMax) {
    btnMax.addEventListener('click', () => {
      if (terminalState !== 'open') return;
      sound.maximize();
      isMaximized = !isMaximized;
      terminal.classList.add('restoring');
      terminal.classList.toggle('maximized', isMaximized);
      if (!isMaximized) {
        if (terminalDrag) terminalDrag.resetPosition();
      }

      // Smoothly update terminal content scale as maximize/restore animation progresses
      updateTerminalScale();
      const startTime = performance.now();
      const step = () => {
        updateTerminalScale();
        if (performance.now() - startTime < 420) {
          requestAnimationFrame(step);
        } else {
          updateTerminalScale();
          terminal.classList.remove('restoring');
        }
      };
      requestAnimationFrame(step);
    });
  }

  // Desktop Dock Item
  if (dockRestore) {
    const handleDockClick = () => {
      if (!terminal) return;

      if (terminalState === 'open') {
        // Clicking open app in dock minimizes it down (standard desktop behavior)
        if (btnMin) {
          btnMin.click();
        }
        return;
      }

      setBackgroundControlsEnabled(false);

      updateTerminalScale();
      terminal.style.visibility = 'visible';
      terminal.classList.remove('closing', 'minimizing', 'unminimizing', 'open');
      terminal.style.removeProperty('animation');
      void terminal.offsetWidth; // Force reflow

      if (terminalState === 'minimized') {
        // --- 1. MINIMIZED RESTORE: Smoothly unminimize from dock, keeping all content in place ---
        sound.windowOpen();
        updateDockState('open');

        terminal.classList.add('unminimizing');
        terminal.addEventListener('animationend', () => {
          terminal.classList.remove('unminimizing');
          terminal.style.removeProperty('animation');
          terminal.style.opacity = '1';
          const pos = terminalDrag ? terminalDrag.getPosition() : { x: 0, y: 0 };
          terminal.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0px)`;
          const input = document.getElementById('promptInput');
          if (input && !isMobile()) input.focus();
        }, { once: true });

        terminalState = 'open';
        isHidden = false;

      } else {
        // --- 2. CLOSED RELAUNCH: Launch window and replay boot reveal sequence from scratch ---
        sound.terminalOpen();
        updateDockState('open');

        if (terminalDrag) {
          terminalDrag.resetPosition();
        }

        // Reset content to pristine state for replay
        resetTerminalContentForReveal();

        terminal.classList.add('open');
        terminal.addEventListener('animationend', () => {
          terminal.classList.remove('open');
          terminal.style.removeProperty('animation');
          terminal.style.opacity = '1';
          terminal.style.transform = 'translate(0px, 0px)';
        }, { once: true });

        terminalState = 'open';
        isHidden = false;

        // Replay reveal sequence: logo ignition -> menu scramble -> ready chime & prompt focus
        setTimeout(revealLogo, 450);
        setTimeout(revealMenu, 1100);
        setTimeout(enablePrompt, 1650);
      }
    };

    dockRestore.addEventListener('click', handleDockClick);
    dockRestore.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDockClick();
      }
    });
  }

  updateDockState('open');
}
