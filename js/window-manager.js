/**
 * Unified Window Manager & Drag Controller
 * Manages modal window lifecycle, overlay backdrops, and deterministic dragging.
 */

import { sound } from './audio.js';
import { getModuleById } from './modules/index.js';
import { streamTUIContent } from './terminal.js';

let overlayEl = null;
let activeWindow = null;
let previousFocusedElement = null;

/**
 * Attaches deterministic drag behavior to an element.
 * @param {HTMLElement} element - The target window element to move.
 * @param {HTMLElement} handle - The titlebar/drag handle element.
 * @param {Object} [options] - Configuration options.
 * @param {'transform'|'coordinates'} [options.mode='transform'] - Movement positioning mode.
 * @param {Function} [options.onDragStart] - Callback when drag starts.
 * @param {Function} [options.onDragEnd] - Callback when drag ends.
 * @returns {Object} Controller with resetPosition, setPosition, and getPosition methods.
 */
export function makeDraggable(element, handle, options = {}) {
  if (!element || !handle) return null;

  const mode = options.mode || 'transform'; // 'transform' or 'coordinates'
  const silent = Boolean(options.silent);
  let isDragging = false;

  let curX = 0;
  let curY = 0;
  let initialX = 0;
  let initialY = 0;
  let startPointerX = 0;
  let startPointerY = 0;

  if (mode === 'transform') {
    element.style.setProperty('--drag-x', '0px');
    element.style.setProperty('--drag-y', '0px');
  }

  function getScreenBounds() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const elemW = element.offsetWidth || 820;
    const elemH = element.offsetHeight || 580;
    const margin = 10;
    const topMargin = 10; // Clearance from viewport edge

    if (mode === 'transform') {
      const maxOffX = Math.max(0, (winW - elemW) / 2 - margin);
      const minOffX = -maxOffX;
      const minOffY = -Math.max(0, (winH - elemH) / 2 - topMargin);
      const maxOffY = Math.max(0, (winH - elemH) / 2 - margin);
      return { minX: minOffX, maxX: maxOffX, minY: minOffY, maxY: maxOffY };
    } else {
      const minLeft = margin;
      const maxLeft = Math.max(margin, winW - elemW - margin);
      const minTop = topMargin;
      const maxTop = Math.max(topMargin, winH - elemH - margin);
      return { minX: minLeft, maxX: maxLeft, minY: minTop, maxY: maxTop };
    }
  }

  function applyPosition(x, y) {
    curX = x;
    curY = y;
    if (mode === 'transform') {
      element.style.setProperty('--drag-x', `${x}px`);
      element.style.setProperty('--drag-y', `${y}px`);
      element.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
    } else {
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    }
  }

  function onPointerDown(e) {
    if (element.classList.contains('maximized') || element.style.visibility === 'hidden') return;
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    if (e.target.closest('.traffic-lights') ||
        e.target.closest('.app-close') ||
        e.target.closest('button') ||
        e.target.closest('select') ||
        e.target.closest('option') ||
        e.target.closest('label') ||
        e.target.closest('.titlebar-theme') ||
        e.target.closest('.theme-select')) return;

    try {
      handle.setPointerCapture(e.pointerId);
    } catch (err) {}

    e.preventDefault();
    isDragging = true;
    if (!silent) {
      sound.pickup();
    }

    startPointerX = e.clientX;
    startPointerY = e.clientY;

    if (window.anime) window.anime.remove(element);

    if (mode === 'transform') {
      initialX = curX;
      initialY = curY;
    } else {
      const rect = element.getBoundingClientRect();
      curX = rect.left;
      curY = rect.top;
      initialX = curX;
      initialY = curY;
    }

    element.classList.add('is-dragging');
    document.body.classList.add('window-dragging');
    element.style.removeProperty('animation');

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp, { passive: false });

    if (typeof options.onDragStart === 'function') {
      options.onDragStart(element);
    }
  }

  function onPointerMove(e) {
    if (!isDragging || element.classList.contains('maximized')) return;

    const totalDx = e.clientX - startPointerX;
    const totalDy = e.clientY - startPointerY;

    const bounds = getScreenBounds();
    const nextX = Math.min(bounds.maxX, Math.max(bounds.minX, initialX + totalDx));
    const nextY = Math.min(bounds.maxY, Math.max(bounds.minY, initialY + totalDy));

    applyPosition(nextX, nextY);
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);

    try {
      if (e && e.pointerId != null && handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    const bounds = getScreenBounds();
    const clampedX = Math.min(bounds.maxX, Math.max(bounds.minX, curX));
    const clampedY = Math.min(bounds.maxY, Math.max(bounds.minY, curY));

    applyPosition(clampedX, clampedY);
    element.classList.remove('is-dragging');
    document.body.classList.remove('window-dragging');

    if (typeof options.onDragEnd === 'function') {
      options.onDragEnd(element);
    }
  }

  handle.addEventListener('pointerdown', onPointerDown, { passive: false });
  handle.addEventListener('mousedown', onPointerDown, { passive: false });
  handle.addEventListener('dragstart', (e) => e.preventDefault());
  handle.addEventListener('selectstart', (e) => e.preventDefault());

  const controller = {
    resetPosition() {
      applyPosition(0, 0);
    },
    getPosition: () => ({ x: curX, y: curY }),
    setPosition: (x, y) => applyPosition(x, y)
  };

  element._drag = controller;
  return controller;
}

