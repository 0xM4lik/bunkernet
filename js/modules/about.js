/**
 * About App Module (Glow Markdown & Fastfetch TUI Bio with Interactive 3D ASCII Globe)
 * Orchestrated multi-phase sequence:
 * 1. Types: "> glow README.md"
 * 2. Reveals bio section, streams markdown with glowing bold keywords (plain bold on light/dark)
 * 3. Types: "> fastfetch"
 * 4. Ignites 3D ASCII globe + reveals system specifications with staggered rows
 */
import { config } from '../config.js';
import { sound } from '../audio.js';
import { createGlobe } from '../globe.js';
import { t } from '../i18n.js';

let globeController = null;
let phaseTimers = [];
let phaseAborted = false;

function clearPhaseTimers() {
  phaseTimers.forEach(id => clearTimeout(id));
  phaseTimers = [];
}

/**
 * Tokenizes text containing **bold** markers into sequential tokens.
 */
function parseMarkdownTokens(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts
    .filter(p => p.length > 0)
    .map(p => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return { text: p.slice(2, -2), bold: true };
      }
      return { text: p, bold: false };
    });
}

/**
 * Converts markdown bold markers into HTML spans for static rendering / skip fallback.
 */
function renderGlowMarkdown(text) {
  const tokens = parseMarkdownTokens(text);
  return tokens
    .map(tok => tok.bold ? `<span class="tui-glow-bold">${tok.text}</span>` : `<span>${tok.text}</span>`)
    .join('');
}

