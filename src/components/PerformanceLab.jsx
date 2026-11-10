import { useEffect, useRef, useState } from 'react';
import { summarizeBenchmark } from '../utils/performanceMetrics.js';

const SAMPLE_COUNT = 8;
export default function PerformanceLab({ renderMetrics, handDiagnostics }) {
  const [expanded, setExpanded] = useState(false);
  const [capture, setCapture] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ baseline: null, camera: null });
  const samplesRef = useRef([]);
  const diagnosticsRef = useRef(handDiagnostics);
  diagnosticsRef.current = handDiagnostics;

  useEffect(() => {
    if (!capture || !renderMetrics) return;
    const hand = diagnosticsRef.current;
    const isCameraRunning = hand.status === 'running';
    if ((capture === 'camera') !== isCameraRunning) { setCapture(null); samplesRef.current = []; return; }
    samplesRef.current.push({ ...renderMetrics,
      trackingFps: hand.trackingFps || 0,
      inferenceMs: Number.isFinite(hand.inferenceMs) ? hand.inferenceMs : 0 });
    setProgress(samplesRef.current.length);
    if (samplesRef.current.length >= SAMPLE_COUNT) {
      const result = summarizeBenchmark(samplesRef.current);
      setResults(old => ({ ...old, [capture]: result }));
      setCapture(null);
      samplesRef.current = [];
    }
  }, [capture, renderMetrics]);

  function begin(type) {
    samplesRef.current = [];
    setProgress(0);
    setCapture(type);
  }
  const cameraRunning = handDiagnostics.status === 'running';
  const off = results.baseline;
  const on = results.camera;
  const delta = off && on && off.fps ? round(100 * (on.fps - off.fps) / off.fps) : null;

  return <section className="perf-lab" aria-label="Performance comparison">
    <button className="perf-heading" type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
      <span>PERFORMANCE LAB <strong>FPS / FRAME TIME / TRACKING</strong></span><span>{expanded ? 'COLLAPSE −' : 'EXPAND +'}</span>
    </button>
    {expanded && <div className="perf-body">
      <div className="perf-current">
        <div><small>RENDER</small><strong>{renderMetrics?.fps ?? '—'} FPS</strong></div>
        <div><small>P95 FRAME GAP</small><strong>{renderMetrics?.p95FrameMs != null ? `${renderMetrics.p95FrameMs} ms` : '—'}</strong></div>
        <div><small>WEBGL DRAW CALLS</small><strong>{renderMetrics?.drawCalls ?? '—'}</strong></div>
        <div><small>CV INFERENCE</small><strong>{handDiagnostics.inferenceMs != null ? `${handDiagnostics.inferenceMs} ms` : '—'}</strong></div>
      </div>
      <p>Capture two eight-sample comparisons under the <strong>same quality preset</strong>. Keep the tab visible and the machine still. Do the baseline with the camera stopped, then run the camera-on test with gestures enabled.</p>
      <div className="perf-buttons">
        <button type="button" disabled={capture !== null || cameraRunning || !renderMetrics} onClick={() => begin('baseline')}>Capture camera OFF</button>
        <button type="button" disabled={capture !== null || !cameraRunning || !renderMetrics} onClick={() => begin('camera')}>Capture camera ON</button>
        {capture && <button type="button" onClick={() => { setCapture(null); samplesRef.current = []; }}>Cancel test</button>}
      </div>
      {capture && <p role="status" className="perf-capturing">Recording {capture === 'camera' ? 'camera-on' : 'baseline'} metrics… {progress}/{SAMPLE_COUNT} samples</p>}
      <div className="perf-results">
        <div><small>CAMERA OFF</small><strong>{off ? `${off.fps} FPS` : 'Not captured'}</strong><span>{off ? `P95 frame gap ${off.p95FrameMs} ms` : 'Stop camera to record'}</span></div>
        <div><small>CAMERA ON</small><strong>{on ? `${on.fps} FPS` : 'Not captured'}</strong><span>{on ? `Tracking ${on.trackingFps} FPS · inference ${on.inferenceMs} ms` : 'Start camera to record'}</span></div>
        <div><small>RENDER FPS DIFFERENCE</small><strong>{delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}</strong><span>{delta != null && delta < -20 ? 'Consider Eco quality or 10–15 FPS tracking' : 'Compare under matching scene/settings'}</span></div>
      </div>
      <p className="perf-note">FPS and frame-gap figures measure browser animation frames, not GPU-only execution time or end-to-end camera-to-display latency. Background tabs and startup/loading can distort results. Synchronous MediaPipe inference can stall the main thread.</p>
      {(off || on) && <button className="perf-copy" type="button" onClick={() => {
        const summary = { viewer: renderMetrics?.quality, baseline: off, cameraOn: on, fpsDifferencePct: delta, collectedAt: new Date().toISOString() };
        navigator.clipboard?.writeText(JSON.stringify(summary, null, 2)).catch(() => {});
      }}>Copy performance report</button>}
    </div>}
  </section>;
}