/**
 * Attaches 8-directional drag-resizing behavior to an element with position anchoring.
 * @param {HTMLElement} element - Target element to resize.
 * @param {Object} [options] - Options (mode, minWidth, minHeight, onResizeStart, onResize, onResizeEnd).
 * @returns {Object} Controller with setSize, getSize methods.
 */
export function makeResizable(element, options = {}) {
  if (!element) return null;

  const mode = options.mode || 'transform'; // 'transform' or 'coordinates'
  const minW = options.minWidth || 320;
  const minH = options.minHeight || 200;
  const handles = element.querySelectorAll('.resize-handle');
  if (!handles || handles.length === 0) return null;

  let isResizing = false;
  let activeDir = '';
  let startW = 0;
  let startH = 0;
  let startX = 0;
  let startY = 0;
  let startPointerX = 0;
  let startPointerY = 0;

  function onPointerDown(e) {
    if (element.classList.contains('maximized') || element.style.visibility === 'hidden') return;
    if (e.button !== 0 && e.pointerType !== 'touch') return;

    const handle = e.target.closest('.resize-handle');
    if (!handle) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      handle.setPointerCapture(e.pointerId);
    } catch (err) {}

    isResizing = true;
    activeDir = handle.getAttribute('data-dir') || 'se';

    const rect = element.getBoundingClientRect();
    startW = rect.width;
    startH = rect.height;
    startPointerX = e.clientX;
    startPointerY = e.clientY;

    if (mode === 'transform') {
      if (element._drag) {
        const pos = element._drag.getPosition();
        startX = pos.x;
        startY = pos.y;
      } else {
        startX = 0;
        startY = 0;
      }
    } else {
      startX = rect.left;
      startY = rect.top;
    }

    element.classList.add('is-resizing');
    document.body.classList.add('window-resizing');

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    if (typeof options.onResizeStart === 'function') {
      options.onResizeStart(element);
    }
  }

  function onPointerMove(e) {
    if (!isResizing || element.classList.contains('maximized')) return;

    const dx = e.clientX - startPointerX;
    const dy = e.clientY - startPointerY;

    const maxW = Math.max(minW, window.innerWidth - 20);
    const maxH = Math.max(minH, window.innerHeight - 20);

    let targetW = startW;
    let targetH = startH;
    let targetX = startX;
    let targetY = startY;

    if (mode === 'transform') {
      if (activeDir.includes('e')) {
        targetW = Math.min(maxW, Math.max(minW, startW + dx));
        targetX = startX + (targetW - startW) / 2;
      } else if (activeDir.includes('w')) {
        targetW = Math.min(maxW, Math.max(minW, startW - dx));
        targetX = startX - (targetW - startW) / 2;
      }

      if (activeDir.includes('s')) {
        targetH = Math.min(maxH, Math.max(minH, startH + dy));
        targetY = startY + (targetH - startH) / 2;
      } else if (activeDir.includes('n')) {
        targetH = Math.min(maxH, Math.max(minH, startH - dy));
        targetY = startY - (targetH - startH) / 2;
      }

      element.style.width = `${targetW}px`;
      element.style.height = `${targetH}px`;

      if (element._drag) {
        element._drag.setPosition(targetX, targetY);
      }
    } else {
      // coordinates mode for app-windows
      if (activeDir.includes('e')) {
        targetW = Math.min(window.innerWidth - startX - 10, Math.max(minW, startW + dx));
      } else if (activeDir.includes('w')) {
        const potentialW = startW - dx;
        targetW = Math.min(startX + startW - 10, Math.max(minW, potentialW));
        targetX = startX + (startW - targetW);
      }

      if (activeDir.includes('s')) {
        targetH = Math.min(window.innerHeight - startY - 10, Math.max(minH, startH + dy));
      } else if (activeDir.includes('n')) {
        const potentialH = startH - dy;
        targetH = Math.min(startY + startH - 10, Math.max(minH, potentialH));
        targetY = startY + (startH - targetH);
      }

      element.style.width = `${targetW}px`;
      element.style.height = `${targetH}px`;
      element.style.left = `${targetX}px`;
      element.style.top = `${targetY}px`;

      if (element._drag) {
        element._drag.setPosition(targetX, targetY);
      }
    }

    updateWindowScale(element);

    if (typeof options.onResize === 'function') {
      options.onResize(targetW, targetH);
    }
  }

  function onPointerUp(e) {
    if (!isResizing) return;
    isResizing = false;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);

    element.classList.remove('is-resizing');
    document.body.classList.remove('window-resizing');

    if (typeof options.onResizeEnd === 'function') {
      options.onResizeEnd(element);
    }
  }

  handles.forEach(h => {
    h.addEventListener('pointerdown', onPointerDown, { passive: false });
  });

  const controller = {
    setSize(w, h) {
      const maxW = Math.max(minW, window.innerWidth - 20);
      const maxH = Math.max(minH, window.innerHeight - 20);
      const clampedW = Math.min(maxW, Math.max(minW, w));
      const clampedH = Math.min(maxH, Math.max(minH, h));
      element.style.width = `${clampedW}px`;
      element.style.height = `${clampedH}px`;
      updateWindowScale(element);
      if (typeof options.onResize === 'function') {
        options.onResize(clampedW, clampedH);
      }
    },
    getSize() {
      return {
        width: element.offsetWidth,
        height: element.offsetHeight
      };
    }
  };

  element._resize = controller;
  return controller;
}

