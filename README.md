# bunkernet.cc — macOS Terminal & 3D Network Web UI

An interactive, cyberpunk-inspired personal website and terminal interface featuring a macOS-style window manager, procedural Web Audio synthesizer, and a high-performance infinite 3D canvas node network.

Built with **pure vanilla HTML5, CSS3, and native ES Modules** — zero build step, zero npm dependencies, and completely open source.

---

## ✨ Features

- **macOS CRT Terminal UI**: Authentic scanline filters, phosphor glow breathing, horizontal sync jitter, and traffic light window controls (Minimize, Maximize, Close, and Dock Restore).
- **Multi-Theme Engine**: 11 synchronized visual themes with persistent preferences and automatic system (Light/Dark) appearance detection:
  - **System (Auto)**: Automatically adapts to your device's light or dark mode.
  - **Dark / Light**: Minimalist, high-contrast themes.
  - **Matrix**: Classic P31 monochrome phosphor green CRT.
  - **Ocean**: *Subnautica*-inspired bioluminescent abyss and Alterra PDA holographic cyan.
  - **Dracula, Nord, Amber, Tokyo Night, Gruvbox, Catppuccin, Monokai**.
- **Infinite 3D Canvas Network**: Mathematically continuous 3D node field rendered on a 2D canvas with toroidal wrapping, drag-to-rotate, mouse-wheel camera zoom, theme-reactive starlight particles, and cursor spring physics.
- **Procedural Web Audio Synthesizer**: Zero audio files loaded over the network! All mechanical keyboard clicks, CRT coil charging tones, window swooshes, and chimes are synthesized in real-time via the Web Audio API.
- **Dynamic Module Architecture**: Buttons, CLI commands, and modal windows are dynamically generated from modular ES modules in `js/modules/`.
- **Draggable Modal Windows**: Desktop-like modal windows with mouse/touch drag physics, auto-centering, backdrop blur, and Esc-key dismiss.
- **Interactive Terminal CLI**: Built-in shell with command history, live command execution (`about`, `work`, `notes`, `matrix`, `contact`, `theme [name|next|auto]`, `sound [on|off|toggle]`, `whoami`, `clear`, `help`), and mechanical keystroke feedback.
- **Live Integrations & Interactive Visuals**:
  - GitHub API repository showcase with offline fallback cache.
  - Fastfetch / Neofetch bio with interactive 3D ASCII Earth globe raytracer.
  - Canvas Matrix digital rain streamer.
- **Ultra-Lightweight & Fast**: Zero build dependencies, zero frameworks, instant load times, and battery-friendly `requestAnimationFrame` lifecycle management.

---

## 🚀 Quick Start & Hosting

Because this project uses native ES Modules without a bundler, you can host it anywhere that serves static files.

### 1. Local Preview

Start any local static server inside the project root:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js / npx
npx serve .

# Or using PHP
php -S localhost:8000
```

Open your browser and navigate to `http://localhost:8000`.

---

### 2. One-Click Free Static Hosting

| Platform | Deployment Instructions |
|---|---|
| **GitHub Pages** | Push repository to GitHub $\to$ Go to **Settings** $\to$ **Pages** $\to$ Select `main` branch / root $\to$ Save. |
| **Cloudflare Pages** | Connect GitHub repo $\to$ Set Build command: *(leave empty)* $\to$ Output directory: `/` $\to$ Deploy. |
| **Vercel** | Import repo $\to$ Framework Preset: `Other` $\to$ Root Directory: `./` $\to$ Deploy. |
| **Netlify** | Drag-and-drop the folder into Netlify Drop or link your Git repo with default static settings. |

---

### 3. Self-Hosting with Docker or Nginx

