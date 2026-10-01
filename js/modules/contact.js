/**
 * Contact App Module (Pure TUI Contact)
 */
import { config } from '../config.js';
import { sound } from '../audio.js';
import { t } from '../i18n.js';

export default {
  id: 'contact',
  get label() { return t('menu.contact'); },
  command: 'contact',
  get windowTitle() { return t('window.contact'); },
  windowClass: 'contact-window',
  baseWidth: 480,
  baseHeight: 400,
  asciiArt: ` _______
| \\   / |
|  \\ /  |
|___V___|`,

  hoverFrames: [
    ` _______
| \\ . / |
|  \\ /  |
|___V___|`,
    ` _______
| \\ * / |
|  \\ /  |
|___V___|`,
    ` _______
| \\ o / |
|  \\ /  |
|___V___|`
  ],

  render() {
    return `
      <pre class="tui-ascii">
 _______
| \\   / |
|  \\ /  |
|___V___|</pre>

      <div class="tui-section">
        <div class="tui-line" data-tui-stream>${t('contact.emailLabel')}</div>
        <div class="tui-bright" data-tui-stream>${config.contactEmail}</div>
        <div class="tui-line" style="margin-top: 10px;" data-tui-stream>${t('contact.matrixLabel')}</div>
        <div class="tui-bright" data-tui-stream>${config.matrixUser}</div>
      </div>

      <div class="tui-actions">
        <a class="tui-btn primary" href="mailto:${config.contactEmail}">${t('contact.emailMe')}</a>
        <a class="tui-btn primary" href="${config.matrixUserUrl}" target="_blank" rel="noopener">${t('contact.messageMatrix')}</a>
      </div>
      <div class="tui-actions" style="margin-top: calc(8px * var(--app-scale, 1));">
        <button class="tui-btn" id="btnCopyEmail">${t('contact.copyEmail')}</button>
        <button class="tui-btn" id="btnCopyMatrix">${t('contact.copyMatrix')}</button>
      </div>
    `;
  },

  onOpen(winEl) {
    const btnCopyEmail = winEl.querySelector('#btnCopyEmail');
    if (btnCopyEmail) {
      btnCopyEmail.onclick = () => {
        try {
          navigator.clipboard.writeText(config.contactEmail).then(() => {
            sound.copySuccess();
            btnCopyEmail.textContent = t('contact.copied');
            setTimeout(() => {
              btnCopyEmail.textContent = t('contact.copyEmail');
            }, 2000);
          }).catch(() => {
            sound.copySuccess();
            btnCopyEmail.textContent = t('contact.copied');
          });
        } catch (e) {
          sound.copySuccess();
          btnCopyEmail.textContent = t('contact.copied');
        }
      };
    }

    const btnCopyMatrix = winEl.querySelector('#btnCopyMatrix');
    if (btnCopyMatrix) {
      btnCopyMatrix.onclick = () => {
        try {
          navigator.clipboard.writeText(config.matrixUser).then(() => {
            sound.copySuccess();
            btnCopyMatrix.textContent = t('contact.copied');
            setTimeout(() => {
              btnCopyMatrix.textContent = t('contact.copyMatrix');
            }, 2000);
          }).catch(() => {
            sound.copySuccess();
            btnCopyMatrix.textContent = t('contact.copied');
          });
        } catch (e) {
          sound.copySuccess();
          btnCopyMatrix.textContent = t('contact.copied');
        }
      };
    }
  }
};
