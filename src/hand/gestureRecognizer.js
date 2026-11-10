/**
 * HOLOLAB Day 6: framework-independent, deterministic gesture recognizer.
 * No webcam, DOM, Three.js, or React dependency. Accepts MediaPipe's normalized
 * 21-point landmarks and returns stable gesture snapshots for later action mapping.
 */
export const GESTURES = Object.freeze({
  NONE: 'NONE',
  POINT: 'POINT',
  PINCH: 'PINCH',
  OPEN_PALM: 'OPEN_PALM',
  FIST: 'FIST',
});

export const GESTURE_LABELS = Object.freeze({
  NONE: 'Unrecognized',
  POINT: 'Point',
  PINCH: 'Pinch',
  OPEN_PALM: 'Open palm',
  FIST: 'Fist',
  TWO_HAND_ZOOM: 'Two-hand zoom',
});

export const SENSITIVITY = Object.freeze({
  relaxed: { pinchOn: 0.43, pinchOff: 0.65, extensionAngle: 146, enterMs: 100, minSamples: 2 },
  balanced: { pinchOn: 0.35, pinchOff: 0.55, extensionAngle: 153, enterMs: 120, minSamples: 2 },
  precise: { pinchOn: 0.28, pinchOff: 0.46, extensionAngle: 159, enterMs: 160, minSamples: 3 },
});

const FINGER_JOINTS = [
  [5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20],
];
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function angleDeg(a, b, c) {
  const ux = a.x - b.x;
  const uy = a.y - b.y;
  const vx = c.x - b.x;
  const vy = c.y - b.y;
  const den = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (den < 1e-7) return 0;
  return Math.acos(clamp((ux * vx + uy * vy) / den, -1, 1)) * (180 / Math.PI);
}

function validPoints(points) {
  return Array.isArray(points) && points.length === 21 && points.every(
    point => point && Number.isFinite(point.x) && Number.isFinite(point.y),
  );
}

/** Classifies a single frame. `wasPinching` creates pinch hysteresis. */
export function classifyHand(points, { sensitivity = 'balanced', wasPinching = false } = {}) {
  if (!validPoints(points)) return null;
  const config = SENSITIVITY[sensitivity] || SENSITIVITY.balanced;
  const palmWidth = Math.max(0.025, distance(points[5], points[17]));
  const pinchRatio = distance(points[4], points[8]) / palmWidth;
  const pinching = pinchRatio <= (wasPinching ? config.pinchOff : config.pinchOn);
  const fingers = FINGER_JOINTS.map(([mcp, pip, tip]) => {
    const ang = angleDeg(points[mcp], points[pip], points[tip]);
    const reachRatio = distance(points[mcp], points[tip]) / Math.max(0.00001, distance(points[mcp], points[pip]));
    // Both tests matter: a bent fingertip sometimes extends away from the MCP
    // in 2D despite the finger being curled.
    return ang >= config.extensionAngle && reachRatio >= 1.43;
  });
  const extendedCount = fingers.filter(Boolean).length;
  let raw = GESTURES.NONE;
  if (pinching) raw = GESTURES.PINCH;
  else if (extendedCount === 4) raw = GESTURES.OPEN_PALM;
  else if (fingers[0] && extendedCount === 1) raw = GESTURES.POINT;
  else if (extendedCount === 0) raw = GESTURES.FIST;

  const centroid = { x: (points[0].x + points[5].x + points[9].x + points[17].x) / 4,
    y: (points[0].y + points[5].y + points[9].y + points[17].y) / 4 };
  const pinchCenter = { x: (points[4].x + points[8].x) / 2, y: (points[4].y + points[8].y) / 2 };
  return { raw, pinching, pinchRatio: Math.round(pinchRatio * 100) / 100,
    palmWidth, fingers, extendedCount, centroid, pinchCenter,
    indexTip: { x: points[8].x, y: points[8].y } };
}

function labelOf(result, index) {
  return result?.handedness?.[index]?.[0]?.categoryName
    || result?.handednesses?.[index]?.[0]?.categoryName || 'Unknown';
}

/**
 * A small temporal state machine to smooth landmark jitter:
 * - matching hands by prior palm position rather than array index
 * - pinch threshold hysteresis
 * - require minimum consecutive detections and elapsed time
 * - expire hands after a short disappearance
 * - independent two-pinch combination (not a synthetic standalone raw gesture)
 */
export class GestureEngine {
  constructor({ sensitivity = 'balanced' } = {}) {
    this.sensitivity = SENSITIVITY[sensitivity] ? sensitivity : 'balanced';
    this.slots = [];
    this.nextId = 1;
    this.zoomAnchor = null;
  }

  reset() {
    this.slots = [];
    this.nextId = 1;
    this.zoomAnchor = null;
  }

