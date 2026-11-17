// Moteur de la course du niveau 1 : route pseudo-3D, kart, couloirs, boost et carapaces.
// Tout tourne dans une boucle requestAnimationFrame, hors du state React : le composant <Race>
// ne reçoit que des événements (compte à rebours, question, couloir, verdict, arrivée) ; la vitesse et
// le chrono passent par onTick, que l'interface écrit directement dans le DOM.

// ---------- Circuit et physique ----------
export const SEG = 200;
export const LOCK = 40, ITEM_AT = 32, VERDICT_S = 2.5, COUNTDOWN_S = 3.5;
export const SPIN = 1.1, BOOST = 1.0, TURBO_MAX = 5, TURBO_STEP = 0.07;
const ROAD_W = 650, CAM_H = 1000, FOV = 100, DRAW = 160, NEAR = 20, TURN_K = 0.02;
const CAM_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
export const PLAYER_Z = CAM_H * CAM_DEPTH;
const LANE_X = [-2 / 3, 0, 2 / 3];
const PAD_SEGS = 4;

// Niveau 1 (Prairie) : 6 blocs à égale distance, chaque bloc enchaîne ses virages puis une zone droite
// verrouillée ; les angles ferment le circuit en un tour.
export const LEVEL1 = {
  speed: 3600, curve: 40, approach: 70, fill: 0,
  arcs: [[[1.0, 62.54]], [[0.568, 42.68], [0.5, -40.71]], [[1.0, 128.65]], [[1.0, 39.52]], [[0.5, -32.26], [0.5, 66.62]], [[1.0, 92.96]]],
};

export function targetSpeed(cfg, combo, boosting, spinning) {
  if (spinning) return cfg.speed * 0.3;
  return cfg.speed * (1 + TURBO_STEP * Math.min(combo, TURBO_MAX)) * (boosting ? 1.35 : 1);
}
export function accelerate(sp, target, dt) {
  const acc = sp < target ? 2600 : 5600;
  return sp + Math.sign(target - sp) * Math.min(Math.abs(target - sp), acc * dt);
}

const ease = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);

// Tronçons du circuit et position des barrières. Ne dépend que de la configuration du niveau.
export function buildTrack(cfg, count = 6) {
  const segments = [];
  const add = (curve) => {
    const i = segments.length;
    segments.push({ index: i, curve, sprites: [], light: Math.floor(i / 3) % 2 === 0, lock: null, boost: null, gantry: null, checker: 0 });
  };
  const road = (n, curve = 0) => { for (let k = 0; k < n; k++) add(curve); };
  const arc = (n, deg) => {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += Math.sin(Math.PI * (k + 0.5) / n);
    const amp = deg * Math.PI / 180 / (TURN_K * sum);
    for (let k = 0; k < n; k++) add(amp * Math.sin(Math.PI * (k + 0.5) / n));
  };
  road(30);
  segments[12].checker = 1; segments[13].checker = 2;
  const gates = [];
  for (let i = 0; i < count; i++) {
    const g = { blockStart: segments.length };
    const arcs = cfg.arcs[i], R = cfg.curve + cfg.approach + cfg.fill;
    let used = 0;
    arcs.forEach(([frac, deg], j) => {
      const n = j === arcs.length - 1 ? R - used : Math.round(R * frac);
      used += n; arc(n, deg);
    });
    g.lockStart = segments.length;
    g.itemSeg = g.lockStart + ITEM_AT;
    road(LOCK + (LOCK - ITEM_AT) + Math.round(cfg.speed * VERDICT_S / SEG));
    gates.push(g);
  }
  const finish = segments.length + 8;
  road(8);
  for (let k = 0; k < DRAW + 32; k++) add(segments[12 + k].curve);   // le tour suivant reste visible après l'arrivée
  segments[finish].checker = 1; segments[finish + 1].checker = 2;
  return { segments, gates, finish, trackEnd: finish * SEG };
}

