import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHand, GestureEngine, GESTURES, SENSITIVITY } from '../src/hand/gestureRecognizer.js';

/** Synthetic, clearly posed 2D landmarks: deterministic unit tests, not webcam validation. */
function pose(kind = 'open', dx = 0, dy = 0) {
  const pts = Array.from({length: 21}, () => ({ x: .50 + dx, y: .70 + dy, z: 0 }));
  function point(i, x, y) { pts[i] = {x: x + dx, y: y + dy, z: 0}; }
  point(0, .52, .85); point(1, .34, .73); point(2, .28, .64); point(3, .24, .53); point(4, .22, .42);
  for (const [idx, x] of [[5,.39],[9,.47],[13,.57],[17,.66]]) {
    point(idx, x, .58); point(idx+1, x, .45); point(idx+2, x, .37); point(idx+3, x, .27);
  }
  const curl = (idx, x) => { point(idx + 1, x, .44); point(idx + 2, x+.02, .52); point(idx + 3, x+.015, .59); };
  if (kind === 'point' || kind === 'fist') { curl(9,.47); curl(13,.57); curl(17,.66); }
  if (kind === 'fist') curl(5,.39);
  if (kind === 'pinch') point(4, .40, .28);
  if (kind === 'near-pinch') point(4, .39 + .13, .27); // .13 / .27 ≈ .48 in hysteresis zone
  return pts;
}

function frame(hands, labels = ['Right','Left']) {
  return { landmarks: hands, handedness: hands.map((_, i) => [{categoryName: labels[i] || 'Unknown', score: .99}]) };
}
function settle(engine, result, start = 100) {
  let out;
  for (const t of [start, start+70, start+150, start+210]) out = engine.process(result, t);
  return out;
}

test('classifies clear poses and rejects malformed input', () => {
  assert.equal(classifyHand(pose('open')).raw, GESTURES.OPEN_PALM);
  assert.equal(classifyHand(pose('point')).raw, GESTURES.POINT);
  assert.equal(classifyHand(pose('fist')).raw, GESTURES.FIST);
  assert.equal(classifyHand(pose('pinch')).raw, GESTURES.PINCH);
  assert.equal(classifyHand(null), null);
  assert.equal(classifyHand(Array(21).fill({x:NaN,y:0})), null);
});

test('pinch hysteresis avoids repeated toggles on small distance changes', () => {
  const close = classifyHand(pose('pinch'));
  assert(close.pinching);
  const borderline = classifyHand(pose('near-pinch'), {wasPinching:true});
  assert(borderline.pinching, `Expected to remain pinching with ratio ${borderline.pinchRatio}`);
  const notHeld = classifyHand(pose('near-pinch'), {wasPinching:false});
  assert(!notHeld.pinching);
  assert.equal(classifyHand(pose('open'), {wasPinching:true}).pinching, false);
});

test('gesture requires multiple samples and elapsed time', () => {
  const engine = new GestureEngine();
  const first = engine.process(frame([pose('point')]), 100);
  assert.equal(first.hands[0].gesture, GESTURES.NONE);
  const second = engine.process(frame([pose('point')]), 150);
  assert.equal(second.hands[0].gesture, GESTURES.NONE);
  const third = engine.process(frame([pose('point')]), 250);
  assert.equal(third.hands[0].gesture, GESTURES.POINT);
  assert(third.hands[0].heldMs >= 0);
});

test('single-frame gesture noise does not switch stable state', () => {
  const engine = new GestureEngine();
  settle(engine, frame([pose('open')]));
  assert.equal(engine.process(frame([pose('fist')]), 350).hands[0].gesture, GESTURES.OPEN_PALM);
  assert.equal(engine.process(frame([pose('open')]), 400).hands[0].gesture, GESTURES.OPEN_PALM);
});

test('two-hand gesture locks a relative zoom factor and clears on release', () => {
  const engine = new GestureEngine();
  const start = frame([pose('pinch', -.15), pose('pinch', .15)]);
  const settled = settle(engine, start);
  assert.deepEqual(settled.hands.map(h => h.gesture), [GESTURES.PINCH, GESTURES.PINCH]);
  assert.equal(settled.twoHand.active, true);
  assert.equal(settled.twoHand.zoomFactor, 1);
  const spread = engine.process(frame([pose('pinch', -.25), pose('pinch', .25)]), 390);
  assert(spread.twoHand.zoomFactor > 1.4, `${spread.twoHand.zoomFactor}`);
  const released = engine.process(frame([pose('open', -.25), pose('pinch', .25)]), 460);
  // Pinch hysteresis/gesture confirmation intentionally stops zoom after a stable release.
  const clear = engine.process(frame([pose('open', -.25), pose('pinch', .25)]), 670);
  assert.equal(clear.twoHand.active, false);
  assert.equal(engine.process(frame([pose('pinch', -.25)]), 800).twoHand.active, false);
});

test('array-order changes do not change hand identities', () => {
  const engine = new GestureEngine();
  const a = settle(engine, frame([pose('point', -.24), pose('fist', .24)], ['Right','Left']));
  const idsByGesture = new Map(a.hands.map(h => [h.gesture, h.id]));
  const b = engine.process(frame([pose('fist', .23), pose('point', -.23)], ['Left','Right']), 410);
  for (const hand of b.hands) assert.equal(hand.id, idsByGesture.get(hand.gesture));
});

test('losing a hand clears active pinch, camera reset clears all state', () => {
  const engine = new GestureEngine();
  settle(engine, frame([pose('pinch')]));
  assert.equal(engine.process(frame([]), 600).hands.length, 0);
  assert.equal(engine.process(frame([pose('pinch')]), 660).hands[0].gesture, GESTURES.NONE);
  engine.reset();
  assert.equal(engine.process(frame([]), 680).hands.length, 0);
  assert.equal(engine.nextId, 1);
});

test('sensitivity updates reset stabilization, invalid options are rejected', () => {
  const engine = new GestureEngine();
  settle(engine, frame([pose('point')]));
  engine.setSensitivity('precise');
  assert.equal(engine.process(frame([pose('point')]), 500).hands[0].gesture, GESTURES.NONE);
  assert.equal(Object.keys(SENSITIVITY).length, 3);
  assert.throws(() => engine.setSensitivity('potato'), /Unknown gesture sensitivity/);
});