  setSensitivity(value) {
    if (!SENSITIVITY[value]) throw new Error(`Unknown gesture sensitivity: ${value}`);
    if (this.sensitivity !== value) { this.sensitivity = value; this.reset(); }
  }

  process(result, nowMs) {
    const now = Number.isFinite(nowMs) ? nowMs : 0;
    const config = SENSITIVITY[this.sensitivity];
    const entries = (result?.landmarks || []).map((points, index) => ({ points, label: labelOf(result, index) }))
      .filter(entry => validPoints(entry.points)).slice(0, 2);
    const assigned = new Set();
    const seenSlots = [];

    for (const entry of entries) {
      const rawPalm = { x: (entry.points[0].x + entry.points[5].x + entry.points[9].x + entry.points[17].x) / 4,
        y: (entry.points[0].y + entry.points[5].y + entry.points[9].y + entry.points[17].y) / 4 };
      let best = null;
      let bestCost = Infinity;
      for (const slot of this.slots) {
        if (assigned.has(slot.id) || now - slot.lastSeen > 400) continue;
        const posCost = distance(slot.palm, rawPalm);
        // A tiny preference for same handedness, but position wins over a
        // flickering Left/Right label. The two hands may cross briefly.
        const labelPenalty = entry.label !== 'Unknown' && slot.label !== 'Unknown' && entry.label !== slot.label ? 0.04 : 0;
        const cost = posCost + labelPenalty;
        if (cost < bestCost && posCost < 0.38) { bestCost = cost; best = slot; }
      }
      if (!best) {
        best = { id: this.nextId++, label: entry.label, palm: rawPalm,
          lastSeen: now, stable: GESTURES.NONE, stableSince: now,
          candidate: GESTURES.NONE, candidateSince: now, candidateSamples: 0,
          pinching: false, lastSnapshot: null,
          pointer: {x: entry.points[8].x, y: entry.points[8].y} };
        this.slots.push(best);
      }
      assigned.add(best.id);
      best.lastSeen = now;
      best.label = entry.label;
      const measurement = classifyHand(entry.points, { sensitivity: this.sensitivity, wasPinching: best.pinching });
      best.pinching = measurement.pinching;
      // Smooth only position (not gesture classification) so the cursor does
      // not jitter. Don't introduce significant movement latency.
      best.palm = { x: best.palm.x * 0.5 + rawPalm.x * 0.5, y: best.palm.y * 0.5 + rawPalm.y * 0.5 };
      if (measurement.raw !== best.candidate) {
        best.candidate = measurement.raw;
        best.candidateSince = now;
        best.candidateSamples = 1;
      } else best.candidateSamples += 1;
      if (best.candidate !== best.stable && best.candidateSamples >= config.minSamples && now - best.candidateSince >= config.enterMs) {
        best.stable = best.candidate;
        best.stableSince = now;
      }
      best.pointer = { x: best.pointer.x * 0.45 + measurement.indexTip.x * 0.55,
        y: best.pointer.y * 0.45 + measurement.indexTip.y * 0.55 };
      best.lastSnapshot = { id: best.id, handedness: entry.label,
        gesture: best.stable, raw: measurement.raw,
        heldMs: Math.max(0, now - best.stableSince),
        candidateMs: Math.max(0, now - best.candidateSince),
        candidate: best.candidate, ...measurement, indexTip: best.pointer };
      seenSlots.push(best);
    }

    // A vanished hand must never retain a grab. Clear gesture state if its
    // landmarks disappear; retain identity briefly for reappearance matching.
    for (const slot of this.slots) {
      if (!assigned.has(slot.id)) {
        slot.pinching = false;
        slot.stable = GESTURES.NONE;
        slot.candidate = GESTURES.NONE;
        slot.candidateSamples = 0;
        slot.lastSnapshot = null;
      }
    }
    this.slots = this.slots.filter(slot => now - slot.lastSeen <= 400);
    const hands = seenSlots.map(slot => slot.lastSnapshot).sort((a,b) => a.id - b.id);
    let twoHand = { active: false, separation: null, zoomFactor: 1 };
    if (hands.length === 2 && hands.every(hand => hand.gesture === GESTURES.PINCH && hand.pinching)) {
      const separation = distance(hands[0].pinchCenter, hands[1].pinchCenter);
      if (!this.zoomAnchor || this.zoomAnchor.ids !== hands.map(h => h.id).join(':')) {
        this.zoomAnchor = { separation: Math.max(separation, 0.05), ids: hands.map(h => h.id).join(':') };
      }
      twoHand = { active: true, separation: Math.round(separation * 1000) / 1000,
        zoomFactor: Math.round(clamp(separation / this.zoomAnchor.separation, 0.25, 4) * 100) / 100 };
    } else this.zoomAnchor = null;
    return { hands, twoHand, timestamp: now };
  }
}