// Temps de course (en ms, compte à rebours exclu) quand toutes les réponses sont justes ou fausses.
export function simulate(cfg, allRight) {
  const { gates, trackEnd } = buildTrack(cfg);
  const dt = 1 / 120;
  let pos = 0, sp = 0, combo = 0, bT = 0, sT = 0, t = 0, qi = 0;
  while (pos + PLAYER_Z < trackEnd && t < 600) {
    const si = Math.floor((pos + PLAYER_Z) / SEG);
    if (qi < gates.length && si >= gates[qi].itemSeg) {
      if (allRight) { combo++; bT = BOOST; } else { combo = 0; sT = SPIN; }
      qi++;
    }
    if (bT > 0) bT -= dt;
    if (sT > 0) sT -= dt;
    sp = accelerate(sp, targetSpeed(cfg, combo, bT > 0, sT > 0), dt);
    pos += sp * dt; t += dt;
  }
  return Math.round(t * 1000);
}

// ---------- Rendu ----------
export const W = 426, H = 240;
const XS = 213, VS = 148, HZ = 92, GY = HZ + VS;
const C = {
  grassL: '#62c53c', grassD: '#53b230', roadL: '#72727f', roadD: '#6a6a78',
  rumbleL: '#ffffff', rumbleD: '#e3262b', lane: '#f4f4f4', barA: '#ffd23f', barB: '#1b1b1b',
};
const KART = { fw: 50, fh: 51, ox: 6, oy: 14, bw: 38, bh: 34, n: 25 };
const FLOOR_PX = 48, FLOOR_EDGE = 38, GRID = 400, GRID_PAD = 30000;
const RUMBLE_OUT = ROAD_W * (1 + 1 / 7);

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const pack = (c) => ((255 << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0;
const PAL = {
  grassL: rgb(C.grassL), grassD: rgb(C.grassD), rumbleL: rgb(C.rumbleL), rumbleD: rgb(C.rumbleD),
  roadL: rgb(C.roadL), roadD: rgb(C.roadD), lane: rgb(C.lane), barA: rgb(C.barA), barB: rgb(C.barB),
  white: rgb('#ffffff'), black: rgb('#111111'), padY: rgb('#f8f050'), padR: rgb('#b81010'),
};
const PK = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, pack(v)]));
const padRed = (y, x) => { const dx = Math.abs(x - 7.5); return y < 8 ? dx < y + 1 : !(dx < y - 8); };

function readPixels(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  return new Uint32Array(g.getImageData(0, 0, img.width, img.height).data.buffer);
}
function average(px, w, h, x0, x1) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) { const v = px[y * w + x]; r += v & 255; g += (v >> 8) & 255; b += (v >> 16) & 255; n++; }
  return pack([r / n, g / n, b / n]);
}

// Position, cap et repère de chaque tronçon sur le terrain (même calcul que celui qui ferme le circuit).
function placeSegments(segments) {
  let h = 0, x = 0, z = 0, prev = 0;
  for (const seg of segments) {
    h += seg.curve * TURN_K;
    seg.x = x; seg.z = z; seg.h = h; seg.hp = (prev + h) / 2; prev = h;
    seg.sh = Math.sin(h); seg.ch = Math.cos(h);
    seg.shp = Math.sin(seg.hp); seg.chp = Math.cos(seg.hp);
    x += SEG * seg.sh; z += SEG * seg.ch;
  }
  segments.end = { x, z, hp: prev };
}

