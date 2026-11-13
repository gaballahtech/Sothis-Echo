/**
 * Procedural scene renderer.
 *
 * The SAME geometry is drawn twice: once as a cloud-obscured optical view and
 * once as an L-band-like radar view. Brightness follows basic SAR behaviour:
 *   smooth open water → dark (specular)
 *   rough canopy / bare soil → mid
 *   trunk standing in water → bright (double bounce)
 *   burn scar → dark + smooth, isolated charred trunks bright
 *
 * These are illustrations, not measurements. Every canvas is labelled in the UI.
 */

const W = 760;
const H = 500;

/* ---------- deterministic RNG ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v) => Math.max(0, Math.min(255, v));
const px = (v) => v * W;
const py = (v) => v * H;

function tracePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(px(points[0][0]), py(points[0][1]));
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = ((points[i][0] + points[i + 1][0]) / 2) * W;
    const midY = ((points[i][1] + points[i + 1][1]) / 2) * H;
    ctx.quadraticCurveTo(px(points[i][0]), py(points[i][1]), midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(px(last[0]), py(last[1]));
}

/* ---------- wetland geometry ---------- */
const CHANNELS = [
  [[0.02, 0.16], [0.22, 0.28], [0.38, 0.43], [0.51, 0.6], [0.68, 0.76], [0.92, 0.9]],
  [[-0.04, 0.52], [0.16, 0.49], [0.34, 0.57], [0.52, 0.7], [0.76, 0.77], [1.04, 0.68]],
  [[0.32, -0.04], [0.35, 0.16], [0.32, 0.35], [0.42, 0.48], [0.5, 0.6], [0.55, 0.78]],
  [[0.68, -0.04], [0.61, 0.17], [0.67, 0.36], [0.73, 0.51], [0.87, 0.61], [1.02, 0.57]],
  [[0.08, 0.86], [0.24, 0.78], [0.4, 0.83], [0.58, 0.93], [0.78, 0.96]],
];

const PONDS = [
  [0.14, 0.66, 0.11, 0.06],
  [0.46, 0.28, 0.09, 0.05],
  [0.76, 0.83, 0.13, 0.07],
  [0.6, 0.13, 0.07, 0.04],
  [0.24, 0.4, 0.06, 0.035],
  [0.86, 0.34, 0.08, 0.045],
];

// One deliberate embankment with settlements — reads as infrastructure, not a scratch.
const DIKES = [
  [[-0.02, 0.72], [0.22, 0.66], [0.48, 0.74], [0.74, 0.7], [1.02, 0.8]],
];

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq ? ((x - x1) * dx + (y - y1) * dy) / lengthSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(x - cx, y - cy);
}

function wetlandWaterDepth(x, y, water) {
  let depth = 0;
  const widths = CHANNELS.map((_, i) => (0.009 + i * 0.0015) * (0.6 + water * 2.6));
  CHANNELS.forEach((path, i) => {
    for (let s = 0; s < path.length - 1; s += 1) {
      const d = distanceToSegment(x, y, path[s][0], path[s][1], path[s + 1][0], path[s + 1][1]);
      const w = widths[i];
      if (d < w) depth = Math.max(depth, 1 - d / w);
    }
  });
  PONDS.forEach(([cx, cy, rx, ry], i) => {
    const grow = 0.55 + water * 1.9;
    const nx = (x - cx) / (rx * grow);
    const ny = (y - cy) / (ry * grow);
    const d = Math.hypot(nx, ny);
    if (d < 1) depth = Math.max(depth, (1 - d) * (0.65 + (i % 3) * 0.12));
  });
  if (water > 0.62) {
    const sheet = (water - 0.62) * 2.2;
    const d = Math.hypot((x - 0.52) / 0.55, (y - 0.5) / 0.4);
    if (d < sheet) depth = Math.max(depth, Math.min(1, (sheet - d) * 2.4));
  }
  return depth;
}

