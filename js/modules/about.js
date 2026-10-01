/**
 * About App Module (Neofetch / Fastfetch TUI Bio with Interactive 3D ASCII Globe)
 */
import { config } from '../config.js';
import { sound } from '../audio.js';
import { createGlobe } from '../globe.js';
import { t } from '../i18n.js';

let globeController = null;

export default {
  id: 'about',
  get label() { return t('menu.about'); },
  command: 'about',
  get windowTitle() { return t('window.about'); },
  windowClass: 'about-window',
  baseWidth: 820,
  baseHeight: 540,
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
      <div class="tui-neofetch">
        <div class="tui-neofetch-logo" data-no-stream>
          <pre class="tui-globe-pre" aria-label="Interactive 3D Earth ASCII Globe"></pre>
        </div>

        <div class="tui-neofetch-specs">
          <div class="tui-neofetch-title">janik@bunkernet</div>
          <div class="tui-neofetch-divider">---------------</div>
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

      <div class="tui-section">
        <div class="tui-line">${t('about.bio1')}</div>
        <div class="tui-line">${t('about.bio2')}</div>
      </div>
    `;
  },

  onOpen(winEl) {
    if (!winEl) winEl = document.querySelector('.about-window');
    const preEl = winEl ? winEl.querySelector('.tui-globe-pre') : null;
    if (preEl) {
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

    const btnLinks = winEl ? winEl.querySelectorAll('.tui-neofetch-specs .tui-btn') : [];
    btnLinks.forEach(btn => {
      if (!btn._soundBound) {
        btn._soundBound = true;
        btn.addEventListener('mouseenter', () => sound.hoverBlip());
        btn.addEventListener('click', () => sound.pickup());
      }
    });
  },

  onClose() {
    if (globeController) {
      globeController.destroy();
      globeController = null;
    }
  }
};
