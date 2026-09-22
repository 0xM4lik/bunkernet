/**
 * Notes Module (External link to Quartz notes site)
 */
import { config } from '../config.js';

export default {
  id: 'notes',
  label: '[ NOTES ]',
  command: 'notes',
  url: config.notesUrl,
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
  ]
};

