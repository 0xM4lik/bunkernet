/**
 * Infinite 3D Canvas Network Background Simulation
 * Renders a full-viewport, infinitely-traversable 3D node network on a <canvas>
 * using 2D canvas context with manual pinhole perspective projection and spatial bucketing.
 */

let controlsEnabled = false;
let canvasElement = null;

let currentThemeBg = "#000000";
let nodeRgb = [255, 255, 255];
let lineRgb = [255, 255, 255];

const RGBA_LUT_SIZE = 256;
const nodeRgbaLut = new Array(RGBA_LUT_SIZE + 1);
const lineRgbaLut = new Array(RGBA_LUT_SIZE + 1);

function rebuildLuts() {
  const [nr, ng, nb] = nodeRgb;
  const [lr, lg, lb] = lineRgb;
  for (let i = 0; i <= RGBA_LUT_SIZE; i++) {
    const a = (i / RGBA_LUT_SIZE).toFixed(3);
    nodeRgbaLut[i] = "rgba(" + nr + "," + ng + "," + nb + "," + a + ")";
    lineRgbaLut[i] = "rgba(" + lr + "," + lg + "," + lb + "," + a + ")";
  }
}
rebuildLuts();

function getNodeRgba(alpha) {
  const idx = Math.max(0, Math.min(RGBA_LUT_SIZE, (alpha * RGBA_LUT_SIZE + 0.5) | 0));
  return nodeRgbaLut[idx];
}

function getLineRgba(alpha) {
  const idx = Math.max(0, Math.min(RGBA_LUT_SIZE, (alpha * RGBA_LUT_SIZE + 0.5) | 0));
  return lineRgbaLut[idx];
}

let currentThemeId = "matrix";

export function updateBackgroundTheme(themeConfig) {
  if (!themeConfig) return;
  currentThemeId = themeConfig.id || "matrix";
  currentThemeBg = themeConfig.bgHex || "#000000";
  nodeRgb = themeConfig.nodeRgb || themeConfig.primaryRgb || [255, 255, 255];
  lineRgb = themeConfig.lineRgb || [255, 255, 255];
  rebuildLuts();
}

export function setBackgroundControlsEnabled(enabled) {
  controlsEnabled = Boolean(enabled);
  if (canvasElement) {
    canvasElement.style.cursor = controlsEnabled ? "grab" : "default";
  }
}

export function isBackgroundControlsEnabled() {
  return controlsEnabled;
}