// Grille du sol : pour chaque case de 400 unités, le tronçon le plus proche.
function buildGround(segments, trackEnd) {
  const first = 12, last = Math.min(segments.length - 1, Math.round(trackEnd / SEG) - 1);
  const n = segments.length, mx = new Float64Array(n), mz = new Float64Array(n);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = first; i <= last; i++) {
    const sg = segments[i];
    mx[i] = sg.x + sg.sh * SEG / 2; mz[i] = sg.z + sg.ch * SEG / 2;
    minX = Math.min(minX, mx[i]); maxX = Math.max(maxX, mx[i]); minZ = Math.min(minZ, mz[i]); maxZ = Math.max(maxZ, mz[i]);
  }
  const x0 = minX - GRID_PAD, z0 = minZ - GRID_PAD;
  const cols = Math.ceil((maxX - minX + 2 * GRID_PAD) / GRID) + 1, rows = Math.ceil((maxZ - minZ + 2 * GRID_PAD) / GRID) + 1;
  const idx = new Int32Array(cols * rows).fill(-1), dist = new Float64Array(cols * rows).fill(Infinity);
  const relax = (k, c, r, i) => {
    if (i < 0) return;
    const d = Math.hypot(x0 + (c + 0.5) * GRID - mx[i], z0 + (r + 0.5) * GRID - mz[i]);
    if (d < dist[k]) { dist[k] = d; idx[k] = i; }
  };
  for (let i = first; i <= last; i++) {
    const c = Math.floor((mx[i] - x0) / GRID), r = Math.floor((mz[i] - z0) / GRID);
    relax(r * cols + c, c, r, i);
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      if (c > 0) relax(k, c, r, idx[k - 1]);
      if (r > 0) {
        relax(k, c, r, idx[k - cols]);
        if (c > 0) relax(k, c, r, idx[k - cols - 1]);
        if (c < cols - 1) relax(k, c, r, idx[k - cols + 1]);
      }
    }
    for (let r = rows - 1; r >= 0; r--) for (let c = cols - 1; c >= 0; c--) {
      const k = r * cols + c;
      if (c < cols - 1) relax(k, c, r, idx[k + 1]);
      if (r < rows - 1) {
        relax(k, c, r, idx[k + cols]);
        if (c < cols - 1) relax(k, c, r, idx[k + cols + 1]);
        if (c > 0) relax(k, c, r, idx[k + cols - 1]);
      }
    }
  }
  return { x0, z0, cols, rows, idx, first, last };
}

/**
 * Lance la course dans le canvas.
 * lanes : les trois codes de chaque barrière. Les callbacks préviennent React ; verdict() lui
 * permet de répondre quand le back a corrigé la barrière.
 */
