/**
 * Interactive Terminal CLI Parser & Command Dispatcher
 * Parses user input, updates shell history, and dispatches commands dynamically.
 */

import { sound, isAudioMuted, setAudioMuted, toggleAudio, enableAudioFromUserGesture } from './audio.js';
import { WindowManager } from './window-manager.js';
import { getModuleByCommand, getAllModules } from './modules/index.js';
import { config } from './config.js';
import { THEMES, getCurrentTheme, getAllThemes, applyTheme, cycleNextTheme, getThemePreference } from './theme.js';

let promptInput = null;
let promptHistory = null;
let bodyEl = null;

const commandHistory = [];
let historyIndex = -1;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function handleCommand(raw) {
  const cmd = raw.trim();
  if (cmd === '') return;

  commandHistory.push(cmd);
  historyIndex = commandHistory.length;

  const line = document.createElement('div');
  line.className = 'history-line';
  line.innerHTML = `<span class="prompt-user">${config.promptUser}</span> <span class="prompt-path">${config.promptPath}</span> <span class="prompt-sep">%</span> ${escapeHtml(cmd)}`;
  promptHistory.appendChild(line);

  const output = document.createElement('div');
  output.className = 'history-output';

  const parts = cmd.split(/\s+/);
  const mainCmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (mainCmd === 'help') {
    const moduleCmds = getAllModules().map(m => m.command || m.id).join(', ');
    output.textContent = `commands: ${moduleCmds}, theme [name|next|auto], sound [on|off|toggle], whoami, clear, help`;
    sound.ready();
  } else if (mainCmd === 'whoami') {
    output.textContent = 'guest';
    sound.ready();
  } else if (mainCmd === 'clear') {
    promptHistory.innerHTML = '';
    promptInput.value = '';
    return;
  } else if (mainCmd === 'sound' || mainCmd === 'audio') {
    const sub = args[0] ? args[0].toLowerCase() : '';
    if (sub === 'off' || sub === 'mute' || sub === 'disable') {
      setAudioMuted(true);
      output.textContent = 'sound effects muted.';
    } else if (sub === 'on' || sub === 'unmute' || sub === 'enable') {
      enableAudioFromUserGesture().then(() => {
        setAudioMuted(false);
        sound.ready();
      });
      output.textContent = 'sound effects enabled.';
    } else if (sub === 'toggle') {
      toggleAudio().then(active => {
        output.textContent = active ? 'sound effects enabled.' : 'sound effects muted.';
      });
    } else {
      const state = isAudioMuted() ? 'OFF (muted)' : 'ON (active)';
      output.textContent = `sound is currently ${state}. Usage: sound on | sound off | sound toggle`;
      sound.ready();
    }
  } else if (mainCmd === 'exit' || mainCmd === 'close') {
    if (WindowManager.getActiveWindow()) {
      WindowManager.closeActive();
      output.textContent = 'window closed.';
    } else {
      output.textContent = 'use titlebar buttons to minimize/close terminal.';
    }
  } else if (mainCmd === 'theme') {
    const sub = args[0] ? args[0].toLowerCase() : '';
    if (!sub) {
      const current = getCurrentTheme();
      const pref = getThemePreference();
      const isAuto = pref === 'system';
      const autoMarker = isAuto ? ' * ' : '   ';
      const list = getAllThemes().map(t => {
        const marker = (!isAuto && t.id === current.id) ? ' * ' : '   ';
        return `${marker}${t.id}`;
      }).join('\n');
      output.innerHTML = `<pre style="margin:0;font-family:inherit;">themes:\n${autoMarker}system (auto)\n${escapeHtml(list)}\n\nusage: theme &lt;name&gt; | theme auto | theme next | theme reset</pre>`;
      sound.ready();
    } else if (sub === 'next') {
      const nextT = cycleNextTheme(true);
      output.textContent = `theme switched to: ${nextT.name}`;
    } else if (sub === 'reset' || sub === 'default' || sub === 'system' || sub === 'auto') {
      applyTheme('system', true);
      const current = getCurrentTheme();
      output.textContent = `theme reset to: System Auto (${current.name})`;
    } else {
      const ok = applyTheme(sub, true);
      if (ok) {
        output.textContent = `theme switched to: ${THEMES[sub].name}`;
      } else {
        output.textContent = `unknown theme: "${sub}". Available: system, ${Object.keys(THEMES).join(', ')}`;
        sound.error();
      }
    }
  } else {
    const mod = getModuleByCommand(mainCmd);
    if (mod) {
      if (mod.url) {
        output.textContent = `opening ${mod.url.replace(/^https?:\/\//, '')}...`;
        sound.windowOpen();
        window.open(mod.url, '_blank', 'noopener,noreferrer');
      } else {
        output.textContent = `opening ${mod.id}...`;
        sound.windowOpen();
        WindowManager.open(mod.id);
      }
    } else {
      output.textContent = `command not found: ${cmd}. Type 'help' for available commands.`;
      sound.error();
    }
  }

  promptHistory.appendChild(output);
  promptInput.value = '';
  if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
}

export function initCli() {
  promptInput = document.getElementById('promptInput');
  promptHistory = document.getElementById('promptHistory');
  bodyEl = document.getElementById('body');

  if (!promptInput) return;

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        promptInput.value = commandHistory[historyIndex] || '';
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        promptInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        promptInput.value = '';
      }
      return;
    }
    if (e.key.length === 1 || e.key === 'Backspace') {
      sound.keyTick();
    }
    if (e.key === 'Enter') {
      handleCommand(promptInput.value);
    }
  });

  if (bodyEl) {
    bodyEl.addEventListener('click', (e) => {
      if (!e.target.closest('.ascii-btn') && !e.target.closest('a')) {
        promptInput.focus();
      }
    });
  }
}
