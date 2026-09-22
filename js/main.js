/**
 * Application Entry Point & Boot Orchestrator
 */

import { initBackground } from './background.js';
import { WindowManager } from './window-manager.js';
import { mountModules } from './modules/index.js';
import { initCli } from './cli.js';
import { initTheme, setupThemeMenu } from './theme.js';
import {
  initTerminal,
  showAudioPrompt,
  startTerminalSequence,
  initButtonScrambles
} from './terminal.js';
import { setupAudioUI } from './audio.js';

function boot() {
  // 0. Initialize theme before rendering modules
  initTheme();
  setupThemeMenu();

  const menuGrid = document.getElementById('menuGrid');
  const appWindowsContainer = document.getElementById('appWindowsContainer');

  // 1. Mount dynamic button & app modules
  mountModules(menuGrid, appWindowsContainer);

  // 2. Initialize subsystems & audio UI
  setupAudioUI();
  WindowManager.init();
  initBackground();
  initTerminal();
  initCli();
  initButtonScrambles();

  // 3. Sequential Reveal Timeline:
  //    0ms: 3D Background wavefront expands from center (duration: 1500ms)
  //    1500ms: Background reveal finishes -> Show retro Audio Consent Prompt
  //    User selection: Dialog fades out -> Starts terminal opening sequence with full audio or silent mode
  setTimeout(() => {
    showAudioPrompt(() => {
      startTerminalSequence();
    });
  }, 1500);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
