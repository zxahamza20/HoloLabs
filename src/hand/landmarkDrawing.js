// Pure drawing/formatting helpers. MediaPipe delivers 21 normalized points
// per detected hand. These functions do NOT infer gestures (Day 6).
export const HAND_CONNECTIONS = Object.freeze([
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]);
export const FINGERTIP_INDICES = new Set([4, 8, 12, 16, 20]);

export function getHandLabel(handednessEntry) {
  // The MediaPipe result is an array of categories for each detected hand.
  return handednessEntry?.[0]?.categoryName || 'Unknown';
}

export function renderHandLandmarks(canvas, result) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  const allHands = result?.landmarks || [];
  allHands.forEach((points, handIndex) => {
    if (points.length !== 21) return;
    const color = handIndex === 0 ? '#77f5ee' : '#f4adff';
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, width / 270);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;
    for (const [start, end] of HAND_CONNECTIONS) {
      const a = points[start];
      const b = points[end];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height,
        FINGERTIP_INDICES.has(index) ? Math.max(4, width / 135) : Math.max(2, width / 220), 0, Math.PI * 2);
      ctx.fillStyle = FINGERTIP_INDICES.has(index) ? '#ffffff' : color;
      ctx.fill();
    });
  });
}

export function describeCameraError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission was denied. Allow camera access in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No webcam was found. Connect a camera or enable the built-in camera.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The webcam is busy or cannot be opened. Close other camera apps and try again.';
    case 'OverconstrainedError':
      return 'The camera cannot provide the requested video format.';
    default:
      return error?.message || 'Camera or hand-tracking initialization failed.';
  }
}