#### Using Docker
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t bunkernet-terminal .
docker run -d -p 8080:80 bunkernet-terminal
```

#### Using Caddy Server
```caddyfile
bunkernet.cc {
    root * /var/www/bunkernet
    file_server
    encode gzip zstd
}
```

---

## ⚙️ Configuration

Site-wide settings (such as your name, GitHub handle, Matrix address, and contact email) can be configured in a single file: [`js/config.js`](js/config.js).

```javascript
export const config = {
  siteName: 'bunkernet.cc',
  ownerName: 'Janik',
  promptUser: 'guest@bunkernet',
  promptPath: '~',

  // GitHub integration (fetches top recent repositories)
  githubUsername: 'your-github-username',

  // Notes knowledgebase URL (Quartz, Hugo, Obsidian Publish, etc.)
  notesUrl: 'https://notes.bunkernet.cc',

  // Matrix Community & Direct Messaging
  matrixRoomUrl: 'https://matrix.to/#/#your-room:matrix.org',
  matrixUser: '@user:matrix.org',
  matrixUserUrl: 'https://matrix.to/#/@user:matrix.org',

  // Contact email
  contactEmail: 'hello@example.com'
};
```

---

## 🧩 Adding & Modifying Button Modules

Adding a new launcher button, CLI command, and modal window takes just **one new module file**!

### Example: Creating a "Resume" Module

1. Create `js/modules/resume.js`:

```javascript
export default {
  id: 'resume',
  label: '[ RESUME ]',
  command: 'resume',
  windowTitle: 'Resume — bunkernet.cc',
  asciiArt: `  _____
 / ___ \\
| |   | |
 \\_____/`,

  render() {
    return `
      <div class="bio">
        <h2>Curriculum Vitae</h2>
        <p>Software Engineer & Systems Researcher.</p>
        <p><a href="/resume.pdf" class="mail-btn" target="_blank">Download PDF ↗</a></p>
      </div>
    `;
  },

  onOpen(winEl) {
    console.log('Resume modal opened!');
  }
};
```

2. Register it in [`js/modules/index.js`](js/modules/index.js):

```javascript
import resume from './resume.js';

export const modules = [
  about,
  work,
  resume, // <-- added here!
  notes,
  matrix,
  contact
];
```

The system automatically:
- Renders the ASCII button in the terminal grid.
- Registers the scramble-text decoder hover effect.
- Wires up the interactive CLI command (`guest@bunkernet ~ % resume`).
- Creates and manages the draggable modal window.

---

## 📁 Project Directory Structure

```
├── assets/                     # Branding & Logo images (WebP & PNG)
├── css/                        # Modular CSS stylesheets
│   ├── variables.css           # Color variables, fonts, and theme constants
│   ├── base.css                # Base reset, stage, desktop layout
│   ├── terminal.css            # macOS terminal, CRT filters, traffic lights
│   ├── apps.css                # Modal windows, project cards, profile styles
│   └── background.css          # Canvas styling
├── js/                         # Modular JavaScript (ES6 Modules)
│   ├── config.js               # Central site configuration
│   ├── theme.js                # Multi-theme state manager & color engine
│   ├── audio.js                # Procedural Web Audio API sound synthesizer
│   ├── background.js           # 3D infinite canvas node network simulation
│   ├── terminal.js             # Terminal traffic lights, boot sequence & CRT effects
│   ├── cli.js                  # Shell parser, command dispatcher & history
│   ├── window-manager.js       # Unified window coordinator & drag manager
│   ├── globe.js                # 3D ASCII Earth globe raytracer
│   ├── globe-data.js           # ASCII day & night planet textures
│   ├── modules/                # Extensible button & app registry
│   │   ├── index.js            # Module loader
│   │   ├── about.js            # Profile app module with 3D globe
│   │   ├── work.js             # GitHub API portfolio module
│   │   ├── notes.js            # Notes portal module
│   │   ├── matrix.js           # 2D Matrix rain canvas module
│   │   └── contact.js          # Contact & mail module
│   └── main.js                 # App boot orchestrator
├── index.html                  # Semantic HTML5 entry point
├── documentation.md            # In-depth architectural reference
├── LICENSE                     # MIT License
└── README.md                   # Open source guide & hosting instructions
```

---

## 📖 Deep-Dive Documentation

For architectural reference, mathematical physics derivations, procedural audio synthesis diagrams, and internal API details, see [`documentation.md`](documentation.md).

---

## 📜 License

[MIT License](LICENSE) — Feel free to use, modify, fork, and self-host for your personal portfolio, homelab portal, or organization.
