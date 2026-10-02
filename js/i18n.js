/**
 * Site-wide Internationalization (i18n) Engine & Language State Manager
 * Provides EN / DE translation dictionaries, browser/system language auto-detection,
 * reactive update hooks, persistent preference storage, and accessible UI controls.
 */

import { sound } from './audio.js';

export const STORAGE_KEY = 'bunkernet_lang';

export const TRANSLATIONS = {
  en: {
    // Titlebar & Window Chrome
    'titlebar.close': 'Close',
    'titlebar.min': 'Minimize',
    'titlebar.max': 'Maximize',
    'titlebar.resize': 'Resize Terminal',
    'titlebar.theme': 'Switch Theme',
    'titlebar.lang': 'Switch to German',
    'titlebar.langAria': 'Switch language (currently English)',
    'dock.terminal': 'Terminal',
    'terminal.github': 'View on GitHub',
    'terminal.githubAria': 'View bunkernet repository on GitHub',

    // Audio Consent Prompt
    'audio.enableText': 'Enable sound effects?',
    'audio.yes': '[ YES ]',
    'audio.no': '[ NO ]',
    'audio.yesAria': 'Enable Sound',
    'audio.noAria': 'Mute Audio',

    // Theme Menu
    'theme.auto': 'Auto (System)',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.section': 'Themes',
    'theme.cliHint': 'cli: theme <name> | theme next',

    // ASCII Launcher Menu Buttons
    'menu.about': '[ ABOUT ]',
    'menu.work': '[ WORK ]',
    'menu.notes': '[ NOTES ]',
    'menu.matrix': '[ MATRIX ]',
    'menu.contact': '[ CONTACT ]',

    // Window Titles
    'window.about': 'bunkernet.cc — about',
    'window.work': 'bunkernet.cc — work',
    'window.notes': 'bunkernet.cc — notes',
    'window.matrix': 'bunkernet.cc — matrix',
    'window.contact': 'bunkernet.cc — contact',

    // About Module
    'about.spec.workstation': 'Workstation OS:',
    'about.spec.server': 'Server OS:',
    'about.spec.linuxEnvs': 'Linux Environments:',
    'about.spec.virtualization': 'Virtualization:',
    'about.spec.networking': 'Networking:',
    'about.spec.storage': 'Storage & Filesystems:',
    'about.spec.scripting': 'Scripting & Programming:',
    'about.spec.aiTools': 'AI Tooling:',
    'about.spec.languages': 'Languages:',
    'about.spec.languagesVal': 'German (Native), English',
    'about.bio1': "Hey, I'm Janik, also known as **0xM4lik** online. I love **open-source software** and learning new tech.",
    'about.bio2': "I made this website to share some of the things I have learned over the years and some of my projects. Most of my time goes into **security research**, **CTFs** and improving / maintaining my **homelab**.",

    // Work Module
    'work.skillsHeading': 'Skills & Technologies:',
    'work.projectsHeading': 'Projects & Repositories:',
    'work.statusConnecting': '[ CONNECTING ]',
    'work.statusLive': '[ LIVE: GITHUB ]',
    'work.statusOffline': '[ OFFLINE CACHE · RETRY ]',
    'work.fetching': '[ Fetching repositories from GitHub... ]',
    'work.retrying': '[ Retrying GitHub connection... ]',
    'work.viewGithub': '[ VIEW ON GITHUB ]',
    'work.noDesc': 'No description provided.',
    'work.fallback.notes': 'Quartz notes site, self-hosted on bunker infrastructure.',
    'work.fallback.ctf': 'Scripts and automation tools for security research & CTFs.',
    'work.fallback.homelab': 'Infrastructure-as-code configuration for the bunkernet stack.',
    'work.fallback.site': 'Zero-build procedural terminal website with Web Audio & 3D starfield.',

    // Notes Module
    'notes.prompt': 'Open notes in a new tab?',
    'notes.openBtn': '[ OPEN NOTES ↗ ]',
    'notes.cancelBtn': '[ CANCEL ]',

    // Matrix Module
    'matrix.cta': '[ JOIN THE BUNKERSPACE ]',
    'matrix.ctaAria': 'Join the Bunkerspace on Matrix',

    // Contact Module
    'contact.emailLabel': 'Email:',
    'contact.matrixLabel': 'Matrix:',
    'contact.emailMe': '[ EMAIL ME ]',
    'contact.messageMatrix': '[ MESSAGE ON MATRIX ]',
    'contact.copyEmail': '[ COPY EMAIL ]',
    'contact.copyMatrix': '[ COPY MATRIX ID ]',
    'contact.copied': '[ COPIED ]',

    // CLI & System Messages
    'cli.helpCommands': 'commands: {mods}, theme [name|next|auto], sound [on|off|toggle], lang [en|de|toggle], whoami, clear, help',
    'cli.soundMuted': 'sound effects muted.',
    'cli.soundEnabled': 'sound effects enabled.',
    'cli.soundStatus': 'sound is currently {state}. Usage: sound on | sound off | sound toggle',
    'cli.windowClosed': 'window closed.',
    'cli.closeHint': 'use titlebar buttons to minimize/close terminal.',
    'cli.opening': 'opening {target}...',
    'cli.cmdNotFound': "command not found: {cmd}. Type 'help' for available commands.",
    'cli.langSwitched': 'language switched to: {lang}',
    'cli.langCurrent': 'current language: {lang}. Usage: lang en | lang de | lang toggle'
  },

  de: {
    // Titlebar & Window Chrome
    'titlebar.close': 'Schließen',
    'titlebar.min': 'Minimieren',
    'titlebar.max': 'Maximieren',
    'titlebar.resize': 'Terminal skalieren',
    'titlebar.theme': 'Theme wechseln',
    'titlebar.lang': 'Auf Englisch wechseln',
    'titlebar.langAria': 'Sprache wechseln (aktuell Deutsch)',
    'dock.terminal': 'Terminal',
    'terminal.github': 'Auf GitHub ansehen',
    'terminal.githubAria': 'Bunkernet-Repository auf GitHub ansehen',

    // Audio Consent Prompt
    'audio.enableText': 'Soundeffekte aktivieren?',
    'audio.yes': '[ JA ]',
    'audio.no': '[ NEIN ]',
    'audio.yesAria': 'Sound aktivieren',
    'audio.noAria': 'Stummschalten',

    // Theme Menu
    'theme.auto': 'Auto (System)',
    'theme.dark': 'Dunkel',
    'theme.light': 'Hell',
    'theme.section': 'Themes',
    'theme.cliHint': 'cli: theme <name> | theme next',

    // ASCII Launcher Menu Buttons
    'menu.about': '[ ÜBER MICH ]',
    'menu.work': '[ PROJEKTE ]',
    'menu.notes': '[ NOTIZEN ]',
    'menu.matrix': '[ MATRIX ]',
    'menu.contact': '[ KONTAKT ]',

    // Window Titles
    'window.about': 'bunkernet.cc — über mich',
    'window.work': 'bunkernet.cc — projekte',
    'window.notes': 'bunkernet.cc — notizen',
    'window.matrix': 'bunkernet.cc — matrix',
    'window.contact': 'bunkernet.cc — kontakt',

    // About Module
    'about.spec.workstation': 'Workstation OS:',
    'about.spec.server': 'Server OS:',
    'about.spec.linuxEnvs': 'Linux-Umgebungen:',
    'about.spec.virtualization': 'Virtualisierung:',
    'about.spec.networking': 'Netzwerk:',
    'about.spec.storage': 'Storage & Dateisysteme:',
    'about.spec.scripting': 'Skripting & Programmierung:',
    'about.spec.aiTools': 'KI-Tools:',
    'about.spec.languages': 'Sprachen:',
    'about.spec.languagesVal': 'Deutsch (Muttersprache), Englisch',
    'about.bio1': 'Hey, ich bin Janik, online bekannt als **0xM4lik**. Ich liebe **Open-Source-Software** und neue Technologien.',
    'about.bio2': 'Mit dieser Website möchte ich Erfahrungen und Projekte der letzten Jahre teilen. Die meiste Zeit widme ich der **IT-Sicherheitsforschung**, **CTFs** sowie dem Betrieb und Ausbau meines **Homelabs**.',

    // Work Module
    'work.skillsHeading': 'Skills & Technologien:',
    'work.projectsHeading': 'Projekte & Repositories:',
    'work.statusConnecting': '[ VERBINDE... ]',
    'work.statusLive': '[ LIVE: GITHUB ]',
    'work.statusOffline': '[ OFFLINE-CACHE · WIEDERHOLEN ]',
    'work.fetching': '[ Repositories von GitHub werden geladen... ]',
    'work.retrying': '[ GitHub-Verbindung wird wiederholt... ]',
    'work.viewGithub': '[ AUF GITHUB ANSEHEN ]',
    'work.noDesc': 'Keine Beschreibung vorhanden.',
    'work.fallback.notes': 'Quartz-Notizen-Website, selbstgehostet auf Bunker-Infrastruktur.',
    'work.fallback.ctf': 'Skripte und Automatisierungstools für IT-Sicherheit & CTFs.',
    'work.fallback.homelab': 'Infrastructure-as-Code-Konfiguration für den bunkernet-Stack.',
    'work.fallback.site': 'Zero-Build prozedurale Terminal-Website mit Web Audio & 3D-Sternenfeld.',

    // Notes Module
    'notes.prompt': 'Notizen in neuem Tab öffnen?',
    'notes.openBtn': '[ NOTIZEN ÖFFNEN ↗ ]',
    'notes.cancelBtn': '[ ABBRECHEN ]',

    // Matrix Module
    'matrix.cta': '[ DEM BUNKERSPACE BEITRETEN ]',
    'matrix.ctaAria': 'Dem Bunkerspace auf Matrix beitreten',

    // Contact Module
    'contact.emailLabel': 'E-Mail:',
    'contact.matrixLabel': 'Matrix:',
    'contact.emailMe': '[ E-MAIL SENDEN ]',
    'contact.messageMatrix': '[ AUF MATRIX NACHRICHT SENDEN ]',
    'contact.copyEmail': '[ E-MAIL KOPIEREN ]',
    'contact.copyMatrix': '[ MATRIX-ID KOPIEREN ]',
    'contact.copied': '[ KOPIERT ]',

    // CLI & System Messages
    'cli.helpCommands': 'Befehle: {mods}, theme [name|next|auto], sound [on|off|toggle], lang [en|de|toggle], whoami, clear, help',
    'cli.soundMuted': 'Soundeffekte stummgeschaltet.',
    'cli.soundEnabled': 'Soundeffekte aktiviert.',
    'cli.soundStatus': 'Sound ist aktuell {state}. Verwendung: sound on | sound off | sound toggle',
    'cli.windowClosed': 'Fenster geschlossen.',
    'cli.closeHint': 'Verwende die Titelleisten-Buttons zum Minimieren/Schließen.',
    'cli.opening': 'Öffne {target}...',
    'cli.cmdNotFound': "Befehl nicht gefunden: {cmd}. Tippe 'help' für verfügbare Befehle.",
    'cli.langSwitched': 'Sprache gewechselt zu: {lang}',
    'cli.langCurrent': 'Aktuelle Sprache: {lang}. Verwendung: lang en | lang de | lang toggle'
  }
};