/**
 * Updates the --app-scale CSS custom property on a modal window based on its dimensions and base aspect ratio.
 * @param {HTMLElement} element
 */
export function updateWindowScale(element) {
  if (!element) return;
  const baseW = parseFloat(element.getAttribute('data-base-w')) || 720;
  const baseH = parseFloat(element.getAttribute('data-base-h')) || 480;
  const w = element.offsetWidth || baseW;
  const h = element.offsetHeight || baseH;
  const ratioW = w / baseW;
  const ratioH = h / baseH;
  // Floor of 0.88 guarantees text remains clear and readable on compact viewports;
  // Math.min(ratioW, ratioH) prevents horizontal widening from blowing up font sizes vertically.
  const scale = Math.max(0.88, Math.min(1.8, Math.min(ratioW, ratioH)));
  element.style.setProperty('--app-scale', scale.toFixed(3));
}

export const WindowManager = {
  /**
   * Initializes the window manager with overlay and global event listeners.
   */
  init() {
    overlayEl = document.getElementById('overlay');

    if (overlayEl) {
      overlayEl.addEventListener('click', () => {
        this.closeActive();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActive();
      } else if (e.key === 'Tab' && activeWindow && activeWindow.classList.contains('open')) {
        const focusables = activeWindow.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first || !activeWindow.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !activeWindow.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    });

    window.addEventListener('resize', () => {
      if (activeWindow) {
        this.center(activeWindow);
      }
    });
  },

  /**
   * Centers a modal window in the viewport and updates drag coordinates.
   * @param {HTMLElement} win - The modal window element.
   */
  center(win) {
    if (!win) return;
    const w = win.offsetWidth || 560;
    const h = win.offsetHeight || 420;
    const left = Math.max(10, (window.innerWidth - w) / 2);
    const top = Math.max(10, (window.innerHeight - h) / 2);
    win.style.left = left + 'px';
    win.style.top = top + 'px';
    updateWindowScale(win);
    if (win._drag) {
      win._drag.setPosition(left, top);
    }
  },

  /**
   * Opens an application modal window by ID.
   * @param {string} id - The module ID (e.g. 'about', 'work').
   */
  open(id) {
    const win = document.getElementById('win-' + id);
    if (!win) return;

    previousFocusedElement = document.activeElement;

    const allWindows = document.querySelectorAll('[data-window-el]');
    allWindows.forEach(w => {
      if (w !== win) {
        if (typeof w._abortStream === 'function') {
          w._abortStream();
          w._abortStream = null;
        }
        const wContent = w.querySelector('.app-content');
        if (wContent && typeof wContent._abortStream === 'function') {
          wContent._abortStream();
          wContent._abortStream = null;
        }
        w.classList.remove('open', 'closing');
      }
    });

    if (typeof win._abortStream === 'function') {
      win._abortStream();
      win._abortStream = null;
    }

    const mod = getModuleById(id);
    const content = win.querySelector('.app-content');
    const targetHTML = typeof mod?.render === 'function' ? mod.render() : (mod?.content || '');
    const isInstant = Boolean(mod?.instantRender || mod?.id === 'matrix');

    // Clear content immediately before window display to eliminate ANY flash of static text for streaming modules
    if (content && !isInstant) {
      content.innerHTML = '';
    } else if (content && isInstant && typeof mod?.render === 'function') {
      content.innerHTML = targetHTML;
    }

    win.classList.remove('closing');
    win.classList.add('open');
    win.style.opacity = '0';

    requestAnimationFrame(() => {
      this.center(win);
      if (overlayEl) overlayEl.classList.add('visible');
      activeWindow = win;

      const triggerStream = () => {
        if (!win.classList.contains('open') || win.classList.contains('closing')) {
          return;
        }
        if (content && !isInstant) {
          streamTUIContent(content, targetHTML, {
            onComplete: () => {
              if (mod && typeof mod.onOpen === 'function') {
                mod.onOpen(win);
              }
            }
          });
        } else if (mod && typeof mod.onOpen === 'function') {
          mod.onOpen(win);
        }
      };

      if (window.anime) {
        window.anime.remove(win);
        window.anime({
          targets: win,
          opacity: [0, 1],
          scale: [0.92, 1],
          translateY: [14, 0],
          duration: 320,
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
          complete: () => {
            win.style.removeProperty('transform');
            triggerStream();
          }
        });
      } else {
        win.style.opacity = '1';
        triggerStream();
      }
    });
  },

  /**
   * Closes the active modal window.
   */
  closeActive() {
    if (!activeWindow) return;
    sound.windowClose();
    const win = activeWindow;
    const modId = win.id.replace('win-', '');

    // Instantly abort any ongoing typewriter stream and ticking audio
    if (typeof win._abortStream === 'function') {
      win._abortStream();
      win._abortStream = null;
    }
    const content = win.querySelector('.app-content');
    if (content && typeof content._abortStream === 'function') {
      content._abortStream();
      content._abortStream = null;
    }

    win.classList.remove('open');
    win.classList.add('closing');

    if (window.anime) {
      window.anime.remove(win);
      window.anime({
        targets: win,
        opacity: [1, 0],
        scale: [1, 0.94],
        translateY: [0, 10],
        duration: 220,
        easing: 'cubicBezier(0.4, 0, 0.2, 1)',
        complete: () => {
          win.classList.remove('closing');
          win.style.removeProperty('transform');
        }
      });
    } else {
      win.classList.remove('closing');
      win.style.removeProperty('transform');
    }

    if (overlayEl) overlayEl.classList.remove('visible');

    const mod = getModuleById(modId);
    if (mod && typeof mod.onClose === 'function') {
      mod.onClose(win);
    }

    activeWindow = null;

    if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
      try {
        previousFocusedElement.focus();
      } catch (err) {}
      previousFocusedElement = null;
    }
  },

  /**
   * Attaches drag behavior to a window titlebar.
   * @param {HTMLElement} win - The modal window element.
   */
  makeDraggable(win) {
    const handle = win.querySelector('.app-titlebar');
    if (!handle) return;

    win._drag = makeDraggable(win, handle, {
      mode: 'coordinates',
      onDragStart: (el) => {
        document.querySelectorAll('[data-window-el]').forEach(w => {
          w.style.zIndex = '21';
        });
        el.style.zIndex = '22';
      }
    });
  },

  /**
   * Attaches resize behavior to a modal app window.
   * @param {HTMLElement} win - The modal window element.
   * @param {Object} [options] - Configuration options.
   */
  makeResizable(win, options = {}) {
    return makeResizable(win, {
      mode: 'coordinates',
      minWidth: options.minWidth || 320,
      minHeight: options.minHeight || 200,
      ...options
    });
  },

  /**
   * Returns the currently active modal window element if any.
   * @returns {HTMLElement|null}
   */
  getActiveWindow() {
    return activeWindow;
  }
};