export default {
  id: 'about',
  get label() { return t('menu.about'); },
  command: 'about',
  get windowTitle() { return t('window.about'); },
  windowClass: 'about-window',
  baseWidth: 820,
  baseHeight: 580,
  instantRender: true,

  asciiArt: `   ___   
  /@_@\\  
  \\___/  
  / | \\  
/___|___\\`,

  hoverFrames: [
    `   ___   
  /*_*\\  
  \\___/  
  / | \\  
/___|___\\`,
    `   ___   
  /-_-\\  
  \\___/  
  / | \\  
/___|___\\`,
    `   ___   
  /@_@\\  
  \\___/  
  / | \\  
/___|___\\`
  ],

  render() {
    return `
      <div class="tui-fastfetch-cmd">
        <span class="tui-fastfetch-prompt">&gt;</span> <span class="tui-cmd-glow tui-fastfetch-typed" data-cmd="glow README.md"></span>
      </div>
      <div class="tui-section tui-about-intro" style="display:none">
        <div class="tui-glow-line tui-bio-1"></div>
        <div class="tui-glow-line tui-bio-2"></div>
      </div>

      <div class="tui-fastfetch-section" style="display:none">
        <div class="tui-fastfetch-cmd">
          <span class="tui-fastfetch-prompt">&gt;</span> <span class="tui-cmd-fetch tui-fastfetch-typed" data-cmd="fastfetch"></span>
        </div>

        <div class="tui-neofetch tui-fastfetch-output" style="display:none">
          <div class="tui-neofetch-logo">
            <pre class="tui-globe-pre" aria-label="Interactive 3D Earth ASCII Globe"></pre>
          </div>

          <div class="tui-neofetch-specs">
            <div class="tui-neofetch-title">malik@bunkernet</div>
            <div class="tui-neofetch-divider">----------------</div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.workstation')}</span> <span class="tui-spec-val">Fedora Linux</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.server')}</span> <span class="tui-spec-val">TrueNAS SCALE</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.linuxEnvs')}</span> <span class="tui-spec-val">RHEL-based (Fedora), Debian/Ubuntu, Arch Linux, Hardened (secureblue)</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.virtualization')}</span> <span class="tui-spec-val">QEMU/KVM (virt-manager), Docker, Hyper-V, VirtualBox</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.networking')}</span> <span class="tui-spec-val">DNS (Unbound, Pi-hole), WireGuard/Tailscale Mesh, Ingress Tunnels, SMTP/IMAP</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.storage')}</span> <span class="tui-spec-val">ZFS</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.scripting')}</span> <span class="tui-spec-val">Python (Basics), C# (Basics)</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.aiTools')}</span> <span class="tui-spec-val">Ollama, Claude Code, Antigravity CLI</span></div>
            <div class="tui-neofetch-row"><span class="tui-spec-key">${t('about.spec.languages')}</span> <span class="tui-spec-val">${t('about.spec.languagesVal')}</span></div>
            <div class="tui-links-row">
              <a class="tui-btn tui-icon-btn" href="${config.githubUrl}" target="_blank" rel="noopener" aria-label="GitHub: 0xM4lik" title="GitHub: ${config.githubUrl}">[ <svg class="tui-btn-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> ]</a>
              <a class="tui-btn tui-icon-btn" href="${config.hackTheBoxUrl}" target="_blank" rel="noopener" aria-label="HackTheBox: 1464597" title="HackTheBox: ${config.hackTheBoxUrl}">[ <svg class="tui-btn-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="m22.5106 6.4566.0008-.0123a.888.888 0 0 0-.2717-.6384c-.0084-.0084-.018-.0155-.0267-.0235-.0186-.0166-.0371-.0333-.0572-.0484-.0193-.0147-.04-.0276-.0607-.0406-.0096-.006-.0182-.0131-.0281-.0188L12.4576.1266a.891.891 0 0 0-.9223.0043L1.933 5.6744c-.0107.0062-.0203.014-.0307.0205-.0073.0047-.015.008-.0223.0128-.007.0047-.013.0106-.02.0155a.8769.8769 0 0 0-.147.1333l-.0026.003a.8872.8872 0 0 0-.2218.5847l.0009.014c-.0002.0088-.0015.0176-.0015.0264v11.0708c0 .3277.1802.6288.469.7836l9.5986 5.5417c.0076.0044.0158.0075.0236.0117a.8754.8754 0 0 0 .166.0687c.0134.004.0266.0083.0401.0117a.8793.8793 0 0 0 .072.0142c.0117.0019.0232.0045.0349.006a.835.835 0 0 0 .2157 0c.0117-.0015.0232-.0041.0348-.006a.9.9 0 0 0 .072-.0142c.0135-.0034.0267-.0077.04-.0117a.895.895 0 0 0 .0646-.0217.9134.9134 0 0 0 .1015-.047c.0078-.0042.016-.0072.0236-.0117l9.5986-5.5417a.8888.8888 0 0 0 .469-.7836V6.4779c0-.0071-.0012-.0142-.0014-.0213zM5.2543 6.0822l6.5367-3.774a.4182.4182 0 0 1 .4182 0l6.5366 3.774a.4182.4182 0 0 1 0 .7243l-6.5367 3.774a.4182.4182 0 0 1-.4182 0l-6.5366-3.774a.4182.4182 0 0 1 0-.7243zm5.6134 14.3449a.4172.4172 0 0 1-.626.3613L3.718 17.0218a.4173.4173 0 0 1-.2086-.3613V9.1279a.4172.4172 0 0 1 .6258-.3613l6.524 3.7666a.4172.4172 0 0 1 .2086.3614v7.5325zm9.623-3.7666a.4173.4173 0 0 1-.2086.3613l-6.5239 3.7666a.4172.4172 0 0 1-.6259-.3613v-7.5325c0-.149.0796-.2868.2087-.3614l6.5239-3.7666a.4172.4172 0 0 1 .6258.3613v7.5326z"/></svg> ]</a>
              <a class="tui-btn tui-icon-btn" href="${config.notesUrl}" target="_blank" rel="noopener" aria-label="Docs/Notes" title="Docs/Notes: ${config.notesUrl}">[ <svg class="tui-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> ]</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  onOpen(winEl) {
    if (!winEl) winEl = document.querySelector('.about-window');
    if (!winEl) return;

    phaseAborted = false;
    clearPhaseTimers();

    const cmdGlowEl = winEl.querySelector('.tui-cmd-glow');
    const introSection = winEl.querySelector('.tui-about-intro');
    const bio1El = winEl.querySelector('.tui-bio-1');
    const bio2El = winEl.querySelector('.tui-bio-2');
    const fetchSection = winEl.querySelector('.tui-fastfetch-section');
    const cmdFetchEl = winEl.querySelector('.tui-cmd-fetch');
    const fetchOutput = winEl.querySelector('.tui-fastfetch-output');
    const globeEl = winEl.querySelector('.tui-globe-pre');
    const specRows = winEl.querySelectorAll('.tui-neofetch-specs > *');

    // Hide any sub-elements initially
    if (introSection) introSection.style.display = 'none';
    if (fetchSection) fetchSection.style.display = 'none';
    if (fetchOutput) {
      fetchOutput.style.display = 'none';
      fetchOutput.style.opacity = '0';
      fetchOutput.style.transform = 'translateY(6px)';
    }
    specRows.forEach(row => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(4px)';
    });

    // Helper: start globe controller
    function startGlobe(preEl) {
      if (!preEl) return;
      if (!globeController || globeController.element !== preEl) {
        if (globeController) {
          globeController.destroy();
        }
        globeController = createGlobe(preEl);
        if (globeController) {
          globeController.start();
        }
      }
    }

    // Helper: bind hover sounds to link buttons
    function bindLinkSounds(el) {
      const btnLinks = el ? el.querySelectorAll('.tui-neofetch-specs .tui-btn') : [];
      btnLinks.forEach(btn => {
        if (!btn._soundBound) {
          btn._soundBound = true;
          btn.addEventListener('mouseenter', () => sound.hoverBlip());
          btn.addEventListener('click', () => sound.pickup());
        }
      });
    }

    // Complete / skip all animations immediately
    const finalize = () => {
      if (phaseAborted) return;
      phaseAborted = true;
      clearPhaseTimers();

      // Remove lingering blinking cursors
      winEl.querySelectorAll('.term-cursor').forEach(c => c.remove());

      // Show command 1 & bio
      if (cmdGlowEl) cmdGlowEl.textContent = 'glow README.md';
      if (introSection) introSection.style.display = '';
      if (bio1El) bio1El.innerHTML = renderGlowMarkdown(t('about.bio1'));
      if (bio2El) bio2El.innerHTML = renderGlowMarkdown(t('about.bio2'));

      // Show command 2 & fastfetch
      if (fetchSection) fetchSection.style.display = '';
      if (cmdFetchEl) cmdFetchEl.textContent = 'fastfetch';
      if (fetchOutput) {
        fetchOutput.style.display = '';
        fetchOutput.style.opacity = '1';
        fetchOutput.style.transform = 'none';
        fetchOutput.style.transition = 'none';
      }

      specRows.forEach(row => {
        row.style.opacity = '1';
        row.style.transform = 'none';
        row.style.transition = 'none';
      });

      startGlobe(globeEl);
      if (globeEl) globeEl.classList.add('revealed');
      bindLinkSounds(winEl);

      cleanup();
    };

    const cleanup = () => {
      winEl.removeEventListener('click', finalize);
      window.removeEventListener('keydown', finalize);
    };

    // Attach skip listeners
    winEl.addEventListener('click', finalize, { once: true });
    window.addEventListener('keydown', finalize, { once: true });

    // Typing utility for command prompts
    function typeCommand(targetEl, text, speed, onDone) {
      if (phaseAborted) return;
      let charIdx = 0;
      const cursor = document.createElement('span');
      cursor.className = 'term-cursor';
      targetEl.parentElement.appendChild(cursor);

      function step() {
        if (phaseAborted) {
          cursor.remove();
          return;
        }
        if (charIdx < text.length) {
          charIdx++;
          targetEl.textContent = text.substring(0, charIdx);
          if (charIdx % 2 === 0) sound.streamTick();
          phaseTimers.push(setTimeout(step, speed));
        } else {
          cursor.remove();
          if (typeof onDone === 'function') onDone();
        }
      }
      step();
    }

    // Typing utility for markdown paragraphs with bold formatting
    function streamParagraph(containerEl, rawText, onDone) {
      if (phaseAborted) return;
      const tokens = parseMarkdownTokens(rawText);
      let tokenIdx = 0;
      let charIdx = 0;
      let currentSpan = null;
      const cursor = document.createElement('span');
      cursor.className = 'term-cursor';
      containerEl.appendChild(cursor);

      function stepChar() {
        if (phaseAborted) {
          cursor.remove();
          return;
        }
        if (tokenIdx >= tokens.length) {
          cursor.remove();
          if (typeof onDone === 'function') onDone();
          return;
        }

        const token = tokens[tokenIdx];
        if (charIdx === 0) {
          currentSpan = document.createElement('span');
          if (token.bold) {
            currentSpan.className = 'tui-glow-bold';
          }
          containerEl.insertBefore(currentSpan, cursor);
        }

        if (charIdx < token.text.length) {
          charIdx++;
          currentSpan.textContent = token.text.substring(0, charIdx);
          if (charIdx % 2 === 0) sound.streamTick();
          phaseTimers.push(setTimeout(stepChar, 10));
        } else {
          currentSpan.textContent = token.text;
          tokenIdx++;
          charIdx = 0;
          phaseTimers.push(setTimeout(stepChar, 12));
        }
      }
      stepChar();
    }

    // === PHASE 1: Type "> glow README.md" ===
    phaseTimers.push(setTimeout(() => {
      if (phaseAborted) return;
      typeCommand(cmdGlowEl, 'glow README.md', 24, () => {
        // Pause 160ms (simulating [Enter])
        phaseTimers.push(setTimeout(runPhase2, 160));
      });
    }, 100));

    // === PHASE 2: Stream README Markdown Content ===
    function runPhase2() {
      if (phaseAborted) return;
      if (introSection) introSection.style.display = '';

      // Stream paragraph 1
      streamParagraph(bio1El, t('about.bio1'), () => {
        // Pause 90ms between paragraphs
        phaseTimers.push(setTimeout(() => {
          if (phaseAborted) return;
          // Stream paragraph 2
          streamParagraph(bio2El, t('about.bio2'), () => {
            // Pause 220ms before fastfetch
            phaseTimers.push(setTimeout(runPhase3, 220));
          });
        }, 90));
      });
    }

    // === PHASE 3: Type "> fastfetch" ===
    function runPhase3() {
      if (phaseAborted) return;
      if (fetchSection) fetchSection.style.display = '';

      typeCommand(cmdFetchEl, 'fastfetch', 30, () => {
        // Pause 180ms (simulating [Enter])
        phaseTimers.push(setTimeout(runPhase4, 180));
      });
    }

    // === PHASE 4: Reveal Fastfetch Output & Ignite Globe ===
    function runPhase4() {
      if (phaseAborted) return;

      if (fetchOutput) {
        fetchOutput.style.display = '';
        fetchOutput.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        requestAnimationFrame(() => {
          if (phaseAborted) return;
          fetchOutput.style.opacity = '1';
          fetchOutput.style.transform = 'none';
        });
      }

      startGlobe(globeEl);
      if (globeEl) {
        globeEl.classList.add('revealed');
        sound.logoPop();
      }

      // Stagger each spec row with smooth opacity and slide-up
      const staggerBase = 50;
      const rowDuration = 260;

      specRows.forEach((row, i) => {
        phaseTimers.push(setTimeout(() => {
          if (phaseAborted) return;
          row.style.transition = `opacity ${rowDuration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${rowDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
          row.style.opacity = '1';
          row.style.transform = 'none';
        }, staggerBase * i));
      });

      const totalTime = staggerBase * specRows.length + rowDuration;
      phaseTimers.push(setTimeout(() => {
        if (phaseAborted) return;
        bindLinkSounds(winEl);
        cleanup();
      }, totalTime));
    }
  },

  onClose() {
    phaseAborted = true;
    clearPhaseTimers();
    if (globeController) {
      globeController.destroy();
      globeController = null;
    }
  }
};
