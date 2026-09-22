/**
 * Contact App Module (Pure TUI Contact)
 */
import { config } from '../config.js';
import { sound } from '../audio.js';

export default {
  id: 'contact',
  label: '[ CONTACT ]',
  command: 'contact',
  windowTitle: `bunkernet.cc — contact`,
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
        <div class="tui-line" data-tui-stream>Email:</div>
        <div class="tui-bright" data-tui-stream>${config.contactEmail}</div>
        <div class="tui-line" style="margin-top: 10px;" data-tui-stream>Matrix:</div>
        <div class="tui-bright" data-tui-stream>${config.matrixUser}</div>
      </div>

      <div class="tui-actions">
        <a class="tui-btn primary" href="mailto:${config.contactEmail}">[ EMAIL ME ]</a>
        <button class="tui-btn" id="btnCopyEmail">[ COPY EMAIL ]</button>
        <a class="tui-btn primary" href="${config.matrixUserUrl}" target="_blank" rel="noopener">[ MESSAGE ON MATRIX ]</a>
        <button class="tui-btn" id="btnCopyMatrix">[ COPY MATRIX ID ]</button>
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
            btnCopyEmail.textContent = '[ COPIED ]';
            setTimeout(() => {
              btnCopyEmail.textContent = '[ COPY EMAIL ]';
            }, 2000);
          }).catch(() => {
            sound.copySuccess();
            btnCopyEmail.textContent = '[ COPIED ]';
          });
        } catch (e) {
          sound.copySuccess();
          btnCopyEmail.textContent = '[ COPIED ]';
        }
      };
    }

    const btnCopyMatrix = winEl.querySelector('#btnCopyMatrix');
    if (btnCopyMatrix) {
      btnCopyMatrix.onclick = () => {
        try {
          navigator.clipboard.writeText(config.matrixUser).then(() => {
            sound.copySuccess();
            btnCopyMatrix.textContent = '[ COPIED ]';
            setTimeout(() => {
              btnCopyMatrix.textContent = '[ COPY MATRIX ID ]';
            }, 2000);
          }).catch(() => {
            sound.copySuccess();
            btnCopyMatrix.textContent = '[ COPIED ]';
          });
        } catch (e) {
          sound.copySuccess();
          btnCopyMatrix.textContent = '[ COPIED ]';
        }
      };
    }
  }
};
