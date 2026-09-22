/**
 * Notes Module (External link confirmation modal to Quartz notes site)
 */
import { config } from '../config.js';
import { WindowManager } from '../window-manager.js';

export default {
  id: 'notes',
  label: '[ NOTES ]',
  command: 'notes',
  windowTitle: 'bunkernet.cc — notes',
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
        <div class="tui-line" data-tui-stream>Open notes in a new tab?</div>
        <a class="tui-btn primary" href="${config.notesUrl}" target="_blank" rel="noopener" id="btnOpenNotes">[ OPEN NOTES ↗ ]</a>
        <button class="tui-btn" id="btnCancelNotes">[ CANCEL ]</button>
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