let currentLanguage = 'en';
const langListeners = new Set();

/**
 * Detects whether the user's browser or operating system preferences indicate German.
 * @returns {'de'|'en'}
 */
export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const navLangs = (navigator.languages && navigator.languages.length > 0)
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || ''];
  for (let i = 0; i < navLangs.length; i++) {
    const l = (navLangs[i] || '').toLowerCase();
    if (l.indexOf('de') === 0) {
      return 'de';
    }
  }
  return 'en';
}

/**
 * Returns the currently active language code ('en' | 'de').
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Resolves a translation string for the active language with optional variable interpolation.
 * @param {string} key - Dictionary key.
 * @param {Object} [params] - Replacement variables (e.g. { cmd: 'test' }).
 * @param {string} [fallback] - Fallback string if key not found.
 * @returns {string}
 */
export function t(key, params = {}, fallback = '') {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || fallback || key;
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return text;
}

/**
 * Sets the active language, updates DOM attributes, persists preference, and notifies subscribers.
 * @param {'en'|'de'} lang - Target language.
 * @param {boolean} [persist=true] - Whether to save to localStorage.
 */
export function setLanguage(lang, persist = true) {
  const target = (lang === 'de' || lang === 'en') ? lang : 'en';
  const prevLang = currentLanguage;
  currentLanguage = target;

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, target);
    } catch (e) {}
  }

  // Update HTML document lang attribute
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', target);
  }

  // Update titlebar button UI
  updateLangButtonUI();

  // Notify registered listeners
  langListeners.forEach(fn => {
    try {
      fn(currentLanguage, prevLang);
    } catch (err) {
      console.error('Error in language listener:', err);
    }
  });

  return currentLanguage;
}

