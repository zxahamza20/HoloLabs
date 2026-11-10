import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { describeCameraError, getHandLabel, renderHandLandmarks } from './landmarkDrawing.js';
import { GestureEngine, GESTURE_LABELS, GESTURES } from './gestureRecognizer.js';
import Icon from '../components/Icon.jsx';

const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const EMPTY_STATS = { hands: 0, trackingFps: 0, inferenceMs: null, handedness: [], delegate: '—' };
const EMPTY_GESTURES = { hands: [], twoHand: { active: false, separation: null, zoomFactor: 1 } };
const GESTURE_GUIDE = [
  { key: GESTURES.POINT, hint: 'Extend index finger only' },
  { key: GESTURES.PINCH, hint: 'Touch index tip to thumb tip' },
  { key: GESTURES.OPEN_PALM, hint: 'Extend all four fingers' },
  { key: GESTURES.FIST, hint: 'Curl all four fingers' },
];

export default function HandTrackingPanel({ onClose, onDiagnostics }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const gestureEngineRef = useRef(new GestureEngine());
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [delegateChoice, setDelegateChoice] = useState('auto');
  const [targetFps, setTargetFps] = useState(15);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [sensitivity, setSensitivity] = useState('balanced');
  const [gestureState, setGestureState] = useState(EMPTY_GESTURES);

  const releaseResources = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (landmarkerRef.current) {
      try { landmarkerRef.current.close(); } catch (error) { console.warn('Landmarker cleanup:', error); }
      landmarkerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) { video.pause(); video.srcObject = null; }
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const stopCamera = useCallback(() => {
    generationRef.current += 1;
    releaseResources();
    setStats(EMPTY_STATS);
    gestureEngineRef.current.reset();
    setGestureState(EMPTY_GESTURES);
    setErrorMessage('');
    setStatus('idle');
  }, [releaseResources]);

  useEffect(() => () => { generationRef.current += 1; releaseResources(); }, [releaseResources]);
  useEffect(() => {
    onDiagnostics?.({ status, ...stats });
  }, [onDiagnostics, status, stats]);

  const resetGestureHistory = () => {
    gestureEngineRef.current.reset();
    setGestureState(EMPTY_GESTURES);
  };

  const changeSensitivity = (value) => {
    gestureEngineRef.current.setSensitivity(value);
    setSensitivity(value);
    setGestureState(EMPTY_GESTURES);
  };

  const startCamera = async () => {
    if (busyRef.current || status === 'running') return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Camera access needs a secure context. Use the Vite localhost URL (or HTTPS) in Chrome.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const generation = ++generationRef.current;
    setStatus('starting');
    setErrorMessage('');
    setStats(EMPTY_STATS);
    gestureEngineRef.current.reset();
    setGestureState(EMPTY_GESTURES);
    let createdLandmarker = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 }, facingMode: 'user' },
      });
      if (generation !== generationRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Camera preview was removed before initialization finished.');
      video.srcObject = stream;
      await video.play();
      if (generation !== generationRef.current) return;

      setStatus('loading-model');
      const fileset = await FilesetResolver.forVisionTasks(VISION_WASM);
      if (generation !== generationRef.current) return;
      let chosenDelegate = 'CPU';
      let gpuFailure = null;
      for (const delegate of (delegateChoice === 'cpu' ? ['CPU'] : ['GPU', 'CPU'])) {
        try {
          createdLandmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: HAND_MODEL, delegate },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          chosenDelegate = delegate;
          break;
        } catch (error) {
          if (delegate === 'GPU') gpuFailure = error;
          else throw new Error(`MediaPipe initialization failed: ${error.message || error}`);
        }
      }
      if (!createdLandmarker) throw new Error('Could not create hand tracker.');
      if (generation !== generationRef.current) { createdLandmarker.close(); createdLandmarker = null; return; }
      if (gpuFailure) console.info('MediaPipe GPU unavailable, using CPU fallback:', gpuFailure);
      landmarkerRef.current = createdLandmarker;
      createdLandmarker = null;
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480; }
      setStatus('running');
      setStats({ ...EMPTY_STATS, delegate: chosenDelegate });

      let lastVideoTime = -1;
      let lastDetectionAt = 0;
      let windowStart = performance.now();
      let detectionCount = 0;
      let lastDisplayAt = 0;
      let lastInference = null;
      let lastHands = [];
      let lastHandCount = 0;
      let lastGestureDisplayAt = 0;
      let lastGestureSignature = '';
      const interval = 1000 / targetFps;
      const tick = (now) => {
        if (generation !== generationRef.current) return;
        rafRef.current = requestAnimationFrame(tick);
        if (document.hidden || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        if (now - lastDetectionAt < interval || video.currentTime === lastVideoTime) return;
        lastDetectionAt = now;
        lastVideoTime = video.currentTime;
        try {
          const inferenceStart = performance.now();
          const results = landmarkerRef.current.detectForVideo(video, inferenceStart);
          lastInference = Math.round((performance.now() - inferenceStart) * 10) / 10;
          renderHandLandmarks(canvasRef.current, results);
          lastHandCount = results.landmarks?.length || 0;
          lastHands = (results.handedness || []).map(getHandLabel);
          const gestures = gestureEngineRef.current.process(results, inferenceStart);
          const signature = gestures.hands.map(hand => `${hand.id}:${hand.gesture}:${hand.raw}`).join('|') + `:${gestures.twoHand.active}`;
          if (signature !== lastGestureSignature || inferenceStart - lastGestureDisplayAt >= 110) {
            setGestureState(gestures);
            lastGestureSignature = signature;
            lastGestureDisplayAt = inferenceStart;
          }
          detectionCount += 1;
          const elapsed = performance.now() - windowStart;
          if (elapsed >= 700 && performance.now() - lastDisplayAt >= 600) {
            const trackingFps = Math.round(detectionCount * 1000 / elapsed);
            setStats({ hands: lastHandCount, handedness: lastHands, inferenceMs: lastInference, trackingFps, delegate: chosenDelegate });
            windowStart = performance.now();
            lastDisplayAt = windowStart;
            detectionCount = 0;
          }
        } catch (error) {
          // Avoid an endlessly failing animation loop when a device or GPU context disappears.
          generationRef.current += 1;
          releaseResources();
          setStats(EMPTY_STATS);
          gestureEngineRef.current.reset();
          setGestureState(EMPTY_GESTURES);
          setErrorMessage(`Tracking stopped: ${error.message || error}`);
          setStatus('error');
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      if (generation === generationRef.current) {
        releaseResources();
        setStats(EMPTY_STATS);
        gestureEngineRef.current.reset();
        setGestureState(EMPTY_GESTURES);
        setErrorMessage(describeCameraError(error));
        setStatus('error');
      }
    } finally {
      if (createdLandmarker) createdLandmarker.close();
      busyRef.current = false;
      setBusy(false);
    }
  };

  const active = status === 'running';
  const loading = status === 'starting' || status === 'loading-model';
  return <aside id="hand-tracking" className="hand-panel" aria-label="Webcam gesture recognition lab">
    <header className="hand-panel-header">
      <div><span className="hand-overline">COMPUTER VISION / DAY 06</span><h2>Gesture recognition lab</h2></div>
      <button className="hand-icon-button" type="button" onClick={onClose} title="Close and turn off camera" aria-label="Close hand lab and turn off camera"><Icon name="close" size={17}/></button>
    </header>
    <div className="hand-video-frame">
      <video ref={videoRef} className="hand-video" playsInline autoPlay muted aria-label="Live camera feed (mirrored)"/>
      <canvas ref={canvasRef} className="hand-landmarks" aria-hidden="true"/>
      {active && gestureState.hands.map(hand => <span key={hand.id} className={`hand-gesture-tag ${hand.gesture === GESTURES.NONE ? 'unknown' : ''}`}
        style={{ left: `${Math.min(90, Math.max(10, (1 - hand.indexTip.x) * 100))}%`, top: `${Math.min(90, Math.max(9, hand.indexTip.y * 100))}%` }}>
        {GESTURE_LABELS[hand.gesture]}
      </span>)}
      {!active && <div className="hand-video-placeholder"><Icon name="camera" size={29}/><strong>{loading ? 'Initializing tracker…' : 'Camera inactive'}</strong><span>{loading ? 'Allow a moment for the model to load' : 'Video starts only when you allow it'}</span></div>}
      <div className="hand-video-corner hand-video-corner-tl"/><div className="hand-video-corner hand-video-corner-br"/>
      {active && <div className="hand-video-live"><span className="live-dot"/> LIVE · {stats.delegate}</div>}
    </div>
    <div className="hand-metrics" aria-live="off">
      <div><small>HANDS</small><strong>{stats.hands} / 2</strong></div>
      <div><small>TRACKING</small><strong>{active ? `${stats.trackingFps} FPS` : '—'}</strong></div>
      <div><small>INFERENCE</small><strong>{stats.inferenceMs == null ? '—' : `${stats.inferenceMs} ms`}</strong></div>
    </div>
    {active && <div className="hand-label-row">{stats.handedness.length ? stats.handedness.map((hand, index) => <span key={`${hand}:${index}`} className="hand-label">{hand} · 21 points</span>) : <span className="hand-hint">Show your hands in the frame</span>}</div>}
    <section className="hand-recognition" aria-label="Live gesture recognition">
      <div className="hand-section-heading"><strong>GESTURE SIGNALS</strong><span>{active ? 'Live · recognition only' : 'Start camera to test'}</span></div>
      {gestureState.hands.length ? <div className="hand-gesture-cards">
        {gestureState.hands.map(hand => <div key={hand.id} className={`hand-gesture-card ${hand.gesture !== GESTURES.NONE ? 'detected' : ''}`}>
          <div><span>{hand.handedness} hand · #{hand.id}</span><strong>{GESTURE_LABELS[hand.gesture]}</strong></div>
          <small>{hand.gesture === GESTURES.NONE && hand.raw !== GESTURES.NONE ? `Confirming ${GESTURE_LABELS[hand.raw]}…` : hand.gesture === GESTURES.OPEN_PALM ? `Held ${Math.round(hand.heldMs / 100) / 10}s · hold 0.6s for future Discovery Mode` : `Pinch gap: ${hand.pinchRatio.toFixed(2)} palm widths`}</small>
        </div>)}
      </div> : <p className="hand-recognition-empty">{active ? 'Show one or two hands. Hold a gesture briefly to stabilize detection.' : 'Detected gestures will appear here.'}</p>}
      <div className={`hand-zoom-preview ${gestureState.twoHand.active ? 'active' : ''}`}>
        <span>TWO-HAND PINCH / ZOOM</span><strong>{gestureState.twoHand.active ? `${gestureState.twoHand.zoomFactor.toFixed(2)}×` : 'INACTIVE'}</strong>
        <small>{gestureState.twoHand.active ? 'Move pinched hands apart or together to change the preview factor' : 'Pinch with both hands to activate'}</small>
      </div>
    </section>
    {errorMessage && <div className="hand-error" role="alert">{errorMessage}</div>}
    <div className="hand-control-row">
      <label>Processor<select value={delegateChoice} onChange={event => setDelegateChoice(event.target.value)} disabled={active || loading}><option value="auto">Auto (GPU → CPU)</option><option value="cpu">CPU only</option></select></label>
      <label>Target rate<select value={targetFps} onChange={event => setTargetFps(Number(event.target.value))} disabled={active || loading}><option value={10}>10 FPS</option><option value={15}>15 FPS</option><option value={20}>20 FPS</option><option value={30}>30 FPS</option></select></label>
    </div>
    <div className="hand-gesture-settings">
      <label>Gesture sensitivity<select value={sensitivity} onChange={event => changeSensitivity(event.target.value)}><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="precise">Precise</option></select></label>
      <button type="button" onClick={resetGestureHistory} title="Clear gesture history and reset stabilization without restarting the camera">Reset gestures</button>
    </div>
    <details className="hand-gesture-guide"><summary>Gesture reference</summary><ul>{GESTURE_GUIDE.map(item => <li key={item.key}><strong>{GESTURE_LABELS[item.key]}</strong><span>{item.hint}</span></li>)}</ul><p>Two-hand zoom: pinch both hands and change their distance. All signals are previews; they do not move the 3D scene today.</p></details>
    <div className="hand-button-row">
      {active || loading ? <button type="button" className="hand-stop-button" onClick={stopCamera}><Icon name="pause" size={16}/> Stop camera</button>
        : <button type="button" className="hand-start-button" disabled={busy} onClick={startCamera}><Icon name="camera" size={16}/> Start camera</button>}
    </div>
    <p className="hand-privacy">Processing runs on this device. First use downloads the MediaPipe model and WebAssembly runtime. Video is not uploaded by HOLOLAB. This lab recognizes gestures locally; moving 3D models with gestures is scheduled for Day 7 and Week 2.</p>
  </aside>;
}
