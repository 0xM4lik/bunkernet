/**
 * Matrix Rain App Module
 */
import { config } from '../config.js';
import { sound } from '../audio.js';
import { getCurrentTheme } from '../theme.js';

let matrixLoopId = null;
let mCanvas = null;
let mctx = null;
let mColumns = [];
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン<>-_/\\[]{}=+*^?#$%@!&';
const OCEAN_CHARS = '01°·oO○◌~≈≋∿☵⌬⚓∆∇λµ§•アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const MATRIX_SPEED = 0.4;

function sizeCanvas() {
  if (!mCanvas || !mCanvas.parentElement) return;
  const parent = mCanvas.parentElement;
  const newW = Math.floor(parent.offsetWidth || parent.clientWidth || 640);
  const newH = Math.floor(parent.offsetHeight || parent.clientHeight || 400);
  if (newW <= 0 || newH <= 0) return;
  if (mCanvas.width === newW && mCanvas.height === newH) return;

  mCanvas.width = newW;
  mCanvas.height = newH;
  const fontSize = 14;
  const cols = Math.floor(newW / fontSize);
  if (mColumns.length < cols) {
    const needed = cols - mColumns.length;
    for (let i = 0; i < needed; i++) {
      mColumns.push(Math.random() * -60);
    }
  } else if (mColumns.length > cols) {
    mColumns.length = cols;
  }
}

function drawFrame() {
  if (!mctx || !mCanvas) return;
  const fontSize = 14;

  const currentTheme = getCurrentTheme();
  const isOcean = currentTheme && currentTheme.id === 'ocean';
  const charSet = isOcean ? OCEAN_CHARS : MATRIX_CHARS;
  const brightColor = (currentTheme && currentTheme.matrixColors) ? currentTheme.matrixColors.bright : '#e8fff2';
  const dimColor = (currentTheme && currentTheme.matrixColors) ? currentTheme.matrixColors.dim : '#2fbf6f';

  // Fade out trails with destination-out so the canvas background remains 100% transparent
  mctx.globalCompositeOperation = 'destination-out';
  mctx.fillStyle = isOcean ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.08)';
  mctx.fillRect(0, 0, mCanvas.width, mCanvas.height);
  mctx.globalCompositeOperation = 'source-over';

  mctx.font = fontSize + 'px monospace';

  for (let i = 0; i < mColumns.length; i++) {
    const char = charSet[Math.floor(Math.random() * charSet.length)];
    const x = i * fontSize;
    const y = Math.floor(mColumns[i]) * fontSize;
    if (isOcean && Math.random() > 0.96) {
      mctx.fillStyle = '#ff9d00'; // Subnautica Alterra orange highlights
    } else {
      mctx.fillStyle = Math.random() > 0.92 ? brightColor : dimColor;
    }
    mctx.fillText(char, x, y);
    if (y > mCanvas.height && Math.random() > 0.975) {
      mColumns[i] = 0;
    } else {
      mColumns[i] += MATRIX_SPEED;
    }
  }
  matrixLoopId = requestAnimationFrame(drawFrame);
}

export default {
  id: 'matrix',
  label: '[ MATRIX ]',
  command: 'matrix',
  windowTitle: `bunkernet.cc — matrix`,
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
      mctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
      if (matrixLoopId) cancelAnimationFrame(matrixLoopId);
      drawFrame();
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
