import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { describeCameraError, getHandLabel, renderHandLandmarks } from './landmarkDrawing.js';
import Icon from '../components/Icon.jsx';

const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const EMPTY_STATS = { hands: 0, trackingFps: 0, inferenceMs: null, handedness: [], delegate: '—' };

export default function HandTrackingPanel({ onClose, onDiagnostics }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [delegateChoice, setDelegateChoice] = useState('auto');
  const [targetFps, setTargetFps] = useState(15);
  const [stats, setStats] = useState(EMPTY_STATS);

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
    setErrorMessage('');
    setStatus('idle');
  }, [releaseResources]);

  useEffect(() => () => { generationRef.current += 1; releaseResources(); }, [releaseResources]);
  useEffect(() => {
    onDiagnostics?.({ status, ...stats });
  }, [onDiagnostics, status, stats]);

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
          setErrorMessage(`Tracking stopped: ${error.message || error}`);
          setStatus('error');
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      if (generation === generationRef.current) {
        releaseResources();
        setStats(EMPTY_STATS);
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
  return <aside id="hand-tracking" className="hand-panel" aria-label="Webcam hand tracking lab">
    <header className="hand-panel-header">
      <div><span className="hand-overline">COMPUTER VISION / DAY 05</span><h2>Hand tracking lab</h2></div>
      <button className="hand-icon-button" type="button" onClick={onClose} title="Close and turn off camera" aria-label="Close hand lab and turn off camera"><Icon name="close" size={17}/></button>
    </header>
    <div className="hand-video-frame">
      <video ref={videoRef} className="hand-video" playsInline autoPlay muted aria-label="Live camera feed (mirrored)"/>
      <canvas ref={canvasRef} className="hand-landmarks" aria-hidden="true"/>
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
    {errorMessage && <div className="hand-error" role="alert">{errorMessage}</div>}
    <div className="hand-control-row">
      <label>Processor<select value={delegateChoice} onChange={event => setDelegateChoice(event.target.value)} disabled={active || loading}><option value="auto">Auto (GPU → CPU)</option><option value="cpu">CPU only</option></select></label>
      <label>Target rate<select value={targetFps} onChange={event => setTargetFps(Number(event.target.value))} disabled={active || loading}><option value={10}>10 FPS</option><option value={15}>15 FPS</option><option value={20}>20 FPS</option><option value={30}>30 FPS</option></select></label>
    </div>
    <div className="hand-button-row">
      {active || loading ? <button type="button" className="hand-stop-button" onClick={stopCamera}><Icon name="pause" size={16}/> Stop camera</button>
        : <button type="button" className="hand-start-button" disabled={busy} onClick={startCamera}><Icon name="camera" size={16}/> Start camera</button>}
    </div>
    <p className="hand-privacy">Processing runs on this device. First use downloads the MediaPipe model and WebAssembly runtime. Video is not uploaded by HOLOLAB. Gesture control begins on Day 6–7.</p>
  </aside>;
}