/**
 * Toggles between 'en' and 'de'.
 * @returns {'en'|'de'} The new active language.
 */
export function toggleLanguage() {
  const next = currentLanguage === 'de' ? 'en' : 'de';
  return setLanguage(next, true);
}

/**
 * Subscribes a listener callback to language change events.
 * @param {Function} listener - (currentLang, prevLang) => void
 * @returns {Function} Unsubscribe function.
 */
export function onLanguageChange(listener) {
  if (typeof listener === 'function') {
    langListeners.add(listener);
  }
  return () => langListeners.delete(listener);
}

/**
 * Updates the titlebar language toggle button's label, title, and aria attributes.
 */
export function updateLangButtonUI() {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('langToggleBtn');
  const label = document.getElementById('langBtnLabel');
  if (!btn && !label) return;

  const isDE = currentLanguage === 'de';
  if (label) {
    label.textContent = isDE ? 'DE' : 'EN';
  }
  if (btn) {
    btn.setAttribute('title', isDE ? t('titlebar.lang') : t('titlebar.lang'));
    btn.setAttribute('aria-label', t('titlebar.langAria'));
  }
}

/**
 * Sets up event listeners on the titlebar language toggle button.
 */
export function setupLangToggle() {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('langToggleBtn');
  if (!btn) return;

  // Prevent titlebar dragging when interacting with button
  const stopProp = (e) => e.stopPropagation();
  btn.addEventListener('pointerdown', stopProp);
  btn.addEventListener('mousedown', stopProp);
  btn.addEventListener('touchstart', stopProp);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    sound.pickup();
    toggleLanguage();
  });

  updateLangButtonUI();
}

/**
 * Initializes the i18n subsystem: detects initial language and updates DOM.
 */
export function initI18n() {
  let initial = null;
  try {
    initial = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}

  const urlLang = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;
  if (urlLang === 'de' || urlLang === 'en') {
    initial = urlLang;
  } else if (initial !== 'de' && initial !== 'en') {
    initial = detectBrowserLanguage();
  }

  currentLanguage = initial;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', currentLanguage);
  }
  updateLangButtonUI();
}
