import test from 'node:test';
import assert from 'node:assert/strict';
import { HandActionController } from '../src/hand/handActionController.js';
import { GESTURES } from '../src/hand/gestureRecognizer.js';
import { summarizeBenchmark } from '../src/utils/performanceMetrics.js';

const hand = (id, gesture, x = .35, y = .42) => ({
  id, gesture, indexTip: { x, y }, centroid: { x: x + .015, y: y + .1 },
});
const sample = (timestamp, hands, zoom = null) => ({ timestamp, hands,
  twoHand: zoom == null ? { active: false, zoomFactor: 1 } : { active: true, zoomFactor: zoom },
});

test('selfie coordinates mirror horizontally into the 3D viewport', () => {
  const controls = new HandActionController();
  const result = controls.consume(sample(100, [hand(1, GESTURES.POINT, .2, .7)]), 120);
  assert.deepEqual(result.cursor, { x: .8, y: .7 });
  assert.equal(result.mode, 'point');
});

test('a single stable pinch selects precisely once on release', () => {
  const controls = new HandActionController();
  const first = controls.consume(sample(100, [hand(1, GESTURES.PINCH)]), 120);
  assert.equal(first.select, null);
  assert.equal(controls.consume(sample(180, [hand(1, GESTURES.PINCH)]), 190).select, null);
  const release = controls.consume(sample(280, [hand(1, GESTURES.POINT)]), 295);
  assert(release.select);
  assert.equal(release.select.x, .65);
  assert.equal(controls.consume(sample(280, [hand(1, GESTURES.POINT)]), 310).select, null);
  assert.equal(controls.consume(sample(350, [hand(1, GESTURES.POINT)]), 370).select, null);
});

test('movement during pinch or extended holding does not accidentally select', () => {
  const controls = new HandActionController();
  controls.consume(sample(100, [hand(1, GESTURES.PINCH, .2)]), 120);
  controls.consume(sample(200, [hand(1, GESTURES.PINCH, .43)]), 210);
  assert.equal(controls.consume(sample(300, [hand(1, GESTURES.POINT, .43)]), 310).select, null);
  controls.consume(sample(500, [hand(1, GESTURES.PINCH)]), 520);
  assert.equal(controls.consume(sample(1500, [hand(1, GESTURES.POINT)]), 1510).select, null);
});

test('two-hand zoom does not select on either release and conveys factor', () => {
  const controls = new HandActionController();
  controls.consume(sample(100, [hand(1, GESTURES.PINCH)]), 111);
  const zoom = controls.consume(sample(220, [hand(1, GESTURES.PINCH), hand(2, GESTURES.PINCH, .8)], 1.4), 230);
  assert.equal(zoom.mode, 'zoom');
  assert.equal(zoom.zoom, 1.4);
  assert.equal(zoom.startedZoom, true);
  assert.equal(zoom.select, null);
  assert.equal(controls.consume(sample(290, [hand(1, GESTURES.PINCH), hand(2, GESTURES.PINCH, .84)], 1.6), 300).startedZoom, false);
  assert.equal(controls.consume(sample(390, [hand(1, GESTURES.POINT)]), 410).select, null);
  assert.equal(controls.consume(sample(460, [hand(1, GESTURES.POINT)]), 470).select, null);
});

test('fist orbits and open palm pans without movement jump on switch', () => {
  const controls = new HandActionController();
  assert.equal(controls.consume(sample(100, [hand(1, GESTURES.FIST)]), 110).orbit, null);
  const orbit = controls.consume(sample(175, [hand(1, GESTURES.FIST, .4, .47)]), 185);
  assert(orbit.orbit);
  assert(orbit.orbit.dx < 0);
  assert.equal(controls.consume(sample(235, [hand(1, GESTURES.OPEN_PALM, .42, .47)]), 245).pan, null);
  assert(controls.consume(sample(310, [hand(1, GESTURES.OPEN_PALM, .44, .5)]), 320).pan);
});

test('disappearing or stale gestures cancel actions and pending picks', () => {
  const controls = new HandActionController();
  controls.consume(sample(100, [hand(1, GESTURES.PINCH)]), 120);
  assert.equal(controls.consume(null, 180).fresh, false);
  assert.equal(controls.consume(sample(250, [hand(1, GESTURES.POINT)]), 260).select, null);
  assert.equal(controls.consume(sample(300, [hand(1, GESTURES.FIST)]), 750).fresh, false);
});

test('frame timestamp de-duplicates events at faster renderer FPS', () => {
  const controls = new HandActionController();
  const frame = sample(100, [hand(1, GESTURES.FIST)]);
  assert.equal(controls.consume(frame, 115).fresh, true);
  assert.equal(controls.consume(frame, 131).fresh, false);
});

test('performance samples report actual averages, not a guaranteed benchmark', () => {
  assert.equal(summarizeBenchmark([]), null);
  assert.deepEqual(summarizeBenchmark([
    { fps: 60, p95FrameMs: 17, avgFrameMs: 16.7, trackingFps: 0, inferenceMs: 0 },
    { fps: 50, p95FrameMs: 25, avgFrameMs: 20, trackingFps: 15, inferenceMs: 8 },
  ]), { seconds: 2, fps: 55, p95FrameMs: 21, avgFrameMs: 18.4, trackingFps: 7.5, inferenceMs: 4 });
});
