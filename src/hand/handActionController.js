/**
 * Day 7: turns stabilized gesture snapshots into one-shot camera/selection actions.
 * Pure JavaScript; no React, webcam, DOM, or Three.js dependencies.
 *
 * Coordinates are normalized to the viewer. The selfie webcam is mirrored in
 * the UI, so the x axis is reversed before projecting into the 3D viewport.
 */
import { GESTURES } from './gestureRecognizer.js';

const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const pointDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const STALE_FRAME_MS = 320;
const MAX_DRAG_STEP = 0.105;

function viewerPoint(hand) {
  const point = hand?.indexTip || hand?.centroid;
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  return { x: clamp(1 - point.x, 0.015, 0.985), y: clamp(point.y, 0.015, 0.985) };
}
function palmPoint(hand) {
  if (!Number.isFinite(hand?.centroid?.x) || !Number.isFinite(hand?.centroid?.y)) return null;
  return { x: 1 - hand.centroid.x, y: hand.centroid.y };
}

export class HandActionController {
  constructor() { this.reset(); }

  reset() {
    this.lastTimestamp = null;
    this.activeId = null;
    this.lastPalm = null;
    this.lastMode = 'idle';
    this.pendingPick = null;
    this.zooming = false;
    this.suppressPick = false;
    this.cursor = null;
  }

  consume(frame, now) {
    const empty = { fresh: false, mode: 'idle', cursor: null, select: null,
      orbit: null, pan: null, zoom: null, startedZoom: false, gestureAgeMs: null };
    if (!frame || !Number.isFinite(frame.timestamp) || !Array.isArray(frame.hands)
        || !Number.isFinite(now) || now - frame.timestamp > STALE_FRAME_MS
        || now < frame.timestamp - 100 || frame.hands.length === 0) {
      this.reset();
      return empty;
    }
    // A 60 Hz renderer may see the same 15 Hz gesture snapshot four times.
    // Never repeat discrete actions or accumulate camera movement four times.
    if (frame.timestamp === this.lastTimestamp) return { ...empty, gestureAgeMs: Math.max(0, now - frame.timestamp) };
    this.lastTimestamp = frame.timestamp;

    const hands = frame.hands.filter(h => Number.isInteger(h.id));
    if (!hands.length) { this.reset(); return empty; }
    const twoHand = Boolean(frame.twoHand?.active && hands.length === 2);
    const previousZoom = this.zooming;
    this.zooming = twoHand;
    if (twoHand) {
      this.pendingPick = null;
      this.suppressPick = true;
      this.lastPalm = null;
      this.lastMode = 'zoom';
      return { ...empty, fresh: true, mode: 'zoom', zoom: clamp(frame.twoHand.zoomFactor || 1, 0.35, 3.0),
        startedZoom: !previousZoom, gestureAgeMs: Math.max(0, now - frame.timestamp) };
    }

    const hand = hands.find(h => h.id === this.activeId)
      || hands.find(h => h.gesture !== GESTURES.NONE) || hands[0];
    const idChanged = hand.id !== this.activeId;
    if (idChanged) {
      this.pendingPick = null;
      this.activeId = hand.id;
      this.lastPalm = null;
      this.lastMode = 'idle';
    }
    const gesture = hand.gesture;
    const cursor = viewerPoint(hand);
    const palm = palmPoint(hand);
    const mode = gesture === GESTURES.POINT ? 'point'
      : gesture === GESTURES.PINCH ? 'pinch'
        : gesture === GESTURES.FIST ? 'orbit'
          : gesture === GESTURES.OPEN_PALM ? 'pan' : 'idle';
    const out = { ...empty, fresh: true, mode, cursor,
      gestureAgeMs: Math.max(0, now - frame.timestamp) };

    // Select on release, not on pinch-down. This prevents an initial pinch
    // from selecting a part when the user is beginning a two-hand zoom.
    if (mode === 'pinch' && cursor) {
      if (!this.suppressPick && !this.pendingPick) {
        this.pendingPick = { id: hand.id, at: frame.timestamp, start: cursor, travelled: 0 };
      } else if (this.pendingPick) {
        this.pendingPick.travelled = Math.max(this.pendingPick.travelled,
          pointDistance(cursor, this.pendingPick.start));
      }
    } else if (this.pendingPick) {
      const pick = this.pendingPick;
      const duration = frame.timestamp - pick.at;
      if (!this.suppressPick && idChanged === false && duration >= 70
          && duration <= 850 && pick.travelled < 0.085) {
        out.select = { ...pick.start };
      }
      this.pendingPick = null;
    }

    if (hands.every(h => h.gesture !== GESTURES.PINCH)) this.suppressPick = false;
    if (['orbit', 'pan'].includes(mode) && palm && mode === this.lastMode && this.lastPalm && !idChanged) {
      const dx = clamp(palm.x - this.lastPalm.x, -MAX_DRAG_STEP, MAX_DRAG_STEP);
      const dy = clamp(palm.y - this.lastPalm.y, -MAX_DRAG_STEP, MAX_DRAG_STEP);
      if (Math.hypot(dx, dy) > 0.002) out[mode] = { dx, dy };
    }
    this.lastPalm = palm;
    this.lastMode = mode;
    this.cursor = cursor;
    return out;
  }
}
