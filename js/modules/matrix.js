/**
 * Matrix Rain App Module
 * 100% transparent canvas with high-performance digital phosphor stream trails.
 */
import { config } from '../config.js';
import { sound } from '../audio.js';
import { getCurrentTheme } from '../theme.js';

let matrixLoopId = null;
let mCanvas = null;
let mctx = null;
let mColumns = [];
let lastFrameTime = 0;

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン<>-_/\\[]{}=+*^?#$%@!&';
const OCEAN_CHARS = '01°·oO○◌~≈≋∿☵⌬⚓∆∇λµ§•アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const FONT_SIZE = 14;
const STEP_MS = 33; // ~30 FPS rain step cadence

function sizeCanvas() {
  if (!mCanvas || !mCanvas.parentElement) return;
  const parent = mCanvas.parentElement;
  const newW = Math.floor(parent.offsetWidth || parent.clientWidth || 740);
  const newH = Math.floor(parent.offsetHeight || parent.clientHeight || 500);
  if (newW <= 0 || newH <= 0) return;
  if (mCanvas.width === newW && mCanvas.height === newH) return;

  mCanvas.width = newW;
  mCanvas.height = newH;

  const currentTheme = getCurrentTheme();
  const isOcean = currentTheme && currentTheme.id === 'ocean';
  const charSet = isOcean ? OCEAN_CHARS : MATRIX_CHARS;

  const cols = Math.floor(newW / FONT_SIZE);
  const maxRows = Math.ceil(newH / FONT_SIZE) + 40;

  mColumns = [];
  for (let i = 0; i < cols; i++) {
    const chars = new Array(maxRows);
    for (let c = 0; c < maxRows; c++) {
      chars[c] = charSet[Math.floor(Math.random() * charSet.length)];
    }
    mColumns.push({
      y: Math.floor(Math.random() * (maxRows + 10)) - 10,
      length: 10 + Math.floor(Math.random() * 18),
      speed: Math.random() < 0.2 ? 2 : 1,
      tick: 0,
      chars
    });
  }

  if (mctx) {
    mctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
  }
}

function drawFrame(timestamp) {
  if (!mctx || !mCanvas) return;
  matrixLoopId = requestAnimationFrame(drawFrame);

  if (timestamp - lastFrameTime < STEP_MS) return;
  lastFrameTime = timestamp;

  // 100% transparent canvas background on every frame
  mctx.clearRect(0, 0, mCanvas.width, mCanvas.height);

  const currentTheme = getCurrentTheme();
  const isOcean = currentTheme && currentTheme.id === 'ocean';
  const charSet = isOcean ? OCEAN_CHARS : MATRIX_CHARS;
  const matrixColor = currentTheme?.primaryHex || currentTheme?.matrixColors?.dim || '#2fbf6f';

  mctx.font = `${FONT_SIZE}px monospace`;
  mctx.textBaseline = 'top';
  mctx.fillStyle = matrixColor;

  const rowsCount = Math.ceil(mCanvas.height / FONT_SIZE);

  for (let i = 0; i < mColumns.length; i++) {
    const col = mColumns[i];
    const x = i * FONT_SIZE;

    // Draw active trail for this column
    for (let k = 0; k <= col.length; k++) {
      const row = col.y - k;
      if (row < 0 || row >= rowsCount + 2) continue;

      const y = row * FONT_SIZE;
      let char = col.chars[row % col.chars.length];

      // Occasional cybernetic glyph glitch in the falling stream
      if (Math.random() < 0.04) {
        char = charSet[Math.floor(Math.random() * charSet.length)];
        col.chars[row % col.chars.length] = char;
      }

      if (k === 0) {
        mctx.globalAlpha = 1.0;
      } else {
        // Trailing glyphs: smooth alpha gradient into 100% transparency
        const progress = k / col.length; // 0 at head, 1 at tail
        mctx.globalAlpha = Math.max(0, Math.pow(1 - progress, 1.4));
      }

      mctx.fillText(char, x, y);
    }

    // Step column drop
    col.tick++;
    if (col.tick >= col.speed) {
      col.tick = 0;
      col.y++;

      // When entire trail passes below canvas, reset to top with randomized delay
      if (col.y - col.length > rowsCount) {
        col.y = Math.floor(Math.random() * -20);
        col.length = 10 + Math.floor(Math.random() * 18);
        col.speed = Math.random() < 0.2 ? 2 : 1;
        for (let c = 0; c < col.chars.length; c++) {
          col.chars[c] = charSet[Math.floor(Math.random() * charSet.length)];
        }
      }
    }
  }

  mctx.globalAlpha = 1.0;
}

export default {
  id: 'matrix',
  label: '[ MATRIX ]',
  command: 'matrix',
  windowTitle: 'bunkernet.cc — matrix',
  windowClass: 'matrix-window',
  baseWidth: 740,
  baseHeight: 500,
  asciiArt: `1 0 1 0 1
0 1 0 0 1
1 1 0 1 0
0 0 1 0 0
1 0 1 1 0`,

  hoverFrames: [
    `0 1 0 1 0
1 0 1 0 1
0 1 0 0 1
1 1 0 1 0
0 0 1 0 0`,
    `1 1 0 0 1
0 1 0 1 0
1 0 1 0 1
0 1 0 0 1
1 1 0 1 0`,
    `0 0 1 1 0
1 1 0 0 1
0 1 0 1 0
1 0 1 0 1
0 1 0 0 1`
  ],

  render() {
    return `
      <canvas id="matrixCanvas"></canvas>
      <div class="matrix-cta">
        <a class="ascii-btn" href="${config.matrixRoomUrl}" target="_blank" rel="noopener" aria-label="Join the Bunkerspace on Matrix">
          <span class="ascii-label" data-text="[ JOIN THE BUNKERSPACE ]">[ JOIN THE BUNKERSPACE ]</span>
        </a>
      </div>
    `;
  },

  onOpen(winEl) {
    mCanvas = winEl.querySelector('#matrixCanvas');
    if (mCanvas) {
      mctx = mCanvas.getContext('2d');
      sizeCanvas();
      lastFrameTime = 0;
      if (matrixLoopId) cancelAnimationFrame(matrixLoopId);
      matrixLoopId = requestAnimationFrame(drawFrame);
    }

    const btn = winEl.querySelector('.matrix-cta .ascii-btn');
    if (btn && !btn._soundBound) {
      btn._soundBound = true;
      btn.addEventListener('click', () => sound.pickup());
    }
  },

  onResize(winEl) {
    if (!mCanvas && winEl) {
      mCanvas = winEl.querySelector('#matrixCanvas');
      if (mCanvas) mctx = mCanvas.getContext('2d');
    }
    sizeCanvas();
  },

  onClose() {
    if (matrixLoopId) cancelAnimationFrame(matrixLoopId);
    matrixLoopId = null;
  }
};
