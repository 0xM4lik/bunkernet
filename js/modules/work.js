/**
 * Work / Projects App Module (Pure TUI Repository Registry)
 */
import { config } from '../config.js';
import { streamTUIContent } from '../terminal.js';
import { t, getLanguage } from '../i18n.js';

let projectsLoaded = false;

const FALLBACK_PROJECTS = [
  { name: 'bunker-notes', get description() { return t('work.fallback.notes'); }, lang: 'TypeScript', stars: '—', url: 'https://notes.bunkernet.cc' },
  { name: 'ctf-toolkit', get description() { return t('work.fallback.ctf'); }, lang: 'Python', stars: '—', url: `https://github.com/${config.githubUsername}/ctf-toolkit` },
  { name: 'homelab', get description() { return t('work.fallback.homelab'); }, lang: 'Shell', stars: '—', url: `https://github.com/${config.githubUsername}/homelab` },
  { name: 'this-site', get description() { return t('work.fallback.site'); }, lang: 'JavaScript', stars: '—', url: `https://github.com/${config.githubUsername}/bunkernet.cc` }
];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export default {
  id: 'work',
  get label() { return t('menu.work'); },
  command: 'work',
  get windowTitle() { return t('window.work'); },
  windowClass: 'work-window',
  baseWidth: 720,
  baseHeight: 520,
  asciiArt: `   _____
  |     |
 _|_____|_
|  [===]  |
|_________|`,

  hoverFrames: [
    `   _____
  |  _  |
 _|_____|_
|  [===]  |
|_________|`,
    `   _____
  | >_  |
 _|_____|_
|  [===]  |
|_________|`,
    `   _____
  | >#  |
 _|_____|_
|  [===]  |
|_________|`
  ],

  render() {
    return `
      <div class="tui-section">
        <div class="tui-heading" data-tui-stream>${t('work.skillsHeading')}</div>
        <div class="tui-line" data-tui-stream>[ Python ]  [ JavaScript ]  [ CSS ]  [ HTML ]  [ Linux ]  [ Docker ]</div>
      </div>

      <div class="tui-section">
        <div class="tui-heading" data-tui-stream>${t('work.projectsHeading')} <span class="tui-status-tag" id="workStatus">${t('work.statusConnecting')}</span></div>
        <div id="projectsList">
          <div class="tui-dim" data-tui-stream>${t('work.fetching')}</div>
        </div>
      </div>
    `;
  },

  async onOpen(winEl) {
    const list = winEl.querySelector('#projectsList');
    const statusEl = winEl.querySelector('#workStatus');
    if (!list) return;
    if (projectsLoaded && list.children.length > 0 && !list.querySelector('.tui-dim')) return;
    projectsLoaded = true;

    try {
      const res = await fetch(`https://api.github.com/users/${config.githubUsername}/repos?sort=updated&per_page=6`);
      if (!res.ok) throw new Error('GitHub fetch failed');
      const repos = await res.json();
      if (!Array.isArray(repos) || repos.length === 0) throw new Error('No repos');

      if (statusEl) {
        statusEl.className = 'tui-status-tag live';
        statusEl.textContent = t('work.statusLive');
      }

      list.innerHTML = repos.map(r => `
        <div class="tui-item">
          <div class="tui-bright" data-tui-stream>${escapeHtml(r.name)}</div>
          <div class="tui-line" data-tui-stream>${escapeHtml(r.description || t('work.noDesc'))}</div>
          <div class="tui-actions">
            <span class="tui-dim">${escapeHtml(r.language || 'Source')}</span>
            <span class="tui-dim">·</span>
            <span class="tui-dim">[ ★ ${r.stargazers_count} ]</span>
            <span class="tui-dim">·</span>
            <a class="tui-btn primary" href="${r.html_url}" target="_blank" rel="noopener">[ ${t('work.viewGithub')} ]</a>
          </div>
        </div>
      `).join('');
      streamTUIContent(list);
    } catch (err) {
      if (statusEl) {
        const retryLabel = getLanguage() === 'de' ? 'WIEDERHOLEN' : 'RETRY';
        const offlineLabel = getLanguage() === 'de' ? 'OFFLINE-CACHE' : 'OFFLINE CACHE';
        statusEl.className = 'tui-status-tag';
        statusEl.innerHTML = `[ ${offlineLabel} · <button class="tui-btn" id="btnRetryWork" style="font-size:11px;padding:0;">${retryLabel}</button> ]`;
        const retryBtn = statusEl.querySelector('#btnRetryWork');
        if (retryBtn) {
          retryBtn.onclick = (e) => {
            e.stopPropagation();
            projectsLoaded = false;
            list.innerHTML = `<div class="tui-dim">${t('work.retrying')}</div>`;
            this.onOpen(winEl);
          };
        }
      }

      list.innerHTML = FALLBACK_PROJECTS.map(p => `
        <div class="tui-item">
          <div class="tui-bright" data-tui-stream>${escapeHtml(p.name)}</div>
          <div class="tui-line" data-tui-stream>${escapeHtml(p.description)}</div>
          <div class="tui-actions">
            <span class="tui-dim">${escapeHtml(p.lang)}</span>
            <span class="tui-dim">·</span>
            <span class="tui-dim">[ ★ ${p.stars} ]</span>
            <span class="tui-dim">·</span>
            <a class="tui-btn primary" href="${p.url}" target="_blank" rel="noopener">[ ${t('work.viewGithub')} ]</a>
          </div>
        </div>
      `).join('');
      streamTUIContent(list);
    }
  }
};