/* ---------- wetland paints ---------- */
function paintWetlandOptical(ctx, site, params, rng) {
  const { water, emergent } = params;
  const land = ctx.createLinearGradient(0, 0, 0, H);
  land.addColorStop(0, '#7c7f4e');
  land.addColorStop(0.55, '#8d8759');
  land.addColorStop(1, '#6f6c46');
  ctx.fillStyle = land;
  ctx.fillRect(0, 0, W, H);

  // mud / sediment patches
  for (let i = 0; i < 26; i += 1) {
    ctx.beginPath();
    ctx.ellipse(px(rng()), py(rng()), 20 + rng() * 90, 8 + rng() * 26, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${150 + rng() * 30}, ${132 + rng() * 24}, ${92 + rng() * 18}, ${0.05 + rng() * 0.12})`;
    ctx.fill();
  }

  // tidal water — brown-green, turbid
  const waterColor = '#2f4f49';
  PONDS.forEach(([cx, cy, rx, ry]) => {
    const grow = 0.55 + water * 1.9;
    ctx.beginPath();
    ctx.ellipse(px(cx), py(cy), px(rx * grow), py(ry * grow), 0.1, 0, Math.PI * 2);
    ctx.fillStyle = waterColor;
    ctx.fill();
  });
  const widths = CHANNELS.map((_, i) => (0.009 + i * 0.0015) * (0.6 + water * 2.6));
  CHANNELS.forEach((path, i) => {
    tracePath(ctx, path);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = waterColor;
    ctx.lineWidth = widths[i] * W;
    ctx.stroke();
    tracePath(ctx, path);
    ctx.strokeStyle = 'rgba(198, 198, 168, 0.35)';
    ctx.lineWidth = Math.max(1.2, widths[i] * W * 0.1);
    ctx.stroke();
  });

  // mangrove canopy — dark green clusters, thinner where flooded
  for (let i = 0; i < 780; i += 1) {
    const x = rng();
    const y = rng();
    const depth = wetlandWaterDepth(x, y, water);
    const size = 2.4 + rng() * 9;
    if (depth > 0.55) {
      if (rng() > emergent * 0.5) continue;
      ctx.fillStyle = `rgba(${26 + rng() * 14}, ${52 + rng() * 22}, ${30 + rng() * 14}, 0.9)`;
    } else {
      ctx.fillStyle = `rgba(${34 + rng() * 26}, ${64 + rng() * 34}, ${32 + rng() * 20}, ${0.55 + rng() * 0.45})`;
    }
    ctx.beginPath();
    ctx.ellipse(px(x), py(y), size * 0.8, size, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // dikes and small settlements
  DIKES.forEach((path) => {
    tracePath(ctx, path);
    ctx.strokeStyle = 'rgba(196, 188, 156, 0.85)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(92, 84, 62, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
  for (let i = 0; i < 16; i += 1) {
    const x = 0.1 + rng() * 0.8;
    const y = 0.68 + Math.sin(x * 5.3) * 0.06 + rng() * 0.05;
    ctx.fillStyle = 'rgba(168, 150, 116, 0.9)';
    ctx.fillRect(px(x), py(y), 3 + rng() * 4, 2.5 + rng() * 3);
  }

  // haze
  ctx.fillStyle = 'rgba(222, 226, 208, 0.11)';
  ctx.fillRect(0, 0, W, H);
}

function paintWetlandRadar(ctx, site, params, rng) {
  const { water, emergent } = params;

  ctx.fillStyle = '#6a716a';
  ctx.fillRect(0, 0, W, H);

  // speckled land texture
  for (let i = 0; i < 1200; i += 1) {
    const value = 80 + rng() * 65;
    ctx.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.12 + rng() * 0.2})`;
    const s = 1 + rng() * 5;
    ctx.fillRect(px(rng()), py(rng()), s, s);
  }

  // dark, smooth water bodies
  PONDS.forEach(([cx, cy, rx, ry]) => {
    const grow = 0.55 + water * 1.9;
    ctx.beginPath();
    ctx.ellipse(px(cx), py(cy), px(rx * grow), py(ry * grow), 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2320';
    ctx.fill();
  });
  const widths = CHANNELS.map((_, i) => (0.009 + i * 0.0015) * (0.6 + water * 2.6));
  CHANNELS.forEach((path, i) => {
    // bright bank edge first
    tracePath(ctx, path);
    ctx.strokeStyle = 'rgba(196, 204, 188, 0.55)';
    ctx.lineWidth = widths[i] * W + 4;
    ctx.stroke();
    tracePath(ctx, path);
    ctx.strokeStyle = '#171d1a';
    ctx.lineWidth = widths[i] * W;
    ctx.stroke();
  });

  // vegetation: volume scattering mid-bright; flooded trunks bright (double bounce)
  for (let i = 0; i < 900; i += 1) {
    const x = rng();
    const y = rng();
    const depth = wetlandWaterDepth(x, y, water);
    const size = 1.8 + rng() * 7;
    if (depth > 0.5) {
      if (rng() > emergent * 0.62) continue;
      // dark shadow offset + bright trunk/crown = corner-reflector feel
      ctx.fillStyle = 'rgba(8, 12, 10, 0.6)';
      ctx.fillRect(px(x) + 2.5, py(y) + 1, 2.5, size * 2.2);
      const val = 180 + rng() * 60;
      ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.92)`;
      if (rng() > 0.45) {
        const trunk = 4 + rng() * 10;
        ctx.fillRect(px(x), py(y) - trunk * 0.5, 1.4 + rng() * 1.3, trunk);
        ctx.beginPath();
        ctx.ellipse(px(x), py(y) - trunk * 0.5, size * 0.7, size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(px(x), py(y), size * 0.7, size, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const val = 118 + rng() * 78;
      ctx.fillStyle = `rgba(${val}, ${val}, ${val}, ${0.55 + rng() * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(px(x), py(y), size * 0.7, size, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // embankments / settlements return strongly
  DIKES.forEach((path) => {
    tracePath(ctx, path);
    ctx.strokeStyle = 'rgba(220, 226, 214, 0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
  });
  for (let i = 0; i < 16; i += 1) {
    const x = 0.1 + rng() * 0.8;
    const y = 0.68 + Math.sin(x * 5.3) * 0.06 + rng() * 0.05;
    const val = 210 + rng() * 40;
    ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.95)`;
    ctx.fillRect(px(x), py(y), 4 + rng() * 5, 3 + rng() * 4);
  }
}

/* ---------- forest geometry ---------- */
function burnPolygon(kind, burn, rng) {
  // A healthy forest must not grow a phantom scar: ignore trace burn values.
  if (burn < 0.12) return [];
  const cx = 0.58;
  const cy = 0.47;
  const base = 0.08 + burn * 0.27;
  const points = [];
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2;
    const wobble = 0.74 + Math.sin(angle * 3.1 + kind.seed) * 0.13 + rng() * 0.16;
    const rx = base * wobble * 1.35;
    const ry = base * wobble * 0.9;
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return points;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function paintForestOptical(ctx, site, params, rng) {
  const { burn, emergent } = params;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8f9270');
  sky.addColorStop(0.45, '#7c8259');
  sky.addColorStop(1, '#5a6240');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // ridges
  for (let i = 0; i < 6; i += 1) {
    const yBase = 0.12 + i * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, py(yBase));
    for (let x = 0; x <= 1.001; x += 0.05) {
      const y = yBase + Math.sin(x * 5.4 + i * 1.7) * 0.028 + Math.sin(x * 13 + i) * 0.012;
      ctx.lineTo(px(x), py(y));
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(42, 67, 38, 0.34)' : 'rgba(108, 116, 74, 0.24)';
    ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= 1.001; x += 0.05) {
      const y = yBase + Math.sin(x * 5.4 + i * 1.7) * 0.028 + Math.sin(x * 13 + i) * 0.012;
      if (x === 0) ctx.moveTo(px(x), py(y));
      else ctx.lineTo(px(x), py(y));
    }
    ctx.strokeStyle = 'rgba(214, 212, 170, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // road
  ctx.beginPath();
  ctx.moveTo(px(0.02), py(0.94));
  ctx.bezierCurveTo(px(0.3), py(0.8), px(0.52), py(0.9), px(0.99), py(0.66));
  ctx.strokeStyle = 'rgba(190, 178, 140, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  const poly = burnPolygon(site, burn, mulberry32(site.seed + 90));

  // canopy masses — soft dark-green crowns beneath the fine texture
  for (let i = 0; i < 130; i += 1) {
    const x = rng();
    const y = rng();
    if (poly.length && pointInPolygon(x, y, poly)) continue;
    const radius = 8 + rng() * 26;
    const gradient = ctx.createRadialGradient(px(x), py(y), 0, px(x), py(y), radius);
    gradient.addColorStop(0, `rgba(${22 + rng() * 18}, ${48 + rng() * 26}, ${26 + rng() * 16}, ${0.16 + rng() * 0.22})`);
    gradient.addColorStop(1, 'rgba(40, 64, 38, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(px(x), py(y), radius * 1.5, radius, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // canopy
  for (let i = 0; i < 1600; i += 1) {
    const x = rng();
    const y = rng();
    const inBurn = poly.length ? pointInPolygon(x, y, poly) : false;
    if (inBurn) {
      if (rng() > 0.08) continue;
      ctx.fillStyle = 'rgba(48, 40, 34, 0.85)';
      ctx.fillRect(px(x), py(y), 1.2, 5 + rng() * 8);
      continue;
    }
    const density = 0.5 + emergent * 0.5;
    if (rng() > density) continue;
    const size = 1.8 + rng() * 6.5;
    ctx.fillStyle = `rgba(${26 + rng() * 26}, ${52 + rng() * 34}, ${26 + rng() * 20}, ${0.55 + rng() * 0.4})`;
    ctx.beginPath();
    ctx.arc(px(x), py(y), size, 0, Math.PI * 2);
    ctx.fill();
  }

  // burn scar overlay
  if (poly.length) {
    ctx.beginPath();
    ctx.moveTo(px(poly[0][0]), py(poly[0][1]));
    poly.slice(1).forEach(([x, y]) => ctx.lineTo(px(x), py(y)));
    ctx.closePath();
    ctx.fillStyle = `rgba(44, 38, 33, ${0.35 + burn * 0.5})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 24, 21, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // ash / exposed soil
    for (let i = 0; i < 150; i += 1) {
      const x = 0.3 + rng() * 0.55;
      const y = 0.25 + rng() * 0.45;
      if (!pointInPolygon(x, y, poly)) continue;
      const val = 78 + rng() * 40;
      ctx.fillStyle = `rgba(${val}, ${val - 6}, ${val - 12}, ${0.1 + rng() * 0.16})`;
      ctx.beginPath();
      ctx.arc(px(x), py(y), 1 + rng() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(218, 222, 200, 0.08)';
  ctx.fillRect(0, 0, W, H);
}

function paintForestRadar(ctx, site, params, rng) {
  const { burn, emergent } = params;
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#6c746a');
  base.addColorStop(0.55, '#7f857a');
  base.addColorStop(1, '#697067');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // ridge relief — lit and shadowed bands
  for (let i = 0; i < 6; i += 1) {
    const yBase = 0.12 + i * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, py(yBase));
    for (let x = 0; x <= 1.001; x += 0.05) {
      const y = yBase + Math.sin(x * 5.4 + i * 1.7) * 0.028 + Math.sin(x * 13 + i) * 0.012;
      ctx.lineTo(px(x), py(y));
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(34, 38, 34, 0.32)' : 'rgba(210, 212, 198, 0.13)';
    ctx.fill();
  }

  const poly = burnPolygon(site, burn, mulberry32(site.seed + 90));

  // Canopy clumps — broad, soft patches of volume scattering.
  for (let i = 0; i < 220; i += 1) {
    const x = rng();
    const y = rng();
    if (poly.length && pointInPolygon(x, y, poly)) continue;
    const radius = 5 + rng() * 22;
    const gradient = ctx.createRadialGradient(px(x), py(y), 0, px(x), py(y), radius);
    const tint = 170 + rng() * 55;
    gradient.addColorStop(0, `rgba(${tint}, ${tint}, ${tint}, ${0.2 + rng() * 0.26})`);
    gradient.addColorStop(1, 'rgba(110, 118, 108, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(px(x), py(y), radius * 1.5, radius, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine canopy texture
  for (let i = 0; i < 3000; i += 1) {
    const x = rng();
    const y = rng();
    const inBurn = poly.length ? pointInPolygon(x, y, poly) : false;
    if (inBurn) continue;
    const density = 0.55 + emergent * 0.45;
    if (rng() > density) continue;
    const val = 90 + rng() * 145;
    ctx.fillStyle = `rgba(${val}, ${val}, ${val}, ${0.35 + rng() * 0.55})`;
    const s = 1.3 + rng() * 4.4;
    ctx.fillRect(px(x), py(y), s, s);
  }

  if (poly.length) {
    ctx.beginPath();
    ctx.moveTo(px(poly[0][0]), py(poly[0][1]));
    poly.slice(1).forEach(([x, y]) => ctx.lineTo(px(x), py(y)));
    ctx.closePath();
    ctx.fillStyle = `rgba(34, 38, 35, ${0.3 + burn * 0.55})`;
    ctx.fill();
    // charred standing trunks return strongly
    for (let i = 0; i < 90; i += 1) {
      const x = 0.3 + rng() * 0.55;
      const y = 0.25 + rng() * 0.45;
      if (!pointInPolygon(x, y, poly)) continue;
      const val = 180 + rng() * 65;
      ctx.fillStyle = `rgba(${val}, ${val}, ${val}, ${0.65 + rng() * 0.3})`;
      ctx.fillRect(px(x), py(y), 1 + rng() * 2, 4 + rng() * 9);
    }
  }

  // road / clearing
  ctx.beginPath();
  ctx.moveTo(px(0.02), py(0.94));
  ctx.bezierCurveTo(px(0.3), py(0.8), px(0.52), py(0.9), px(0.99), py(0.66));
  ctx.strokeStyle = 'rgba(28, 32, 29, 0.6)';
  ctx.lineWidth = 3.5;
  ctx.stroke();
}

/* ---------- optical clouds ---------- */
function paintClouds(ctx, cover, seed) {
  if (cover <= 0.02) return;
  const rng = mulberry32(seed);
  const count = Math.round(5 + cover * 12);
  for (let c = 0; c < count; c += 1) {
    const cx = rng();
    const cy = 0.1 + rng() * 0.85;
    const rx = 0.12 + rng() * 0.22;
    const ry = 0.05 + rng() * 0.11;
    const opacity = 0.25 + cover * 0.55;
    for (let b = 0; b < 9; b += 1) {
      const ox = cx + (rng() - 0.5) * rx * 1.4;
      const oy = cy + (rng() - 0.5) * ry * 1.6;
      const r = px(rx * (0.32 + rng() * 0.42));
      const gradient = ctx.createRadialGradient(px(ox), py(oy), r * 0.1, px(ox), py(oy), r);
      const grey = 228 + Math.round(rng() * 22);
      gradient.addColorStop(0, `rgba(${grey}, ${grey + 2}, ${grey + 4}, ${opacity})`);
      gradient.addColorStop(0.55, `rgba(${grey - 12}, ${grey - 10}, ${grey - 6}, ${opacity * 0.7})`);
      gradient.addColorStop(1, 'rgba(190, 194, 190, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(px(ox), py(oy), r, r * (0.45 + rng() * 0.35), rng() * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // cloud veil
  ctx.fillStyle = `rgba(232, 234, 228, ${cover * 0.24})`;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- shared finishing ---------- */
function finishOptical(ctx, rng) {
  const image = ctx.getImageData(0, 0, W, H);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rng() - 0.5) * 10;
    data[i] = clamp(data[i] + n);
    data[i + 1] = clamp(data[i + 1] + n);
    data[i + 2] = clamp(data[i + 2] + n);
  }
  ctx.putImageData(image, 0, 0);
  // vignette
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(20,24,18,0.32)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function finishRadar(ctx, rng) {
  const image = ctx.getImageData(0, 0, W, H);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // multiplicative speckle, stronger on bright targets
    const sigma = 0.16 + (lum / 255) * 0.24;
    const factor = 1 + (rng() - 0.5) * 2 * sigma;
    const value = lum * factor;
    // desaturated, faint green cast in the radar raster
    data[i] = clamp(value * 0.86);
    data[i + 1] = clamp(value * 1.02);
    data[i + 2] = clamp(value * 0.9);
  }
  ctx.putImageData(image, 0, 0);

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,10,2,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} site
 * @param {{water?:number,emergent?:number,burn?:number,cloud?:number}} params
 * @param {'optical'|'radar'} channel
 */
export function paintScene(canvas, site, params = {}, channel = 'radar') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const merged = { water: 0.3, emergent: 0.6, burn: 0, cloud: 0.3, ...params };
  const seedBase = (site?.seed ?? 1) * 997 + Math.round(merged.water * 61) + Math.round(merged.burn * 83);
  const rng = mulberry32(seedBase);

  ctx.clearRect(0, 0, W, H);
  if (site?.kind === 'wetland') {
    if (channel === 'optical') paintWetlandOptical(ctx, site, merged, rng);
    else paintWetlandRadar(ctx, site, merged, rng);
  } else if (channel === 'optical') {
    paintForestOptical(ctx, site, merged, rng);
  } else {
    paintForestRadar(ctx, site, merged, rng);
  }

  if (channel === 'optical') {
    paintClouds(ctx, merged.cloud, seedBase + 11);
    finishOptical(ctx, mulberry32(seedBase + 23));
  } else {
    finishRadar(ctx, mulberry32(seedBase + 37));
  }
}

export const SCENE_DIMENSIONS = { width: W, height: H };