export function createRace(canvas, sprites, { lanes, onCount, onTick, onLane, onQuestion, onLock, onResolve, onFinish }) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const cfg = LEVEL1;
  const { segments, gates, trackEnd } = buildTrack(cfg, lanes.length);
  placeSegments(segments);
  const ground = buildGround(segments, trackEnd);
  const questions = gates.map((g, i) => ({ ...g, opts: lanes[i], lane: 1, shown: false, locked: false, done: false, revealed: false, verdict: null }));
  questions.forEach((q) => {
    for (let n = q.lockStart; n < q.lockStart + LOCK; n++) segments[n].lock = q;
    segments[q.lockStart].gantry = q;
  });
  for (let i = 8; i < segments.length; i += 5 + Math.floor(Math.random() * 6)) {
    const side = Math.random() < 0.5 ? -1 : 1;
    segments[i].sprites.push({ bush: true, offset: side * (8.2 + Math.random() * 2.4), worldW: 380 + Math.random() * 260 });
  }

  // Sol lu dans les images : coupe du bord de route puis carreau d'herbe.
  const fl = (() => {
    const p = readPixels(sprites.solRoute), g = readPixels(sprites.solHerbe);
    const pw = sprites.solRoute.width, ph = sprites.solRoute.height, gw = sprites.solHerbe.width, gh = sprites.solHerbe.height;
    return { p, pw, ph, g, gw, gh, pAvg: Array.from({ length: pw }, (_, x) => average(p, pw, ph, x, x + 1)), gAvg: average(g, gw, gh, 0, gw) };
  })();

  let state = 'countdown', countT = COUNTDOWN_S, qIndex = 0, combo = 0, verdictAt = 0, levelTime = 0;
  let position = 0, speed = 0, lane = 1, playerX = 0, steer = 0, boostT = 0, spinT = 0, shake = 0, clock = 0;
  let skyH = 0, skyLastH = null, raf = 0, last = performance.now();
  const cam = { x: 0, z: 0, h: 0, cos: 1, sin: 0, d: PLAYER_Z };
  const groundImg = ctx.createImageData(W, H), groundData = new Uint32Array(groundImg.data.buffer);

  const segAt = (z) => segments[Math.max(0, Math.min(segments.length - 1, Math.floor(z / SEG)))];
  const nextOf = (seg) => segments[seg.index + 1] || segments.end;
  function pathAt(d) {
    const i = Math.max(0, Math.min(segments.length - 1, Math.floor(d / SEG)));
    const a = segments[i], b = nextOf(a), f = d / SEG - i;
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, h: a.h };
  }
  function placeCamera() {
    const off = playerX * ROAD_W, c = pathAt(position), k = pathAt(position + PLAYER_Z);
    cam.x = c.x + off * Math.cos(c.h); cam.z = c.z - off * Math.sin(c.h);
    const kx = k.x + off * Math.cos(k.h), kz = k.z - off * Math.sin(k.h);
    cam.h = Math.atan2(kx - cam.x, kz - cam.z); cam.cos = Math.cos(cam.h); cam.sin = Math.sin(cam.h);
    cam.d = Math.hypot(kx - cam.x, kz - cam.z);
  }
  function toCam(wx, wz) {
    const dx = wx - cam.x, dz = wz - cam.z;
    return { x: dx * cam.cos - dz * cam.sin, z: dx * cam.sin + dz * cam.cos };
  }
  function prepSeg(seg) {
    const b = nextOf(seg);
    seg.cA = toCam(seg.x, seg.z); seg.cB = toCam(b.x, b.z);
    seg.rA = { x: Math.cos(seg.hp - cam.h), z: Math.sin(cam.h - seg.hp) };
    seg.rB = { x: Math.cos(b.hp - cam.h), z: Math.sin(cam.h - b.hp) };
  }
  function roadPt(seg, f, u) {
    const l = (2 * u - 1) * ROAD_W;
    return {
      x: seg.cA.x + (seg.cB.x - seg.cA.x) * f + l * (seg.rA.x + (seg.rB.x - seg.rA.x) * f),
      z: seg.cA.z + (seg.cB.z - seg.cA.z) * f + l * (seg.rA.z + (seg.rB.z - seg.rA.z) * f),
    };
  }
  const screenOf = (p) => { const s = CAM_DEPTH / p.z; return [Math.round(W / 2 + s * p.x * XS), Math.round(HZ + s * CAM_H * VS)]; };

  function floorAt(sg, f, a, row) {
    const k = 1 / FLOOR_PX, ty = ((sg.index + f) * SEG * k) | 0;
    const tx = a < ROAD_W ? Math.min(FLOOR_EDGE - 1, (a * k) | 0) : FLOOR_EDGE + Math.floor((a - ROAD_W) * k);
    if (tx < fl.pw) return row.far ? fl.pAvg[tx] : fl.p[(ty % fl.ph) * fl.pw + tx];
    return row.far ? fl.gAvg : fl.g[(ty % fl.gh) * fl.gw + (tx - fl.pw) % fl.gw];
  }
  function groundColor(sg, f, d, row, lh) {
    const a = d < 0 ? -d : d;
    if (a >= ROAD_W) return floorAt(sg, f, a, row);
    const u = (d / ROAD_W + 1) / 2;
    if (sg.checker) return (Math.floor(u * 10) + sg.checker) % 2 ? PK.white : PK.black;
    for (let k = 1; k <= 2; k++) {
      const du = Math.abs(u - k / 3);
      if (sg.lock) { if (du < Math.max(0.022, lh)) return Math.floor(sg.index / 2) % 2 ? PK.barA : PK.barB; }
      else if (sg.light && du < lh) return PK.lane;
    }
    if (sg.boost && sg.boost.q.revealed) {
      const u0 = sg.boost.lane / 3;
      if (u >= u0 && u < u0 + 1 / 3) {
        const tx = Math.floor((u - u0) * 96) % 16;
        const ty = (sg.boost.part % 2 === 0 ? 8 : 0) + Math.min(7, Math.max(0, Math.floor((1 - f) * 8)));
        return padRed(ty, tx) ? PK.padR : PK.padY;
      }
    }
    return floorAt(sg, f, a, row);
  }
  function drawGround() {
    const g = ground, K = CAM_DEPTH * CAM_H * VS, ch = cam.cos, sh = cam.sin, half = W / 2;
    const mid = (a, b) => mixRgb(PAL[a], PAL[b], 0.5);
    const M = { grass: mid('grassL', 'grassD'), rumble: mid('rumbleL', 'rumbleD'), road: mid('roadL', 'roadD') };
    for (let y = HZ + 1; y < H; y++) {
      const z = K / (y + 0.5 - HZ), perX = z / (CAM_DEPTH * XS);
      const t = Math.min(1, Math.max(0, (z * z / K - 500) / 700));
      const row = t === 0 ? PK : {
        grassL: pack(mixRgb(PAL.grassL, M.grass, t)), grassD: pack(mixRgb(PAL.grassD, M.grass, t)),
        rumbleL: pack(mixRgb(PAL.rumbleL, M.rumble, t)), rumbleD: pack(mixRgb(PAL.rumbleD, M.rumble, t)),
        roadL: pack(mixRgb(PAL.roadL, M.road, t)), roadD: pack(mixRgb(PAL.roadD, M.road, t)), far: t > 0.5,
      };
      const lh = Math.max(0.006, perX * 0.5 / (2 * ROAD_W));
      const bx = cam.x + z * sh, bz = cam.z + z * ch;
      let o = y * W;
      for (let x = 0; x < W; x++, o++) {
        const lx = (x + 0.5 - half) * perX, wx = bx + lx * ch, wz = bz - lx * sh;
        const c = Math.floor((wx - g.x0) / GRID), r = Math.floor((wz - g.z0) / GRID);
        let col = PK.grassD;
        const k0 = c >= 0 && r >= 0 && c < g.cols && r < g.rows ? g.idx[r * g.cols + c] : -1;
        if (k0 >= 0) {
          let best = Infinity, bj = -1, bf = 0, bl = 0;
          const j0 = Math.max(g.first, k0 - 4), j1 = Math.min(g.last, k0 + 4);
          for (let j = j0; j <= j1; j++) {
            const A = segments[j], B = segments[j + 1];
            const dA = (wx - A.x) * A.shp + (wz - A.z) * A.chp;
            if (dA < 0) continue;
            const dB = (wx - B.x) * B.shp + (wz - B.z) * B.chp;
            if (dB >= 0) continue;
            const f = dA / (dA - dB);
            const nx = A.chp + (B.chp - A.chp) * f, nz = -(A.shp + (B.shp - A.shp) * f);
            const l = ((wx - A.x - (B.x - A.x) * f) * nx + (wz - A.z - (B.z - A.z) * f) * nz) / Math.hypot(nx, nz);
            const al = l < 0 ? -l : l;
            if (al < best) { best = al; bj = j; bf = f; bl = l; }
          }
          if (bj < 0) {
            best = Infinity;
            for (let j = j0; j <= j1; j++) {
              const sg = segments[j], dx = wx - sg.x, dz = wz - sg.z;
              const a = dx * sg.sh + dz * sg.ch, l = dx * sg.ch - dz * sg.sh;
              const out = a < 0 ? -a : a > SEG ? a - SEG : 0, d = out * out + l * l;
              if (d < best) { best = d; bj = j; bf = Math.min(1, Math.max(0, a / SEG)); bl = l; }
            }
          }
          col = groundColor(segments[bj], bf, bl, row, lh);
        }
        groundData[o] = col;
      }
    }
    ctx.putImageData(groundImg, 0, 0, 0, HZ + 1, W, H - HZ - 1);
  }

  function drawLayer(img, offset, y, stretchTop) {
    const w = img.width, ox = Math.round(((offset % w) + w) % w);
    for (let x = -ox; x < W; x += w) {
      ctx.drawImage(img, x, y);
      if (stretchTop && y > 0) ctx.drawImage(img, 0, 0, w, 1, x, 0, w, y);
    }
  }
  function drawBackground(turns) {
    const base = HZ + 1 + Math.max(0, 100 - (HZ + 1));
    ctx.fillStyle = C.grassD; ctx.fillRect(0, HZ, W, H - HZ);
    drawLayer(sprites.ciel, turns * sprites.ciel.width, base - sprites.ciel.height, true);
    drawLayer(sprites.decor, turns * sprites.decor.width, base - sprites.decor.height);
    drawLayer(sprites.proche, turns * sprites.proche.width, base - sprites.proche.height);
  }
  function drawGantry(seg) {
    const c = seg.cA, s = CAM_DEPTH / c.z, [px, py] = screenOf(c), q = seg.gantry;
    const w = s * ROAD_W * XS, yTop = py - s * 1250 * VS, yBot = py - s * 860 * VS;
    const half = w * 1.06, post = Math.max(1, Math.round(w * 0.035));
    ctx.fillStyle = '#2b3150';
    ctx.fillRect(px - half - post, yTop, post, py - yTop);
    ctx.fillRect(px + half, yTop, post, py - yTop);
    const boxW = (half * 2) / 3, bh = yBot - yTop;
    for (let i = 0; i < 3; i++) {
      const bx = px - half + i * boxW;
      ctx.fillStyle = q.done ? (i === q.verdict?.correctLane ? '#1fae5b' : '#7a2222') : '#1f5fd6';
      ctx.fillRect(Math.round(bx + 1), Math.round(yTop), Math.round(boxW - 2), Math.round(bh));
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, bh * 0.06);
      ctx.strokeRect(Math.round(bx + 1), Math.round(yTop), Math.round(boxW - 2), Math.round(bh));
      const size = Math.floor(bh * 0.42);
      if (size >= 5) {
        ctx.fillStyle = '#ffffff'; ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(q.opts[i], Math.round(bx + boxW / 2), Math.round(yTop + bh / 2 + 1));
      }
    }
  }
  function drawSprite(sp, pt) {
    const img = sp.item ? sprites.carapace : sprites.buisson;
    const s = CAM_DEPTH / pt.z, dw = sp.worldW * s * XS, dh = dw * img.height / img.width;
    if (dw < 1) return;
    const [sx, sy] = screenOf(pt);
    ctx.drawImage(img, Math.round(sx - dw / 2), Math.round(sy - dh), Math.round(dw), Math.round(dh));
  }
  function drawPlayer() {
    const dw = Math.round(KART.bw * 1.7), dh = Math.round(KART.bh * 1.7);
    const bob = speed > 200 ? Math.round(Math.sin(clock * 38) * 0.6 + 0.4) : 0;
    const cx = W / 2, cy = GY - 6 - dh / 2 - bob;
    let frame = 0, flip = false;
    if (spinT > 0) {
      const a = ((1 - spinT / SPIN) * 720) % 360;
      if (a <= 180) frame = Math.round(a / 180 * (KART.n - 1));
      else { frame = Math.round((360 - a) / 180 * (KART.n - 1)); flip = true; }
    } else if (Math.abs(steer) > 0.04) { frame = 1; flip = steer > 0; }
    ctx.save();
    ctx.translate(cx, cy);
    if (flip) ctx.scale(-1, 1);
    const sx = dw / KART.bw, sy = dh / KART.bh;
    ctx.drawImage(sprites.kart, frame * KART.fw, 0, KART.fw, KART.fh, -dw / 2 - KART.ox * sx, -dh / 2 - KART.oy * sy, KART.fw * sx, KART.fh * sy);
    ctx.restore();
    if (boostT > 0 && spinT <= 0) {
      const s = dh / KART.bh, top = cy - dh / 2;
      for (const x of [12.5, 24.5].map((v) => cx + (v - KART.bw / 2) * s)) {
        ctx.fillStyle = '#ff7a1a'; ctx.fillRect(Math.round(x - s), Math.round(top + 30 * s), Math.max(2, Math.round(2 * s)), Math.round(4 + Math.random() * 6));
        ctx.fillStyle = '#ffe14d'; ctx.fillRect(Math.round(x - s / 2), Math.round(top + 30 * s), Math.max(1, Math.round(s)), Math.round(2 + Math.random() * 4));
      }
    }
  }
  function render() {
    placeCamera();
    const turn = skyLastH === null ? 0 : cam.h - skyLastH;
    skyH += Math.atan2(Math.sin(turn), Math.cos(turn)); skyLastH = cam.h;
    ctx.save();
    if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 8 * shake), Math.round((Math.random() - 0.5) * 6 * shake));
    drawBackground(skyH / (2 * Math.PI));
    drawGround();
    const base = segAt(position), items = [];
    for (let n = 0; n < DRAW; n++) {
      const seg = segments[base.index + n];
      if (!seg) break;
      prepSeg(seg);
      if (seg.gantry && seg.cA.z > NEAR) items.push({ z: seg.cA.z, draw: () => drawGantry(seg) });
      for (const sp of seg.sprites) {
        if (sp.item && sp.gone) continue;
        const pt = roadPt(seg, 0, (sp.offset + 1) / 2);
        if (pt.z > NEAR) items.push({ z: pt.z, draw: () => drawSprite(sp, pt) });
      }
    }
    items.sort((a, b) => b.z - a.z).forEach((it) => it.draw());
    drawPlayer();
    ctx.restore();
  }

  // Le back a corrigé la barrière : plaque d'accélération dans le bon couloir, carapaces ailleurs.
  function verdict(i, correctLane) {
    const q = questions[i];
    if (!q || q.verdict) return;
    q.verdict = { correctLane };
    q.revealed = true;
    for (let l = 0; l < 3; l++) {
      if (l === correctLane) for (let n = 0; n < PAD_SEGS; n++) segments[q.itemSeg - 1 + n].boost = { q, lane: l, part: n };
      else segments[q.itemSeg].sprites.push({ item: true, offset: LANE_X[l], worldW: 230, lane: l });
    }
  }

  function resolve(q, i) {
    q.done = true; verdictAt = levelTime;
    const ok = q.lane === q.verdict.correctLane;
    const lost = ok ? 0 : Math.min(combo, TURBO_MAX);   // crans de turbo perdus
    if (ok) { combo++; boostT = BOOST; }
    else {
      combo = 0; spinT = SPIN; shake = 0.6;
      const shell = segments[q.itemSeg].sprites.find((sp) => sp.item && sp.lane === q.lane);
      if (shell) shell.gone = true;
    }
    qIndex++;
    onResolve?.(i, ok, combo, lost);
  }

  function update(dt) {
    clock += dt;
    shake = Math.max(0, shake - dt * 1.6);
    if (state === 'countdown') {
      const before = Math.ceil(countT - 0.5);
      countT -= dt;
      const now = Math.ceil(countT - 0.5);
      if (now !== before) onCount?.(now > 0 ? String(now) : 'GO !');
      if (countT <= 0) { state = 'race'; onCount?.(null); }
      return;
    }
    if (state === 'finish') {
      // Après la ligne, le kart freine jusqu'à l'arrêt.
      speed = Math.max(0, speed - dt * Math.max(1500, speed * 1.4));
      position += speed * dt;
      playerX += (LANE_X[lane] - playerX) * Math.min(1, dt * 10);
      steer = 0; boostT = 0; spinT = 0;
      onTick?.(Math.round(speed / 30), levelTime);
      return;
    }
    if (state !== 'race') return;
    const pseg = segAt(position + PLAYER_Z);
    const q = questions[qIndex];
    if (q) {
      const due = qIndex === 0 ? pseg.index >= q.blockStart : levelTime - verdictAt >= VERDICT_S;
      if (!q.shown && (due || pseg.index >= q.lockStart)) { q.shown = true; onQuestion?.(qIndex); }
      if (!q.locked && pseg.index >= q.lockStart) { q.locked = true; q.lane = lane; onLock?.(qIndex, lane); }
      // Si le verdict du back n'est pas encore là, l'objet attend : rien ne se passe avant.
      if (!q.done && q.verdict && pseg.index >= q.itemSeg) resolve(q, qIndex);
    }
    playerX += (LANE_X[lane] - playerX) * Math.min(1, dt * 10);
    steer = LANE_X[lane] - playerX;
    if (boostT > 0) boostT -= dt;
    if (spinT > 0) spinT -= dt;
    speed = accelerate(speed, targetSpeed(cfg, combo, boostT > 0, spinT > 0), dt);
    position += speed * dt;
    levelTime += dt;
    onTick?.(Math.round(speed / 30), levelTime);
    if (position + PLAYER_Z >= trackEnd) { state = 'finish'; onFinish?.(Math.round(levelTime * 1000)); }
  }

  function move(d) {
    if (state !== 'race') return;
    const q = questions[qIndex];
    if (q && q.locked && !q.done) { shake = Math.max(shake, 0.15); return; }
    const next = Math.max(0, Math.min(2, lane + d));
    if (next !== lane) { lane = next; onLane?.(lane); }
  }
  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'q' || k === 'a') { move(-1); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { move(1); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  }
  onCount?.(String(Math.ceil(COUNTDOWN_S - 0.5)));
  raf = requestAnimationFrame(frame);

  return {
    verdict,
    move,
    destroy() { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); },
  };
}