export function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  canvasElement = canvas;

  const ctx = canvas.getContext("2d", { alpha: false });
  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;

  const CFG = {
    nodeCount: 230,

    // Repeating volume
    worldX: 1900,
    worldY: 1450,
    worldZ: 1250,

    // 3D connection distances
    linkDist: 180,
    linkDepth: 125,
    maxLineLength: 260,

    // Cursor reaction
    cursorRadius: 300,
    cursor3DStrength: 62,
    cursorTwist: 0.075,
    cursorLineRadius: 340,
    cursorLineBoost: 4.2,
    cursorLinkBonus: 90,

    // Rendering / appearance
    baseAlpha: 0.095,
    nodeGlow: 0.48,
    lineBaseAlpha: 0.52,

    // Natural motion
    ambientAmp: 7,
    springK: 0.00165,
    damping: 0.925,

    // Camera
    cameraDistance: 1080,
    perspective: 900,
    autoYawSpeed: 0.000065,
    autoRollAmp: 0.028,
    autoPitchAmp: 0.045,
    autoTravelSpeed: 0.012,

    // Manual movement
    rotationSensitivity: 0.0062,
    rotationDamping: 0.90,
    wheelSpeed: 1.35,
    wheelImpulseDecay: 0.88,
    maxWheelSpeed: 2.7,

    // Startup reveal
    revealDuration: 1500,
    revealBand: 150,
    revealFeather: 85,
    revealPulseWidth: 95,
    revealPulseOffset: 18,
    revealPulseScale: 0.12,

    // Camera rotation smoothing
    rotationSmoothness: 0.16
  };

  let nodes = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let pointer = {
    down: false,
    id: null,
    lastX: 0,
    lastY: 0
  };

  let userYaw = 0;
  let userPitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;

  const revealStart = performance.now();

  let camX = 0, camY = 0, camZ = 0;
  let wheelVelocity = 0;

  let lastFrame = performance.now();
  let running = true;

  const totalNodeCount = CFG.nodeCount;

  // Persistent depth-sort index array
  const order = new Int32Array(totalNodeCount);
  for (let i = 0; i < totalNodeCount; i++) order[i] = i;

  // Spatial grid for connection pair pruning
  const maxReach = Math.min(CFG.maxLineLength, CFG.linkDist + CFG.cursorLinkBonus);
  const gridDimX = Math.max(3, Math.floor(CFG.worldX / maxReach));
  const gridDimY = Math.max(3, Math.floor(CFG.worldY / maxReach));
  const gridDimZ = Math.max(3, Math.floor(CFG.worldZ / maxReach));
  const cellWidthX = CFG.worldX / gridDimX;
  const cellWidthY = CFG.worldY / gridDimY;
  const cellWidthZ = CFG.worldZ / gridDimZ;
  const totalCells = gridDimX * gridDimY * gridDimZ;

  const gridHead = new Int32Array(totalCells);
  const gridNext = new Int32Array(totalNodeCount);

  // 13 forward periodic neighbor offsets
  const NEIGHBOR_OFFSETS = [
    [-1, -1, 1], [0, -1, 1], [1, -1, 1],
    [-1,  0, 1], [0,  0, 1], [1,  0, 1],
    [-1,  1, 1], [0,  1, 1], [1,  1, 1],
    [-1,  1, 0], [0,  1, 0], [1,  1, 0],
    [1, 0, 0]
  ];

  const cellNeighbors = new Int32Array(totalCells * 13);
  for (let gz = 0; gz < gridDimZ; gz++) {
    for (let gy = 0; gy < gridDimY; gy++) {
      for (let gx = 0; gx < gridDimX; gx++) {
        const c = gx + gy * gridDimX + gz * gridDimX * gridDimY;
        for (let o = 0; o < 13; o++) {
          const nx = (gx + NEIGHBOR_OFFSETS[o][0] + gridDimX) % gridDimX;
          const ny = (gy + NEIGHBOR_OFFSETS[o][1] + gridDimY) % gridDimY;
          const nz = (gz + NEIGHBOR_OFFSETS[o][2] + gridDimZ) % gridDimZ;
          cellNeighbors[c * 13 + o] = nx + ny * gridDimX + nz * gridDimX * gridDimY;
        }
      }
    }
  }

  // Preallocated math/state objects to eliminate garbage collection
  const cameraForward = { x: 0, y: 0, z: 0 };
  const revealState = { progress: 1, radius: Infinity };
  const pulseResult = { x: 0, y: 0, scale: 1, strength: 0 };

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(0xC0FFEE42);

  function wrap(v, size) {
    v %= size;
    return v < 0 ? v + size : v;
  }

  function wrappedDelta(a, b, size) {
    let d = a - b;
    d -= Math.round(d / size) * size;
    return d;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!nodes.length) buildNodes();
  }

  function buildNodes() {
    const clusters = Array.from({ length: 11 }, () => ({
      x: (rand() - 0.5) * CFG.worldX * 0.84,
      y: (rand() - 0.5) * CFG.worldY * 0.84,
      z: (rand() - 0.5) * CFG.worldZ * 0.84
    }));

    nodes = new Array(CFG.nodeCount);

    for (let i = 0; i < CFG.nodeCount; i++) {
      const c = clusters[Math.floor(rand() * clusters.length)];
      const clusterSpread = 0.55 + rand() * 0.30;

      const hx = c.x + (rand() - 0.5) * CFG.worldX * clusterSpread;
      const hy = c.y + (rand() - 0.5) * CFG.worldY * clusterSpread;
      const hz = c.z + (rand() - 0.5) * CFG.worldZ * clusterSpread;

      nodes[i] = {
        hx: wrap(hx, CFG.worldX) - CFG.worldX * 0.5,
        hy: wrap(hy, CFG.worldY) - CFG.worldY * 0.5,
        hz: wrap(hz, CFG.worldZ) - CFG.worldZ * 0.5,

        x: wrap(hx, CFG.worldX) - CFG.worldX * 0.5,
        y: wrap(hy, CFG.worldY) - CFG.worldY * 0.5,
        z: wrap(hz, CFG.worldZ) - CFG.worldZ * 0.5,
        vx: 0, vy: 0, vz: 0,

        r: 0.85 + rand() * 1.25,
        phase: rand() * Math.PI * 2,
        freq: 0.42 + rand() * 0.62,

        proximity: 0,
        vis: CFG.baseAlpha,
        reveal: 0,
        screenX: 0,
        screenY: 0,
        depth: 0,
        visible: false,
        proj: {
          x: 0,
          y: 0,
          scale: 0,
          depth: 0,
          worldX: 0,
          worldY: 0,
          worldZ: 0
        }
      };
    }
  }

  function updatePointer(x, y) {
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
  }

  window.addEventListener("mousemove", e => {
    updatePointer(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  canvas.style.touchAction = "none";
  canvas.style.cursor = "default";

  canvas.addEventListener("pointerdown", e => {
    if (!controlsEnabled) return;
    if (e.button !== 0 && e.pointerType !== "touch") return;

    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.startX = e.clientX;
    pointer.startY = e.clientY;
    pointer.startTime = performance.now();
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;

    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", e => {
    updatePointer(e.clientX, e.clientY);

    if (!pointer.down) {
      canvas.style.cursor = controlsEnabled ? "grab" : "default";
    }

    if (!controlsEnabled || !pointer.down || pointer.id !== e.pointerId) return;

    const dx = e.clientX - pointer.lastX;
    const dy = e.clientY - pointer.lastY;

    targetYaw += dx * CFG.rotationSensitivity;
    targetPitch += dy * CFG.rotationSensitivity;

    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
  });

  function stopDrag(e) {
    if (!pointer.down) return;
    if (e && pointer.id !== e.pointerId) return;

    pointer.down = false;
    pointer.id = null;
    canvas.style.cursor = controlsEnabled ? "grab" : "default";

    if (e && e.pointerId != null) {
      canvas.releasePointerCapture?.(e.pointerId);
    }
  }

  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  canvas.addEventListener("wheel", e => {
    if (!controlsEnabled) return;
    e.preventDefault();

    wheelVelocity += e.deltaY * 0.015 * CFG.wheelSpeed;
    wheelVelocity = Math.max(-CFG.maxWheelSpeed, Math.min(CFG.maxWheelSpeed, wheelVelocity));
  }, { passive: false });

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function updateCameraAxes(yaw, pitch) {
    const cp = Math.cos(pitch);
    cameraForward.x = Math.sin(yaw) * cp;
    cameraForward.y = Math.sin(pitch);
    cameraForward.z = Math.cos(yaw) * cp;
  }

  function projectNode(n, yaw, pitch, roll, out) {
    const x = wrappedDelta(n.x, camX, CFG.worldX);
    const y = wrappedDelta(n.y, camY, CFG.worldY);
    const z = wrappedDelta(n.z, camZ, CFG.worldZ);

    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;

    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;

    const cr = Math.cos(roll), sr = Math.sin(roll);
    const x3 = x1 * cr - y2 * sr;
    const y3 = x1 * sr + y2 * cr;

    const depth = CFG.cameraDistance - z2;
    if (depth < 70) return false;

    const scale = CFG.perspective / depth;
    out.x = W * 0.5 + x3 * scale;
    out.y = H * 0.5 + y3 * scale;
    out.scale = scale;
    out.depth = depth;
    out.worldX = x;
    out.worldY = y;
    out.worldZ = z;
    return true;
  }

  function update(now, dt, autoYaw, autoPitch, autoRoll = 0) {
    const rotationLerp = 1 - Math.pow(1 - CFG.rotationSmoothness, dt / 16.67);
    userYaw += (targetYaw - userYaw) * rotationLerp;
    userPitch += (targetPitch - userPitch) * rotationLerp;

    const yaw = autoYaw + userYaw;
    const pitch = autoPitch + userPitch;
    const roll = autoRoll;

    const cy = Math.cos(yaw), syaw = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);

    if (!prefersReducedMotion) {
      updateCameraAxes(yaw, pitch);

      const autoTravel = CFG.autoTravelSpeed * dt;
      const travel = wheelVelocity * dt + autoTravel;

      camX = wrap(
        camX + cameraForward.x * travel + Math.sin(now * 0.00009) * 0.002 * dt,
        CFG.worldX
      );
      camY = wrap(
        camY + cameraForward.y * travel,
        CFG.worldY
      );
      camZ = wrap(
        camZ + cameraForward.z * travel,
        CFG.worldZ
      );
    }

    wheelVelocity *= Math.pow(CFG.wheelImpulseDecay, dt / 16.67);

    const isOcean = currentThemeId === 'ocean';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      const ambX = (Math.sin(now * 0.00045 * n.freq + n.phase) + (isOcean ? Math.sin(now * 0.0002 + n.hz * 0.002) * 0.4 : 0)) * (isOcean ? 9 : CFG.ambientAmp);
      const ambY = (Math.cos(now * 0.00055 * n.freq + n.phase * 1.37) + (isOcean ? Math.sin(now * 0.00025 + n.hx * 0.002) * 0.5 : 0)) * (isOcean ? 10 : CFG.ambientAmp);
      const ambZ = Math.sin(now * 0.00040 * n.freq + n.phase * 0.71) * (isOcean ? 8 : CFG.ambientAmp * 0.85);

      let targetX = n.hx + ambX;
      let targetY = n.hy + ambY;
      let targetZ = n.hz + ambZ;

      let proximity = 0;

      if (mouse.active && !prefersReducedMotion && n.visible) {
        const dx = mouse.x - n.screenX;
        const dy = mouse.y - n.screenY;
        const dist = Math.hypot(dx, dy);
        proximity = 1 - smoothstep(0, CFG.cursorRadius, dist);

        if (proximity > 0) {
          // Normalized screen direction vector
          const sx = dx / Math.max(1, dist);
          const sy = dy / Math.max(1, dist);

          // Inverse camera rotation to transform screen-plane vector into 3D world space
          const ix1 = sx * cr + sy * sr;
          const iy2 = -sx * sr + sy * cr;
          const iy = iy2 * cp;
          const iz1 = -iy2 * sp;

          const wx = ix1 * cy + iz1 * syaw;
          const wy = iy;
          const wz = -ix1 * syaw + iz1 * cy;

          const influence = proximity * proximity * CFG.cursor3DStrength;
          // True 3D repulsion directly away from cursor on screen
          targetX += -wx * influence;
          targetY += -wy * influence;
          targetZ += -wz * influence + Math.sin((mouse.x / W - 0.5) * Math.PI) * influence * CFG.cursorTwist;
        }
      }

      n.vx += (targetX - n.x) * CFG.springK * dt;
      n.vy += (targetY - n.y) * CFG.springK * dt;
      n.vz += (targetZ - n.z) * CFG.springK * dt;

      const damping = Math.pow(CFG.damping, dt / 16.67);
      n.vx *= damping;
      n.vy *= damping;
      n.vz *= damping;

      n.x += n.vx * dt * 0.05;
      n.y += n.vy * dt * 0.05;
      n.z += n.vz * dt * 0.05;

      n.proximity += (proximity - n.proximity) * Math.min(1, dt * 0.010);
      n.vis += (CFG.baseAlpha + 0.32 * n.proximity - n.vis) * Math.min(1, dt * 0.011);
    }
  }

  function updateRevealState(now) {
    if (prefersReducedMotion) {
      revealState.progress = 1;
      revealState.radius = Infinity;
      return revealState;
    }

    const progress = Math.max(0, Math.min(1, (now - revealStart) / CFG.revealDuration));
    const eased = progress * progress * (3 - 2 * progress);
    const radius = eased * (Math.hypot(W, H) * 0.5 + CFG.revealBand * 1.15);

    revealState.progress = progress;
    revealState.radius = radius;
    return revealState;
  }

  function revealFactor(x, y, reveal) {
    if (!Number.isFinite(reveal.radius)) return 1;

    const dist = Math.hypot(x - W * 0.5, y - H * 0.5);

    // The network is uncovered by a real expanding front: everything behind
    // the front is fully revealed, while the leading edge remains softly feathered.
    const revealCore = 1 - smoothstep(
      reveal.radius,
      reveal.radius + CFG.revealFeather,
      dist
    );

    return Math.min(1, Math.max(0, revealCore));
  }

  function revealPulse(x, y, reveal, out) {
    if (!Number.isFinite(reveal.radius) || reveal.progress >= 1) {
      out.x = 0;
      out.y = 0;
      out.scale = 1;
      out.strength = 0;
      return out;
    }

    const cx = W * 0.5;
    const cy = H * 0.5;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      out.x = 0;
      out.y = 0;
      out.scale = 1 + CFG.revealPulseScale;
      out.strength = 1;
      return out;
    }

    const offset = dist - reveal.radius;
    const strength = Math.exp(-(offset * offset) / (2 * CFG.revealPulseWidth * CFG.revealPulseWidth));
    const falloff = 1 - reveal.progress * 0.35;

    out.x = (dx / dist) * CFG.revealPulseOffset * strength * falloff;
    out.y = (dy / dist) * CFG.revealPulseOffset * strength * falloff;
    out.scale = 1 + CFG.revealPulseScale * strength * falloff;
    out.strength = strength * falloff;
    return out;
  }

  function draw(now, dt, autoYaw, autoPitch, autoRoll) {
    ctx.fillStyle = currentThemeBg;
    ctx.fillRect(0, 0, W, H);

    const reveal = updateRevealState(now);

    const yaw = autoYaw + userYaw;
    const pitch = autoPitch + userPitch;

    // Reset spatial grid
    gridHead.fill(-1);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isVisible = projectNode(n, yaw, pitch, autoRoll, n.proj);

      n.visible = isVisible;

      if (isVisible) {
        n.reveal = revealFactor(n.proj.x, n.proj.y, reveal);
        const pulse = revealPulse(n.proj.x, n.proj.y, reveal, pulseResult);
        n.proj.x += pulse.x;
        n.proj.y += pulse.y;
        n.proj.scale *= pulse.scale;

        n.screenX = n.proj.x;
        n.screenY = n.proj.y;
        n.depth = n.proj.depth;

        // Insert into spatial grid
        const gx = Math.min(gridDimX - 1, Math.max(0, Math.floor(wrap(n.x + CFG.worldX * 0.5, CFG.worldX) / cellWidthX)));
        const gy = Math.min(gridDimY - 1, Math.max(0, Math.floor(wrap(n.y + CFG.worldY * 0.5, CFG.worldY) / cellWidthY)));
        const gz = Math.min(gridDimZ - 1, Math.max(0, Math.floor(wrap(n.z + CFG.worldZ * 0.5, CFG.worldZ) / cellWidthZ)));
        const cellIdx = gx + gy * gridDimX + gz * gridDimX * gridDimY;
        gridNext[i] = gridHead[cellIdx];
        gridHead[cellIdx] = i;
      } else {
        n.reveal = 0;
      }
    }

    // In-place insertion sort by depth (farthest first)
    for (let i = 1; i < order.length; i++) {
      const key = order[i];
      const keyDepth = nodes[key].visible ? nodes[key].proj.depth : Infinity;
      let j = i - 1;
      while (j >= 0 && (nodes[order[j]].visible ? nodes[order[j]].proj.depth : Infinity) < keyDepth) {
        order[j + 1] = order[j];
        j--;
      }
      order[j + 1] = key;
    }

    ctx.lineCap = "round";

    function drawConnection(i, j) {
      const a = nodes[i];
      const b = nodes[j];
      const pa = a.proj;
      const pb = b.proj;

      const dx = wrappedDelta(a.x, b.x, CFG.worldX);
      const dy = wrappedDelta(a.y, b.y, CFG.worldY);
      const dz = wrappedDelta(a.z, b.z, CFG.worldZ);

      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq > CFG.maxLineLength * CFG.maxLineLength) return;

      const nodeCursor = Math.max(a.proximity, b.proximity);
      const baseReach = CFG.linkDist + CFG.cursorLinkBonus * nodeCursor;

      if (distSq > baseReach * baseReach) return;
      if (Math.abs(dz) > CFG.linkDepth + 70 * nodeCursor) return;

      const sDx = pa.x - pb.x;
      const sDy = pa.y - pb.y;
      if (sDx * sDx + sDy * sDy > CFG.maxLineLength * CFG.maxLineLength) return;

      const dist = Math.sqrt(distSq);
      const distT = Math.max(0, 1 - dist / baseReach);

      const midX = (pa.x + pb.x) * 0.5;
      const midY = (pa.y + pb.y) * 0.5;

      const cursorLine = mouse.active
        ? 1 - smoothstep(0, CFG.cursorLineRadius, Math.hypot(mouse.x - midX, mouse.y - midY))
        : 0;

      const depthFade = Math.min(1, Math.min(pa.scale, pb.scale) * 1.55);
      const boost = 1 + cursorLine * cursorLine * (CFG.cursorLineBoost - 1);

      const revealAlpha = Math.min(a.reveal, b.reveal);
      if (revealAlpha <= 0.001) return;

      const alpha = distT * Math.min(a.vis, b.vis) * CFG.lineBaseAlpha * depthFade * boost * revealAlpha;
      if (alpha < 0.004) return;

      ctx.lineWidth = 0.55 + cursorLine * cursorLine * 1.55;
      ctx.strokeStyle = getLineRgba(Math.min(0.62, alpha));

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Grid-pruned connections pass
    for (let gz = 0; gz < gridDimZ; gz++) {
      for (let gy = 0; gy < gridDimY; gy++) {
        for (let gx = 0; gx < gridDimX; gx++) {
          const c = gx + gy * gridDimX + gz * gridDimX * gridDimY;
          const firstNode = gridHead[c];
          if (firstNode === -1) continue;

          for (let i = firstNode; i !== -1; i = gridNext[i]) {
            for (let j = gridNext[i]; j !== -1; j = gridNext[j]) {
              drawConnection(i, j);
            }

            const baseOffset = c * 13;
            for (let o = 0; o < 13; o++) {
              const nc = cellNeighbors[baseOffset + o];
              for (let j = gridHead[nc]; j !== -1; j = gridNext[j]) {
                drawConnection(i, j);
              }
            }
          }
        }
      }
    }

    // Nodes pass
    const isOcean = currentThemeId === 'ocean';

    for (let oi = 0; oi < order.length; oi++) {
      const i = order[oi];
      const n = nodes[i];
      if (!n.visible) continue;
      const p = n.proj;

      const cursorBoost = n.proximity * n.proximity;

      let bioPulse = 0;
      if (isOcean) {
        bioPulse = Math.sin(now * 0.0022 * n.freq + n.phase) * 0.25 + 0.25; // 0 to 0.5
      }

      const r = Math.max(0.45, (n.r + cursorBoost * 0.65 + (isOcean ? bioPulse * 0.25 : 0)) * p.scale * 1.72);
      const alpha = Math.min(0.85, (n.vis + (isOcean ? bioPulse * 0.08 : 0)) * p.scale * 2.05 * n.reveal);

      if (alpha < 0.003) continue;

      if (cursorBoost > 0.22) {
        ctx.beginPath();
        ctx.fillStyle = getNodeRgba(Math.min(0.10, cursorBoost * 0.075));
        ctx.arc(p.x, p.y, r * (2.1 + cursorBoost * 1.3), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.fillStyle = getNodeRgba(alpha);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(now) {
    if (!running) return;

    const dt = Math.min(40, Math.max(1, now - lastFrame));
    lastFrame = now;

    const autoYaw = prefersReducedMotion ? 0 : now * CFG.autoYawSpeed;
    const autoPitch = prefersReducedMotion ? 0 : Math.sin(now * 0.000115) * CFG.autoPitchAmp;
    const autoRoll = prefersReducedMotion ? 0 : Math.sin(now * 0.00015) * CFG.autoRollAmp;

    update(now, dt, autoYaw, autoPitch, autoRoll);
    draw(now, dt, autoYaw, autoPitch, autoRoll);

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    resize();
  });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) {
      lastFrame = performance.now();
      requestAnimationFrame(tick);
    }
  });

  resize();
  requestAnimationFrame(tick);
}
