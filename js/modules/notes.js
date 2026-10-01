/**
 * Notes Module (External link confirmation modal to Quartz notes site)
 */
import { config } from '../config.js';
import { WindowManager } from '../window-manager.js';
import { t } from '../i18n.js';

export default {
  id: 'notes',
  get label() { return t('menu.notes'); },
  command: 'notes',
  get windowTitle() { return t('window.notes'); },
  windowClass: 'notes-window',
  baseWidth: 460,
  baseHeight: 200,
  asciiArt: ` _______
| === //|
| ===// |
| --//  |
|_______|`,

  hoverFrames: [
    ` _______
| --- //|
| ---// |
|   //  |
|_______|`,
    ` _______
| === //|
| ---// |
| --//  |
|_______|`,
    ` _______
| === //|
| ===// |
| ==//  |
|_______|`
  ],

  render() {
    return `
      <div class="tui-section">
        <div class="tui-line" data-tui-stream>${t('notes.prompt')}</div>
        <a class="tui-btn primary" href="${config.notesUrl}" target="_blank" rel="noopener" id="btnOpenNotes">${t('notes.openBtn')}</a>
        <button class="tui-btn" id="btnCancelNotes">${t('notes.cancelBtn')}</button>
      </div>
    `;
  },

  onOpen(winEl) {
    const btnCancel = winEl.querySelector('#btnCancelNotes');
    if (btnCancel) {
      btnCancel.onclick = () => {
        WindowManager.closeActive();
      };
    }
  }
};
